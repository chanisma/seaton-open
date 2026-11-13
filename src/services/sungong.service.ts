import { supabase } from '@/lib/supabase';
import { eachDayOfInterval, parseISO } from 'date-fns';

import type { StudyRoom, OperatingPeriod } from '../types/reservation.types';
import type {
  SungongStudentWithDetails,
  SungongZone,
  SungongStudentStat,
  SungongDailySummary,
  SungongPeriodMark,
} from '../types/sungong.types';
import { enrichWithResourceMeta } from '@utils/resourceEnrichment';
import { formatDate } from '@utils/dateHelpers';

/**
 * 순공(방학학습) 서비스 — 학년 단위
 * - 순공은 학년별로 운영. 같은 학년의 순공 열람실들은 명단을 공유한다.
 * - 반(A/B)은 명단(sungong_students.zone)에 명시 저장한다.
 * - 출석 매트릭스는 해당 학년의 모든 순공 열람실 예약을 집계한 단일 소스.
 */

// sungong_students 테이블은 생성된 Supabase 타입에 없으므로 loose 클라이언트 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ============================================================================
// Helpers
// ============================================================================

/** Supabase 1000행 제한 우회 페이징 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchAllPaginated = async <T = any>(
  queryFactory: () => any,
  pageSize = 1000
): Promise<T[]> => {
  let all: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = [...all, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
};

/** 학번(GCCNN): 학년 + 반(2자리) + 번호(2자리). 예: 3학년 1반 1번 → '30101' */
const buildGccnn = (
  grade?: number | null,
  cls?: number | null,
  number?: number | null
): string | undefined => {
  if (grade == null || cls == null || number == null) return undefined;
  return `${grade}${String(cls).padStart(2, '0')}${String(number).padStart(2, '0')}`;
};

/** 운영 교시 목록 (id 오름차순) */
export const getRoomPeriods = (room: StudyRoom): OperatingPeriod[] =>
  [...(room.operating_periods || [])].sort((a, b) => a.id - b.id);

/** 열람실 운영 날짜 목록 (운영기간 × 운영요일) */
export const getSungongDates = (room: StudyRoom): string[] => {
  const opDays =
    room.operating_days && room.operating_days.length > 0 ? room.operating_days : [1, 2, 3, 4, 5];
  if (room.fixed_start_date && room.fixed_end_date) {
    return eachDayOfInterval({
      start: parseISO(room.fixed_start_date),
      end: parseISO(room.fixed_end_date),
    })
      .filter(d => opDays.includes(d.getDay()))
      .map(formatDate);
  }
  return [];
};

// ============================================================================
// 순공 열람실 / 학년
// ============================================================================

/** 활성화된 순공 열람실 목록 */
export const getActiveSungongRooms = async (): Promise<StudyRoom[]> => {
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('is_sungong', true)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching sungong rooms:', error);
    return [];
  }
  return (data || []) as unknown as StudyRoom[];
};

/** 순공이 운영되는 학년 목록 (활성 순공 열람실 기준, 오름차순) */
export const getActiveSungongGrades = async (): Promise<number[]> => {
  const rooms = await getActiveSungongRooms();
  const grades = new Set<number>();
  rooms.forEach(r => {
    (r.grades && r.grades.length > 0 ? r.grades : r.grade != null ? [r.grade] : []).forEach(g =>
      grades.add(g)
    );
  });
  return [...grades].sort((a, b) => a - b);
};

/** 특정 학년의 활성 순공 열람실 */
export const getSungongRoomsByGrade = async (grade: number): Promise<StudyRoom[]> => {
  const rooms = await getActiveSungongRooms();
  return rooms.filter(r =>
    (r.grades && r.grades.length > 0 ? r.grades : r.grade != null ? [r.grade] : []).includes(grade)
  );
};

// ============================================================================
// 순공 대상자 명단 (학년 단위)
// ============================================================================

