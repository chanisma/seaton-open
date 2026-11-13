/**
 * 출석 CSV 가져오기 — 학번 매칭 (순수 함수)
 *
 * resource 에는 email 컬럼이 없다. 학생 이메일 = `${resource.meta.id}@myschool.hs.kr` 이고
 * 그것이 profiles.email 과 맞는다 (CLAUDE.md «테이블 관계»).
 * CSV 학번은 내보내기 형식(meta.id, 예: '00-00597')이 기본이고, 숫자만 적힌 값도 받는다.
 */

export const STUDENT_EMAIL_DOMAIN = 'myschool.hs.kr';

export const digitsOnly = (value: string) => String(value).replace(/\D/g, '');

/** meta.id 형식(YY-NNNNN)으로 확정할 수 있으면 그 값, 아니면 null */
export const exactStudentId = (raw: string): string | null => {
  const d = digitsOnly(raw);
  return d.length === 7 ? `${d.slice(0, 2)}-${d.slice(2)}` : null;
};

export const studentEmailOf = (metaId: string) => `${metaId}@${STUDENT_EMAIL_DOMAIN}`;

/**
 * CSV 학번 → resource.meta.id
 * - 7자리(YY-NNNNN)면 정확히 같은 학번만
 * - 그 밖의 숫자는 meta.id 숫자 안에 들어 있는 학번이 «딱 하나»일 때만 (동명이 아니라 동번호 모호성 방지)
 */
export const resolveStudentIds = (rawKeys: string[], metaIds: string[]): Map<string, string> => {
  const result = new Map<string, string>();
  const known = new Set(metaIds);
  for (const raw of rawKeys) {
    const exact = exactStudentId(raw);
    if (exact) {
      if (known.has(exact)) result.set(raw, exact);
      continue;
    }
    const d = digitsOnly(raw);
    if (!d) continue;
    const hits = metaIds.filter(id => digitsOnly(id).includes(d));
    if (hits.length === 1) result.set(raw, hits[0]);
  }
  return result;
};
