import type { PeriodStatus } from '@services/statistics.service';

export type DailyAttendanceSummaryKind = 'empty' | 'attended' | 'excused' | 'absent' | 'pending';

export interface DailyAttendanceSummary {
  kind: DailyAttendanceSummaryKind;
  attended: number;
  excused: number;
  absent: number;
  pending: number;
  total: number;
}

export const summarizeDailyAttendance = (periods: PeriodStatus[]): DailyAttendanceSummary => {
  const summary: DailyAttendanceSummary = {
    kind: 'empty',
    attended: 0,
    excused: 0,
    absent: 0,
    pending: 0,
    total: periods.length,
  };

  periods.forEach(period => {
    if (period.status === 'attended') summary.attended += 1;
    if (period.status === 'excused') summary.excused += 1;
    if (period.status === 'absent') summary.absent += 1;
    if (period.status === 'none') summary.pending += 1;
  });

  if (summary.absent > 0) summary.kind = 'absent';
  else if (summary.pending > 0) summary.kind = 'pending';
  else if (summary.excused > 0) summary.kind = 'excused';
  else if (summary.attended > 0) summary.kind = 'attended';

  return summary;
};

export const attendanceStatusLabel = (status: PeriodStatus['status']): string => {
  if (status === 'attended') return '출석';
  if (status === 'excused') return '인정출석';
  if (status === 'absent') return '결석';
  return '미확인';
};

export const attendanceSummaryLabel = (summary: DailyAttendanceSummary): string => {
  if (summary.kind === 'empty') return '신청 없음';
  if (summary.kind === 'absent') return `결석 ${summary.absent}교시 포함`;
  if (summary.kind === 'pending') return `미확인 ${summary.pending}교시 포함`;
  if (summary.kind === 'excused') return `인정출석 ${summary.excused}교시 포함`;
  return '모든 신청 교시 출석';
};
