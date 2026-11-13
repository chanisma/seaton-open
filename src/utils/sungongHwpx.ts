import { unzipSync, zipSync, strToU8, strFromU8, type Zippable } from 'fflate';
import type { SungongMatrix, SungongMatrixRow } from '../services/sungong.service';
import type { SungongPeriodMark } from '../types/sungong.types';

/**
 * 순공 출석부(HWPX) 생성
 *
 * 학교 양식(public/sungong_template.hwpx)을 브라우저에서 로드해
 * (학년, 반) 그룹 × 2일 단위로 페이지를 복제·채워 넣어 .hwpx Blob을 만든다.
 *
 * 양식 구조:
 *  - section0.xml = [secPr 문단] + [표1 문단(학교명·참여학년·관리교사)] + [표2 문단(출석표)] + [안내 문단]
 *  - 표2: 24행 × 20열. 헤더 4행 + 학생행. 20열 = 번호·학번·성명·약점과목(4) + 8교시×2일(16)
 *  - 각 교시 셀: 출석 '.', 보완 = 약점 과목명, 미처리 '/'
 */

const HP_NS = 'http://www.hancom.co.kr/hwpml/2011/paragraph';
const TEMPLATE_URL = `${import.meta.env.BASE_URL}sungong_template.hwpx`;
const SECTION_PATH = 'Contents/section0.xml';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export interface SungongSheetOptions {
  /** 순공관리교사 (다운로드 시 입력) */
  managerTeacher: string;
  /** 학교명 override (미지정 시 양식 값 유지) */
  schoolName?: string;
}

// ---------------------------------------------------------------------------
// 순수 헬퍼
// ---------------------------------------------------------------------------

/** '2026-07-27' → '7.27.(월)' */
const dateLabel = (dateStr: string): string => {
  const [, m, d] = dateStr.split('-').map(Number);
  // 요일 계산 (UTC 기준으로 파싱해 타임존 영향 제거)
  const dow = new Date(`${dateStr}T00:00:00`).getDay();
  return `${m}.${d}.(${WEEKDAYS[dow]})`;
};

/** 교시 셀 표기 */
const markText = (mark: SungongPeriodMark, remedialSubject?: string | null): string => {
  if (mark === 'present') return '.';
  if (mark === 'supplement') return remedialSubject?.trim() || '보완';
  return '/'; // none: 미처리
};

/** 배열을 크기 2 청크로 분할 */
const chunkPairs = <T>(arr: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
};

// ---------------------------------------------------------------------------
// DOM 조작 헬퍼
// ---------------------------------------------------------------------------

const firstByTag = (el: Element, tag: string): Element | null => el.getElementsByTagName(tag)[0] ?? null;

/** 셀(hp:tc)의 텍스트 설정. 빈 문자열이면 텍스트 노드 제거(빈 칸) */
const setCellText = (doc: Document, tc: Element, text: string): void => {
  const run = firstByTag(tc, 'hp:run');
  if (!run) return;
  let t = firstByTag(run, 'hp:t');
  if (!text) {
    if (t) t.parentNode?.removeChild(t);
    return;
  }
  if (!t) {
    t = doc.createElementNS(HP_NS, 'hp:t');
    run.insertBefore(t, run.firstChild);
  }
  t.textContent = text;
};

/** el의 직계/후손 중 특정 tagName 문단(hp:p) 찾기(부모 방향) */
const closestParagraph = (el: Element): Element | null => {
  let n: Node | null = el.parentNode;
  while (n && (n as Element).tagName !== 'hp:p') n = n.parentNode;
  return (n as Element) ?? null;
};

// ---------------------------------------------------------------------------
// 페이지 채우기
// ---------------------------------------------------------------------------

/** 표1(헤더) 채우기: 참여학년 / 관리교사 / (선택)학교명 */
const fillHeaderTable = (
  doc: Document,
  paragraph: Element,
  groupLabel: string,
  manager: string,
  schoolName?: string
): void => {
  const tbl = firstByTag(paragraph, 'hp:tbl');
  if (!tbl) return;
  const texts = Array.from(tbl.getElementsByTagName('hp:t'));

  const yearT = texts.find(t => (t.textContent || '').includes('참여학년'));
  if (yearT) yearT.textContent = `  참여학년 :   ${groupLabel}`;

  if (schoolName) {
    const schoolT = texts.find(t => (t.textContent || '').includes('학 교 명'));
    if (schoolT) schoolT.textContent = `  학 교 명 :   ${schoolName}`;
  }

  // 관리교사 값 셀: colAddr=1, rowAddr=1
  const mgrTc = Array.from(tbl.getElementsByTagName('hp:tc')).find(tc => {
    const a = firstByTag(tc, 'hp:cellAddr');
    return a?.getAttribute('colAddr') === '1' && a?.getAttribute('rowAddr') === '1';
  });
  if (mgrTc) setCellText(doc, mgrTc, manager);
};

