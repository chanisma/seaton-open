import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSunday,
  getHours,
  getDay,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * 날짜를 한글 형식으로 포맷 (예: 2025년 1월 3일 금요일)
 */
export const formatDateKo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy년 M월 d일 EEEE', { locale: ko });
};

/**
 * 현재 주의 월요일~금요일 날짜 배열 반환 (하위 호환성)
 */
export const getWeekdays = (baseDate: Date = new Date()): Date[] => {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // 월요일 시작
  return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
};

/**
 * 현재 주의 월요일~일요일 날짜 배열 반환 (7일)
 */
export const getCurrentWeekDays = (baseDate: Date = new Date()): Date[] => {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 }); // 월요일 시작
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
};

/**
 * 다음 주의 월요일~일요일 날짜 배열 반환 (7일)
 */
export const getNextWeekDays = (baseDate: Date = new Date()): Date[] => {
  const nextWeek = addDays(baseDate, 7);
  return getCurrentWeekDays(nextWeek);
};

/**
 * 다음 주 월요일~금요일 날짜 배열 반환 (하위 호환성)
 */
export const getNextWeekdays = (): Date[] => {
  const nextWeek = addDays(new Date(), 7);
  return getWeekdays(nextWeek);
};

/**
 * 신청 가능 시간인지 확인 (일요일 20시 이후)
 */
export const isReservationAvailable = (
  date: Date = new Date(),
  openDay: number = 0,
  openTime: string = '20:00'
): boolean => {
  const currentDay = getDay(date);
  const currentHour = getHours(date);
  const [openHour] = openTime.split(':').map(Number);

  // 일요일이고 20시 이후만 다음 주 신청 가능
  if (currentDay === openDay && currentHour >= openHour) {
    return true;
  }

  return false;
};

/**
 * 선택 가능한 날짜 목록 반환
 * - 현재 주의 오늘 이후 날짜들 (과거 제외)
 * - 일요일 20시 이후라면 다음 주 날짜들도 포함
 */
export const getSelectableDates = (now: Date = new Date()): Date[] => {
  const today = startOfDay(now);
  const currentWeekDays = getCurrentWeekDays(now);
  const selectableDates: Date[] = [];

  // 현재 주의 오늘 이후 날짜들 추가 (오늘 포함)
  for (const date of currentWeekDays) {
    const dateStart = startOfDay(date);
    if (!isBefore(dateStart, today)) {
      selectableDates.push(date);
    }
  }

  // 일요일 20시 이후라면 다음 주 날짜들도 추가
  if (isReservationAvailable(now)) {
    const nextWeekDays = getNextWeekDays(now);
    selectableDates.push(...nextWeekDays);
  }

  return selectableDates;
};

/**
 * 주어진 날짜가 신청 가능한 범위 내인지 확인
 */
export const isDateInReservableRange = (targetDate: Date, maxDaysAhead: number = 5): boolean => {
  const today = startOfDay(new Date());
  const maxDate = endOfDay(addDays(today, maxDaysAhead));

  return isAfter(targetDate, today) && isBefore(targetDate, maxDate);
};

/**
 * 주차 정보 반환 (예: "2025년 1월 1주차")
 */
export const getWeekInfo = (date: Date = new Date()): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  return `${format(weekStart, 'M월 d일', { locale: ko })} - ${format(weekEnd, 'M월 d일', {
    locale: ko,
  })}`;
};

/**
 * StudyRoom에서 운영 요일 배열을 반환
 * operating_days가 있으면 그대로 사용, 없으면 레거시 필드에서 유추
 */
export const getOperatingDays = (room: {
  operating_days?: number[];
  is_saturday_open?: boolean;
  is_sunday_open?: boolean;
}): number[] => {
  if (room.operating_days && room.operating_days.length > 0) {
    return room.operating_days;
  }
  // 레거시 호환: 평일 기본 + 토/일 선택
  const days = [1, 2, 3, 4, 5];
  if (room.is_saturday_open) days.push(6);
  if (room.is_sunday_open) days.push(0);
  return days;
};

/**
 * 운영 요일 배열에 주말이 포함되어 있는지 확인
 */
export const hasWeekendDays = (operatingDays: number[]): boolean => {
  return operatingDays.includes(0) || operatingDays.includes(6);
};

/**
 * 주어진 날짜에서 가장 가까운 운영일을 반환
 * 오늘이 운영일이면 오늘 반환, 아니면 최대 7일 내 가장 가까운 미래 운영일
 */
export const getNearestOperatingDay = (baseDate: Date, operatingDays: number[]): Date => {
  if (operatingDays.length === 0) return baseDate;
  if (operatingDays.includes(baseDate.getDay())) return baseDate;

  for (let i = 1; i <= 7; i++) {
    const candidate = addDays(baseDate, i);
    if (operatingDays.includes(candidate.getDay())) {
      return candidate;
    }
  }

  return baseDate;
};

/**
 * ISO 문자열을 Date 객체로 파싱
 */
export const parseDate = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * 날짜 문자열(yyyy-MM-dd)을 안전하게 Date로 변환합니다.
 * 유효하지 않은 날짜(예: 4월 31일)는 일수를 클램핑하여 해당 월의 마지막 날로 보정합니다.
 * 예: "2026-04-31" → 2026년 4월 30일
 */
export const safeParseDateString = (value: string): Date | null => {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const lastDay = new Date(y, m, 0).getDate();
  const date = new Date(y, m - 1, Math.min(d, lastDay));
  return isNaN(date.getTime()) ? null : date;
};

/**
 * 오늘이 일요일인지 확인
 */
export const isTodaySunday = (): boolean => {
  return isSunday(new Date());
};