/** enrichment + GCCNN 적용 매핑 */
const mapRosterRow = (row: any): SungongStudentWithDetails => {
  const p = row.profiles || {};
  return {
    ...row,
    student_name: p.name ?? '',
    student_grade: p.grade != null ? Number(p.grade) : undefined,
    student_class: p.class != null ? Number(p.class) : undefined,
    student_number: buildGccnn(
      p.grade != null ? Number(p.grade) : null,
      p.class != null ? Number(p.class) : null,
      p.number != null ? Number(p.number) : null
    ),
  } as SungongStudentWithDetails;
};

/**
 * 명단 행에 각 학생이 신청(예약)한 순공 열람실 좌석을 병합한다.
 * - 학생은 (날짜·교시)별로 여러 예약 행을 가질 수 있어 대표 좌석 1개를 도출한다.
 * - 대표 좌석 = 가장 많이 예약한 좌석(최빈값), 동률이면 최근 예약일 우선.
 */
const attachReservedSeats = async (
  grade: number,
  rows: SungongStudentWithDetails[]
): Promise<void> => {
  if (rows.length === 0) return;
  const rooms = await getSungongRoomsByGrade(grade);
  const roomIds = rooms.map(r => r.id);
  if (roomIds.length === 0) return;

  const studentIds = new Set(rows.map(r => r.student_id));

  // 순공 운영 기간으로 조회 범위 축소 (미설정 시 전체)
  const dates = [...new Set(rooms.flatMap(getSungongDates))].sort();
  const rangeStart = dates.length > 0 ? dates[0] : undefined;
  const rangeEnd = dates.length > 0 ? dates[dates.length - 1] : undefined;

  const reservations = await fetchAllPaginated<any>(() => {
    let q = supabase
      .from('seat_reservations')
      .select('student_id, seat_number, reservation_date')
      .in('room_id', roomIds);
    if (rangeStart) q = q.gte('reservation_date', rangeStart);
    if (rangeEnd) q = q.lte('reservation_date', rangeEnd);
    return q;
  });

  // 학생별 좌석 빈도·최근일 집계
  const byStudent = new Map<string, Map<string, { count: number; latest: string }>>();
  reservations.forEach(r => {
    if (!studentIds.has(r.student_id) || !r.seat_number) return;
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, new Map());
    const seatMap = byStudent.get(r.student_id)!;
    const prev = seatMap.get(r.seat_number);
    if (!prev) seatMap.set(r.seat_number, { count: 1, latest: r.reservation_date });
    else {
      prev.count += 1;
      if (r.reservation_date > prev.latest) prev.latest = r.reservation_date;
    }
  });

  rows.forEach(row => {
    const seatMap = byStudent.get(row.student_id);
    if (!seatMap || seatMap.size === 0) return;
    let best: string | undefined;
    let bestCount = -1;
    let bestLatest = '';
    seatMap.forEach((v, seat) => {
      if (v.count > bestCount || (v.count === bestCount && v.latest > bestLatest)) {
        best = seat;
        bestCount = v.count;
        bestLatest = v.latest;
      }
    });
    row.seat_number = best;
  });
};

/**
 * 학년별 순공 명단 조회 (enrichment + GCCNN + zone)
 * @param includeSeats 각 학생이 신청한 순공 열람실 좌석(seat_number)까지 병합할지 여부
 */
export const getSungongRoster = async (
  grade: number,
  includeSeats = false
): Promise<SungongStudentWithDetails[]> => {
  const { data, error } = await db
    .from('sungong_students')
    .select('*, profiles!student_id(id, email, name)')
    .eq('grade', grade);

  if (error) {
    console.error('Error fetching sungong roster:', error);
    throw new Error('순공 명단을 불러오는데 실패했습니다.');
  }

  const enriched = await enrichWithResourceMeta((data || []) as any[]);
  const rows = enriched.map(mapRosterRow);
  if (includeSeats) await attachReservedSeats(grade, rows);
  // 반 → 학번 순 정렬
  rows.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return (a.student_number ?? '').localeCompare(b.student_number ?? '', 'ko');
  });
  return rows;
};