/** 표2(출석표) 채우기: 날짜쌍 + 학생행 */
const fillAttendanceTable = (
  doc: Document,
  paragraph: Element,
  matrix: SungongMatrix,
  pair: string[],
  students: SungongMatrixRow[]
): void => {
  const tbl = firstByTag(paragraph, 'hp:tbl');
  if (!tbl) return;

  // 날짜 헤더 2칸 (M.D.(요일) 형태) 치환
  const dateTexts = Array.from(tbl.getElementsByTagName('hp:t')).filter(t =>
    /^\d+\.\d+\.\(.\)$/.test((t.textContent || '').trim())
  );
  if (dateTexts[0]) dateTexts[0].textContent = dateLabel(pair[0]);
  if (dateTexts[1]) dateTexts[1].textContent = pair[1] ? dateLabel(pair[1]) : '';

  // 헤더 4행 유지, 학생행 재구성
  const rows = Array.from(tbl.getElementsByTagName('hp:tr'));
  const studentRows = rows.slice(4);
  if (studentRows.length === 0) return;
  // 첫 학생행(row 4)은 헤더 구분용 굵은 상단선(borderFill 13/15)을 가짐 → 모든 행에 복제하면
  // 행 사이가 이중선처럼 보임. 본문행(row 5, borderFill 16/4=단일 실선)을 템플릿으로 사용.
  const rowTemplate = (studentRows[1] ?? studentRows[0]).cloneNode(true) as Element;
  studentRows.forEach(r => r.parentNode?.removeChild(r));

  students.forEach((row, i) => {
    const tr = rowTemplate.cloneNode(true) as Element;
    const rowAddr = String(4 + i);

    Array.from(tr.getElementsByTagName('hp:tc')).forEach(tc => {
      const addr = firstByTag(tc, 'hp:cellAddr');
      if (!addr) return;
      const col = parseInt(addr.getAttribute('colAddr') || '0', 10);
      addr.setAttribute('rowAddr', rowAddr);

      let text = '';
      if (col === 0) text = String(i + 1);
      else if (col === 1) text = row.student.student_number ?? '';
      else if (col === 2) text = row.student.student_name ?? '';
      else if (col === 3) text = row.student.remedial_subject ?? '';
      else {
        // 교시 셀: col 4~19 → (일자 0/1, 교시 0~7)
        const idx = col - 4;
        const dayIdx = Math.floor(idx / 8);
        const periodIdx = idx % 8;
        const date = pair[dayIdx];
        const period = matrix.periods[periodIdx];
        if (date && period) {
          const mark = row.marks[date]?.[period.id] ?? 'none';
          text = markText(mark, row.student.remedial_subject);
        }
      }
      setCellText(doc, tc, text);
    });

    tbl.appendChild(tr);
  });

  tbl.setAttribute('rowCnt', String(4 + students.length));
};

// ---------------------------------------------------------------------------
// 메인 생성
// ---------------------------------------------------------------------------

