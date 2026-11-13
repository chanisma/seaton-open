import { describe, expect, it } from 'vitest';
import {
  buildWeekOptions,
  parseStatisticsFilters,
  serializeStatisticsFilters,
  validateDateRange,
  type StatisticsFilters,
} from './statisticsFilters';

const makeFilters = (overrides: Partial<StatisticsFilters> = {}): StatisticsFilters => ({
  startDate: new Date(2026, 5, 1), // 2026-06-01
  endDate: new Date(2026, 5, 28), // 2026-06-28
  grade: 2,
  roomId: 'room-1',
  includeFuture: true,
  ...overrides,
});

describe('serializeStatisticsFilters / parseStatisticsFilters', () => {
  it('모든 필터를 왕복해도 값이 유지된다', () => {
    const original = makeFilters();
    const restored = parseStatisticsFilters(
      new URLSearchParams(serializeStatisticsFilters(original))
    );

    expect(restored.startDate.getFullYear()).toBe(2026);
    expect(restored.startDate.getMonth()).toBe(5);
    expect(restored.startDate.getDate()).toBe(1);
    expect(restored.endDate.getDate()).toBe(28);
    expect(restored.grade).toBe(2);
    expect(restored.roomId).toBe('room-1');
    expect(restored.includeFuture).toBe(true);
  });

  it('includeFuture와 roomId도 직렬화된다 (팝업이 부모와 같은 숫자를 보여주려면 필수)', () => {
    const query = serializeStatisticsFilters(makeFilters());

    expect(query).toContain('includeFuture=true');
    expect(query).toContain('roomId=room-1');
  });

  it('기본값은 쿼리에 넣지 않는다', () => {
    const query = serializeStatisticsFilters(
      makeFilters({ grade: null, roomId: null, includeFuture: false })
    );

    expect(query).not.toContain('grade=');
    expect(query).not.toContain('roomId=');
    expect(query).not.toContain('includeFuture=');
  });

  it('잘못된 학년은 무시한다', () => {
    expect(parseStatisticsFilters(new URLSearchParams('grade=9')).grade).toBeNull();
    expect(parseStatisticsFilters(new URLSearchParams('grade=abc')).grade).toBeNull();
  });

  it('날짜가 없거나 잘못되면 기본 기간을 쓴다', () => {
    const parsed = parseStatisticsFilters(new URLSearchParams('startDate=not-a-date'));
    expect(parsed.startDate).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed.startDate.getTime())).toBe(false);
  });
});

describe('validateDateRange', () => {
  it('정상 범위는 null을 반환한다', () => {
    expect(validateDateRange(new Date(2026, 5, 1), new Date(2026, 5, 28))).toBeNull();
  });

  it('같은 날짜는 허용한다', () => {
    const day = new Date(2026, 5, 1);
    expect(validateDateRange(day, day)).toBeNull();
  });

  it('시작일이 종료일보다 늦으면 메시지를 반환한다', () => {
    expect(validateDateRange(new Date(2026, 5, 28), new Date(2026, 5, 1))).toMatch(/시작일/);
  });
});

describe('buildWeekOptions', () => {
  it('기간을 월요일 시작 주 단위로 나눈다', () => {
    // 2026-06-01은 월요일
    const weeks = buildWeekOptions(new Date(2026, 5, 1), new Date(2026, 5, 28), true);

    expect(weeks).toHaveLength(4);
    expect(weeks[0].label).toBe('6/1 ~ 6/7');
    expect(weeks[3].label).toBe('6/22 ~ 6/28');
  });

  it('주 중간에서 시작해도 그 주의 월요일부터 만든다', () => {
    const weeks = buildWeekOptions(new Date(2026, 5, 3), new Date(2026, 5, 10), true);
    expect(weeks[0].label).toBe('6/1 ~ 6/7');
  });

  it('역전된 기간은 빈 배열을 반환한다', () => {
    expect(buildWeekOptions(new Date(2026, 5, 28), new Date(2026, 5, 1), true)).toEqual([]);
  });

  it('value는 option 키로 쓸 수 있는 고유 문자열이다', () => {
    const weeks = buildWeekOptions(new Date(2026, 5, 1), new Date(2026, 5, 28), true);
    expect(new Set(weeks.map(w => w.value)).size).toBe(weeks.length);
  });
});