/** 순공 대상자 추가 */
export const addSungongStudent = async (
  grade: number,
  studentId: string,
  opts?: { remedialSubject?: string | null; zone?: SungongZone }
): Promise<void> => {
  const { error } = await db.from('sungong_students').insert({
    grade,
    student_id: studentId,
    zone: opts?.zone ?? 'A',
    remedial_subject: opts?.remedialSubject?.trim() || null,
  });

  if (error) {
    console.error('Error adding sungong student:', error);
    throw new Error(`대상자 추가에 실패했습니다: ${error.message}`);
  }
};

/** 순공 대상자 일괄 추가 (이미 등록된 학생은 건너뜀) */
export const bulkAddSungongStudents = async (
  grade: number,
  entries: { studentId: string; remedialSubject?: string | null; zone?: SungongZone }[]
): Promise<void> => {
  if (entries.length === 0) return;
  const rows = entries.map(e => ({
    grade,
    student_id: e.studentId,
    zone: e.zone ?? 'A',
    remedial_subject: e.remedialSubject?.trim() || null,
  }));

  const { error } = await db
    .from('sungong_students')
    .upsert(rows, { onConflict: 'grade,student_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error bulk adding sungong students:', error);
    throw new Error(`대상자 일괄 추가에 실패했습니다: ${error.message}`);
  }
};

/** 순공 대상자 수정 (약점 과목 / 반) */
export const updateSungongStudent = async (
  id: string,
  updates: { remedial_subject?: string | null; zone?: SungongZone }
): Promise<void> => {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ('remedial_subject' in updates)
    patch.remedial_subject = updates.remedial_subject?.trim() || null;
  if ('zone' in updates && updates.zone) patch.zone = updates.zone;

  const { error } = await db.from('sungong_students').update(patch).eq('id', id);

  if (error) {
    console.error('Error updating sungong student:', error);
    throw new Error(`수정에 실패했습니다: ${error.message}`);
  }
};

/** 순공 대상자 제거 */
export const removeSungongStudent = async (id: string): Promise<void> => {
  const { error } = await db.from('sungong_students').delete().eq('id', id);
  if (error) {
    console.error('Error removing sungong student:', error);
    throw new Error('대상자 제거에 실패했습니다.');
  }
};

// ============================================================================
// 출석 매트릭스 (학년 단위 · 출석부/통계 단일 소스)
// ============================================================================

export interface SungongMatrixRow {
  student: SungongStudentWithDetails; // zone(명단), 학번(GCCNN) 포함
  /** date -> periodId -> mark */
  marks: Record<string, Record<number, SungongPeriodMark>>;
  stat: SungongStudentStat;
}

export interface SungongMatrix {
  grade: number;
  rooms: StudyRoom[];
  representativeRoom: StudyRoom;
  dates: string[];
  periods: OperatingPeriod[];
  rows: SungongMatrixRow[];
}

/**
 * 학년별 순공 출석 매트릭스
 * - 명단(roster) 학생들의 해당 학년 순공 열람실 예약 출석을 (날짜 × 교시)로 펼침
 * - 반(A/B)은 명단의 zone 사용 (좌석 파생 아님 → 확정적)
 */