/** 매트릭스 → 순공 출석부 HWPX Blob */
export const generateSungongAttendanceHwpx = async (
  matrix: SungongMatrix,
  options: SungongSheetOptions
): Promise<Blob> => {
  if (matrix.rows.length === 0) {
    throw new Error('출석부를 생성할 순공 학생이 없습니다. 명단을 먼저 등록하세요.');
  }
  if (matrix.dates.length === 0) {
    throw new Error('운영 기간(자습일)이 설정되지 않았습니다. 열람실 운영 기간을 확인하세요.');
  }

  // 1) 양식 로드 & 해제
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error('출석부 양식 파일을 불러오지 못했습니다.');
  const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
  const sectionXml = strFromU8(files[SECTION_PATH]);

  // 2) XML 파싱
  const doc = new DOMParser().parseFromString(sectionXml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('출석부 양식 XML 파싱에 실패했습니다.');
  }
  const sec = doc.documentElement;

  // 표1/표2가 담긴 문단(페이지 템플릿) 추출
  const tables = Array.from(doc.getElementsByTagName('hp:tbl'));
  const headerTbl = tables.find(
    t => t.textContent?.includes('학 교 명') || t.textContent?.includes('참여학년')
  );
  const attendanceTbl = tables.find(t => t !== headerTbl);
  if (!headerTbl || !attendanceTbl) throw new Error('양식에서 표를 찾을 수 없습니다.');

  const headerParaTpl = closestParagraph(headerTbl);
  const attendanceParaTpl = closestParagraph(attendanceTbl);
  if (!headerParaTpl || !attendanceParaTpl) throw new Error('양식 문단 구조를 해석할 수 없습니다.');

  // 안내 문단(페이지 삽입 기준점) 찾기
  const noteParagraph =
    Array.from(sec.childNodes).find(
      n => (n as Element).tagName === 'hp:p' && ((n as Element).textContent || '').includes('관리교사는')
    ) ?? null;

  // 원본 페이지 문단 제거(복제본을 다시 삽입)
  headerParaTpl.parentNode?.removeChild(headerParaTpl);
  attendanceParaTpl.parentNode?.removeChild(attendanceParaTpl);

  // 3) 그룹핑 (학년, 반) — 이미 rows는 반→학번 순 정렬됨
  const groupMap = new Map<string, SungongMatrixRow[]>();
  for (const row of matrix.rows) {
    const grade = row.student.student_grade ?? 0;
    const zone = row.student.zone ?? '';
    const key = `${grade}|${zone}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(row);
  }
  const groupKeys = [...groupMap.keys()].sort((a, b) => {
    const [ga, za] = a.split('|');
    const [gb, zb] = b.split('|');
    if (ga !== gb) return Number(ga) - Number(gb);
    return za.localeCompare(zb);
  });

  const pairs = chunkPairs(matrix.dates);

  // 4) 페이지 생성: 각 그룹 × 각 날짜쌍
  let pageIndex = 0;
  for (const key of groupKeys) {
    const students = groupMap.get(key)!;
    if (students.length === 0) continue;
    const [gradeStr, zone] = key.split('|');
    const groupLabel = zone ? `${gradeStr}학년(${zone}반)` : `${gradeStr}학년`;

    for (const pair of pairs) {
      const c1 = headerParaTpl.cloneNode(true) as Element;
      const c2 = attendanceParaTpl.cloneNode(true) as Element;

      // 첫 페이지 이후에는 페이지 나누기
      if (pageIndex > 0) c1.setAttribute('pageBreak', '1');

      fillHeaderTable(doc, c1, groupLabel, options.managerTeacher, options.schoolName);
      fillAttendanceTable(doc, c2, matrix, pair, students);

      if (noteParagraph) {
        sec.insertBefore(c1, noteParagraph);
        sec.insertBefore(c2, noteParagraph);
      } else {
        sec.appendChild(c1);
        sec.appendChild(c2);
      }
      pageIndex += 1;
    }
  }

  // 5) 직렬화 & 재압축
  let out = new XMLSerializer().serializeToString(doc);
  if (!out.startsWith('<?xml')) {
    out = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n' + out;
  }
  files[SECTION_PATH] = strToU8(out);

  // mimetype은 반드시 첫 항목 + 무압축(STORE)
  const names = Object.keys(files);
  const ordered = names.includes('mimetype')
    ? ['mimetype', ...names.filter(n => n !== 'mimetype')]
    : names;
  const rebuilt: Zippable = {};
  for (const n of ordered) {
    rebuilt[n] = n === 'mimetype' ? [files[n], { level: 0 }] : files[n];
  }

  const zipped = zipSync(rebuilt);
  return new Blob([zipped], { type: 'application/hwp+zip' });
};

/** 순공 출석부 생성 후 브라우저 다운로드 */
export const downloadSungongAttendanceSheet = async (
  matrix: SungongMatrix,
  options: SungongSheetOptions,
  fileName = '순공출석부.hwpx'
): Promise<void> => {
  const blob = await generateSungongAttendanceHwpx(matrix, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.hwpx') ? fileName : `${fileName}.hwpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
