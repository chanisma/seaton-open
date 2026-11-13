/**
 * CSV 직렬화 유틸리티
 *
 * 이름이나 열람실명에 쉼표/따옴표/줄바꿈이 들어가면 컬럼이 밀리므로
 * 모든 셀은 반드시 csvEscape를 거쳐야 합니다.
 */

/** CSV 한 셀을 RFC 4180 규칙으로 이스케이프합니다. */
export const csvEscape = (value: string | number | null | undefined): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** 2차원 배열을 CSV 문자열로 변환합니다. */
export const rowsToCSV = (rows: (string | number | null | undefined)[][]): string =>
  rows.map(row => row.map(csvEscape).join(',')).join('\n');