export const getSungongMatrixByGrade = async (
  grade: number,
  datesOverride?: string[]
): Promise<SungongMatrix | null> => {
  const rooms = await getSungongRoomsByGrade(grade);
  if (rooms.length === 0) return null;
  const representativeRoom = rooms[0];
  const periods = getRoomPeriods(representativeRoom);
  const roster = await getSungongRoster(grade);
  const rosterIds = new Set(roster.map(r => r.student_id));

  // 날짜: 모든 순공 열람실 운영일의 합집합
  let dates = datesOverride ?? [...new Set(rooms.flatMap(getSungongDates))].sort();

  // 명단 학생들의 순공 열람실 예약 조회 (기간 내, 페이징)
  const roomIds = rooms.map(r => r.id);
  let reservations: any[] = [];
  if (rosterIds.size > 0 && roomIds.length > 0) {
    const rangeStart = dates.length > 0 ? dates[0] : undefined;
    const rangeEnd = dates.length > 0 ? dates[dates.length - 1] : undefined;

    reservations = await fetchAllPaginated<any>(() => {
      let q = supabase
        .from('seat_reservations')
        .select(
          'student_id, seat_number, reservation_date, period_id, is_attended, attendance_status, room_id'
        )
        .in('room_id', roomIds);
      if (rangeStart) q = q.gte('reservation_date', rangeStart);
      if (rangeEnd) q = q.lte('reservation_date', rangeEnd);
      return q;
    });
    reservations = reservations.filter(r => rosterIds.has(r.student_id));
  }

  // 운영일 미설정이면 실제 예약일에서 도출
  if (dates.length === 0 && reservations.length > 0) {
    dates = [...new Set(reservations.map(r => r.reservation_date))].sort();
  }

  // 학생별 예약 그룹
  const byStudent = new Map<string, any[]>();
  reservations.forEach(r => {
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, []);
    byStudent.get(r.student_id)!.push(r);
  });

  const rows: SungongMatrixRow[] = roster.map(student => {
    const rs = byStudent.get(student.student_id) || [];

    // (날짜|교시) → 예약 룩업 (여러 열람실 예약 시 출석/보완 우선)
    const resByKey = new Map<string, any>();
    rs.forEach(r => {
      const key = `${r.reservation_date}|${r.period_id}`;
      const prev = resByKey.get(key);
      if (!prev) resByKey.set(key, r);
      else {
        // 보완 > 출석 > 미출석 우선
        const rank = (x: any) => (x.attendance_status === 'supplement' ? 2 : x.is_attended ? 1 : 0);
        if (rank(r) > rank(prev)) resByKey.set(key, r);
      }
    });

    const marks: Record<string, Record<number, SungongPeriodMark>> = {};
    let present = 0;
    let supplement = 0;
    let none = 0;

    dates.forEach(d => {
      marks[d] = {};
      periods.forEach(p => {
        const r = resByKey.get(`${d}|${p.id}`);
        let mark: SungongPeriodMark = 'none';
        if (r) {
          if (r.attendance_status === 'supplement') mark = 'supplement';
          else if (r.is_attended) mark = 'present';
          else mark = 'none';
        }
        marks[d][p.id] = mark;
        if (mark === 'present') present += 1;
        else if (mark === 'supplement') supplement += 1;
        else none += 1;
      });
    });

    const total = dates.length * periods.length;
    const stat: SungongStudentStat = {
      student_id: student.student_id,
      student_name: student.student_name ?? '',
      student_grade: student.student_grade,
      student_class: student.student_class,
      student_number: student.student_number,
      zone: student.zone,
      remedial_subject: student.remedial_subject,
      totalPeriods: total,
      presentCount: present,
      supplementCount: supplement,
      noneCount: none,
      attendanceRate: total > 0 ? Math.round(((present + supplement) / total) * 1000) / 10 : 0,
    };

    return { student, marks, stat };
  });

  // 반 → 학번 순 정렬
  rows.sort((a, b) => {
    if (a.student.zone !== b.student.zone) return a.student.zone.localeCompare(b.student.zone);
    return (a.student.student_number ?? '').localeCompare(b.student.student_number ?? '', 'ko');
  });

  return { grade, rooms, representativeRoom, dates, periods, rows };
};

/** 매트릭스에서 자습일별·반별 출석 요약 도출 */
export const buildDailySummaries = (matrix: SungongMatrix): SungongDailySummary[] => {
  const zones: SungongZone[] = ['A', 'B'];
  const result: SungongDailySummary[] = [];

  matrix.dates.forEach(date => {
    zones.forEach(zone => {
      const zoneRows = matrix.rows.filter(r => r.student.zone === zone);
      if (zoneRows.length === 0) return;
      let present = 0;
      let supplement = 0;
      let none = 0;
      zoneRows.forEach(row => {
        matrix.periods.forEach(p => {
          const m = row.marks[date]?.[p.id] ?? 'none';
          if (m === 'present') present += 1;
          else if (m === 'supplement') supplement += 1;
          else none += 1;
        });
      });
      result.push({
        date,
        grade: matrix.grade,
        zone,
        total: zoneRows.length * matrix.periods.length,
        presentCount: present,
        supplementCount: supplement,
        noneCount: none,
      });
    });
  });
  return result;
};
