import {
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { safeParseDateString } from './dateHelpers';

/**
 * 통계 화면들이 공유하는 필터 값.
 * 대시보드와 "크게보기" 팝업이 같은 형태를 사용해야 숫자가 어긋나지 않는다.
 */
export interface StatisticsFilters {
  startDate: Date;
  endDate: Date;
  grade: number | null;
  roomId: string | null;
  includeFuture: boolean;
}

export const GRADE_OPTIONS = [1, 2, 3] as const;

export const createDefaultStatisticsFilters = (): StatisticsFilters => ({
  startDate: startOfMonth(new Date()),
  endDate: endOfMonth(new Date()),
  grade: null,
  roomId: null,
  includeFuture: false,
});

/**
 * 필터를 쿼리스트링으로 직렬화합니다. (크게보기 팝업으로 전달)
 * 모든 필터를 빠짐없이 넘겨야 팝업과 부모 화면의 숫자가 일치합니다.
 */
export const serializeStatisticsFilters = (filters: StatisticsFilters): string => {
  const params = new URLSearchParams();
  params.set('startDate', format(filters.startDate, 'yyyy-MM-dd'));
  params.set('endDate', format(filters.endDate, 'yyyy-MM-dd'));
  if (filters.grade) params.set('grade', String(filters.grade));
  if (filters.roomId) params.set('roomId', filters.roomId);
  if (filters.includeFuture) params.set('includeFuture', 'true');
  return params.toString();
};

/** 쿼리스트링에서 필터를 복원합니다. 값이 없거나 잘못되면 기본값을 사용합니다. */
export const parseStatisticsFilters = (params: URLSearchParams): StatisticsFilters => {
  const defaults = createDefaultStatisticsFilters();

  const rawStart = params.get('startDate');
  const rawEnd = params.get('endDate');
  const rawGrade = params.get('grade');
  const grade = rawGrade ? Number(rawGrade) : null;

  return {
    startDate: (rawStart && safeParseDateString(rawStart)) || defaults.startDate,
    endDate: (rawEnd && safeParseDateString(rawEnd)) || defaults.endDate,
    grade: grade && (GRADE_OPTIONS as readonly number[]).includes(grade) ? grade : null,
    roomId: params.get('roomId') || null,
    includeFuture: params.get('includeFuture') === 'true',
  };
};

/**
 * 날짜 범위 검증. 문제가 없으면 null을 반환합니다.
 *
 * 시작일 > 종료일이면 date-fns는 예외 대신 역순 배열을 반환하고,
 * 쿼리는 gte(늦은날).lte(이른날)이 되어 항상 0건이 나옵니다.
 * 즉 "표는 날짜가 거꾸로, 데이터는 없음" 상태가 조용히 만들어지므로 UI에서 막아야 합니다.
 */
export const validateDateRange = (startDate: Date, endDate: Date): string | null => {
  if (isAfter(startDate, endDate)) {
    return '시작일이 종료일보다 늦습니다. 기간을 다시 선택해주세요.';
  }
  return null;
};

export interface WeekOption {
  start: Date;
  end: Date;
  /** <option value> 로 쓰는 ISO 문자열 */
  value: string;
  /** 'M/d ~ M/d' 형태 라벨 */
  label: string;
}

/**
 * 기간을 월요일 시작 주 단위로 나눈 목록을 만듭니다.
 * includeFuture가 꺼져 있으면 오늘 이후 주는 제외합니다.
 */
export const buildWeekOptions = (
  startDate: Date,
  endDate: Date,
  includeFuture: boolean
): WeekOption[] => {
  if (validateDateRange(startDate, endDate)) return [];

  const effectiveEnd = !includeFuture && isAfter(endDate, new Date()) ? new Date() : endDate;
  const weeks: WeekOption[] = [];

  let cursor = startOfWeek(startDate, { weekStartsOn: 1 });
  while (!isAfter(cursor, effectiveEnd)) {
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    weeks.push({
      start: cursor,
      end,
      value: cursor.toISOString(),
      label: `${format(cursor, 'M/d')} ~ ${format(end, 'M/d')}`,
    });
    cursor = addWeeks(cursor, 1);
  }

  return weeks;
};
