import { describe, expect, it } from 'vitest';
import type { PeriodStatus } from '@services/statistics.service';
import {
  attendanceStatusLabel,
  attendanceSummaryLabel,
  summarizeDailyAttendance,
} from './dailyAttendanceView';

const periods = (...statuses: PeriodStatus['status'][]): PeriodStatus[] =>
  statuses.map((status, index) => ({ period: index + 1, status }));

describe('summarizeDailyAttendance', () => {
  it('신청이 없으면 empty로 요약한다', () => {
    expect(summarizeDailyAttendance([])).toEqual({
      kind: 'empty',
      attended: 0,
      excused: 0,
      absent: 0,
      pending: 0,
      total: 0,
    });
  });

  it('결석은 다른 상태보다 우선해서 표시한다', () => {
    const summary = summarizeDailyAttendance(periods('attended', 'excused', 'absent', 'none'));

    expect(summary.kind).toBe('absent');
    expect(summary.absent).toBe(1);
    expect(attendanceSummaryLabel(summary)).toBe('결석 1교시 포함');
  });

  it('결석이 없고 미확인이 있으면 pending으로 표시한다', () => {
    const summary = summarizeDailyAttendance(periods('attended', 'none'));

    expect(summary.kind).toBe('pending');
    expect(attendanceSummaryLabel(summary)).toBe('미확인 1교시 포함');
  });

  it('인정출석이 포함되면 excused로 표시한다', () => {
    const summary = summarizeDailyAttendance(periods('attended', 'excused'));

    expect(summary.kind).toBe('excused');
    expect(attendanceSummaryLabel(summary)).toBe('인정출석 1교시 포함');
  });

  it('모든 교시가 출석이면 attended로 표시한다', () => {
    const summary = summarizeDailyAttendance(periods('attended', 'attended'));

    expect(summary.kind).toBe('attended');
    expect(attendanceSummaryLabel(summary)).toBe('모든 신청 교시 출석');
  });
});

describe('attendanceStatusLabel', () => {
  it.each([
    ['attended', '출석'],
    ['excused', '인정출석'],
    ['absent', '결석'],
    ['none', '미확인'],
  ] as const)('%s 상태를 사용자용 문구로 변환한다', (status, label) => {
    expect(attendanceStatusLabel(status)).toBe(label);
  });
});
