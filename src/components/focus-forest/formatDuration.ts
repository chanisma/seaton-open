// formatDuration.ts - Focus Forest 공용 시간 포맷터.
// SessionSummary(요약)와 FocusOverlay(일시정지)가 공유하되, 초 표시 정책만 옵션으로 분기한다.

interface FormatDurationOptions {
  // true면 시간 단위가 있어도 초를 항상 붙인다(정밀 표시).
  // 기본(false)은 시간 단위가 있으면 초를 생략한다(요약 헤드라인용).
  alwaysShowSeconds?: boolean;
}

/**
 * 초를 "N시간 M분 S초" 형태의 한국어 문자열로 변환한다.
 * - 시/분은 값이 0이면 생략한다.
 * - 초는 시간 단위가 없을 때(h === 0) 또는 alwaysShowSeconds일 때 표시한다.
 * - 전부 0이면 "0초"를 반환한다.
 */
export function formatDurationKorean(
  seconds: number,
  { alwaysShowSeconds = false }: FormatDurationOptions = {}
): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  if (alwaysShowSeconds || h === 0) parts.push(`${s}초`);

  return parts.join(' ');
}
