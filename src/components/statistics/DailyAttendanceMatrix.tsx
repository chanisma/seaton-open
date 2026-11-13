import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Check, Clock3 } from 'lucide-react';
import { Modal } from '@components/common/Modal';
import type { PeriodStatus, StudentDailyAttendance } from '@services/statistics.service';
import {
  attendanceStatusLabel,
  attendanceSummaryLabel,
  summarizeDailyAttendance,
  type DailyAttendanceSummary,
} from '@utils/dailyAttendanceView';

export type DailyAttendanceViewMode = 'summary' | 'periods';

export const DAILY_ATTENDANCE_VIEW_STORAGE_KEY = 'seaton:daily-attendance-view-mode';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const readStoredViewMode = (): DailyAttendanceViewMode => {
  if (typeof window === 'undefined') return 'summary';

  try {
    return window.localStorage.getItem(DAILY_ATTENDANCE_VIEW_STORAGE_KEY) === 'periods'
      ? 'periods'
      : 'summary';
  } catch {
    return 'summary';
  }
};

const SUMMARY_STYLE: Record<DailyAttendanceSummary['kind'], string> = {
  empty: 'text-muted-foreground/30',
  attended: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  excused: 'border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400',
  absent: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  pending: 'border-border bg-muted text-muted-foreground',
};

const STATUS_STYLE: Record<PeriodStatus['status'], string> = {
  attended: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  excused: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  absent: 'bg-red-500/10 text-red-700 dark:text-red-300',
  none: 'bg-muted text-muted-foreground',
};

const countAbsentDays = (student: StudentDailyAttendance): number =>
  Object.values(student.attendance).filter(periods =>
    periods.some(period => period.status === 'absent')
  ).length;

interface SelectedAttendance {
  student: StudentDailyAttendance;
  date: Date;
  periods: PeriodStatus[];
}

interface DailyAttendanceMatrixProps {
  students: StudentDailyAttendance[];
  dates: Date[];
  showAbsentCount?: boolean;
  className?: string;
  scrollAreaClassName?: string;
}

const SummaryIndicator = ({ summary }: { summary: DailyAttendanceSummary }) => {
  if (summary.kind === 'empty') {
    return <span className="text-muted-foreground/25">—</span>;
  }

  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-bold tabular-nums ${SUMMARY_STYLE[summary.kind]}`}
    >
      {summary.kind === 'attended' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
      {summary.kind === 'excused' && 'E'}
      {summary.kind === 'absent' && `!${summary.absent}`}
      {summary.kind === 'pending' && <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />}
    </span>
  );
};

const StudentIdentity = ({
  student,
  showAbsentCount,
}: {
  student: StudentDailyAttendance;
  showAbsentCount: boolean;
}) => {
  const absentDays = countAbsentDays(student);

  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{student.name}</span>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground">
          {student.studentNumber || student.email.split('@')[0]}
        </span>
      </span>
      {showAbsentCount && (
        <span
          title={`결석 ${absentDays}일`}
          aria-label={`결석 ${absentDays}일`}
          className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
            absentDays > 0
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-muted text-muted-foreground/60'
          }`}
        >
          {absentDays}
        </span>
      )}
    </div>
  );
};

export const DailyAttendanceMatrix = ({
  students,
  dates,
  showAbsentCount = false,
  className = '',
  scrollAreaClassName = 'max-h-[500px]',
}: DailyAttendanceMatrixProps) => {
  const [viewMode, setViewMode] = useState<DailyAttendanceViewMode>(readStoredViewMode);
  const [selectedAttendance, setSelectedAttendance] = useState<SelectedAttendance | null>(null);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DAILY_ATTENDANCE_VIEW_STORAGE_KEY) return;
      setViewMode(event.newValue === 'periods' ? 'periods' : 'summary');
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const changeViewMode = (nextMode: DailyAttendanceViewMode) => {
    setViewMode(nextMode);
    try {
      window.localStorage.setItem(DAILY_ATTENDANCE_VIEW_STORAGE_KEY, nextMode);
    } catch {
      // 저장소 접근이 제한되어도 현재 화면의 선택은 유지합니다.
    }
  };

  const selectedSummary = useMemo(
    () =>
      selectedAttendance
        ? summarizeDailyAttendance(selectedAttendance.periods)
        : summarizeDailyAttendance([]),
    [selectedAttendance]
  );

  const openDetail = (student: StudentDailyAttendance, date: Date, periods: PeriodStatus[]) => {
    if (periods.length === 0) return;
    setSelectedAttendance({ student, date, periods });
  };

  const renderSummaryTable = () => (
    <table className="relative w-max min-w-full border-collapse">
      <thead className="sticky top-0 z-20 bg-muted">
        <tr>
          <th className="sticky left-0 z-30 w-[112px] min-w-[112px] max-w-[112px] border-b border-r border-border bg-muted px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:w-[132px] sm:min-w-[132px] sm:max-w-[132px]">
            학생
          </th>
          {dates.map(date => {
            const day = date.getDay();
            return (
              <th
                key={date.toISOString()}
                title={format(date, 'yyyy-MM-dd')}
                className={`w-[34px] min-w-[34px] max-w-[34px] border-b border-border px-0 py-1.5 text-center ${
                  day === 0
                    ? 'bg-red-50/50 text-red-500 dark:bg-red-900/10'
                    : day === 6
                      ? 'bg-blue-50/50 text-blue-500 dark:bg-blue-900/10'
                      : 'text-muted-foreground'
                }`}
              >
                <span className="block text-[10px] font-bold tabular-nums">
                  {format(date, 'M/d')}
                </span>
                <span className="mt-0.5 block text-[9px] font-medium opacity-70">
                  {WEEKDAY_LABELS[day]}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/70">
        {students.map(student => (
          <tr key={student.studentId} className="group/row hover:bg-muted/35">
            <td className="sticky left-0 z-10 w-[112px] min-w-[112px] max-w-[112px] border-r border-border bg-card px-3 py-2 group-hover/row:bg-muted sm:w-[132px] sm:min-w-[132px] sm:max-w-[132px]">
              <StudentIdentity student={student} showAbsentCount={showAbsentCount} />
            </td>
            {dates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const periods = student.attendance[dateStr] || [];
              const summary = summarizeDailyAttendance(periods);
              const day = date.getDay();
              const label = `${format(date, 'M월 d일')} ${student.name}: ${attendanceSummaryLabel(summary)}`;

              return (
                <td
                  key={dateStr}
                  className={`w-[34px] min-w-[34px] max-w-[34px] border-r border-border/50 p-0.5 text-center last:border-r-0 ${
                    day === 0
                      ? 'bg-red-50/15 dark:bg-red-900/5'
                      : day === 6
                        ? 'bg-blue-50/15 dark:bg-blue-900/5'
                        : ''
                  }`}
                >
                  {periods.length > 0 ? (
                    <button
                      type="button"
                      aria-label={`${label}. 상세 보기`}
                      onClick={() => openDetail(student, date, periods)}
                      className="mx-auto flex h-8 w-8 touch-manipulation items-center justify-center rounded-lg outline-none transition-[background-color,transform,box-shadow] hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/35 active:scale-90"
                    >
                      <SummaryIndicator summary={summary} />
                    </button>
                  ) : (
                    <span className="mx-auto flex h-8 w-8 items-center justify-center">
                      <SummaryIndicator summary={summary} />
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderPeriodTable = () => (
    <table className="relative w-max min-w-full border-collapse">
      <thead className="sticky top-0 z-20 bg-muted">
        <tr>
          <th className="sticky left-0 z-30 w-[112px] min-w-[112px] max-w-[112px] border-b border-r border-border bg-muted px-3 py-3 text-left text-xs font-semibold text-muted-foreground sm:w-[132px] sm:min-w-[132px] sm:max-w-[132px]">
            학생
          </th>
          {dates.map(date => {
            const day = date.getDay();
            return (
              <th
                key={date.toISOString()}
                className={`w-[40px] min-w-[40px] max-w-[40px] border-b border-border px-1 py-3 text-center text-[10px] font-semibold tabular-nums ${
                  day === 0
                    ? 'bg-red-50/50 text-red-500 dark:bg-red-900/10'
                    : day === 6
                      ? 'bg-blue-50/50 text-blue-500 dark:bg-blue-900/10'
                      : 'text-muted-foreground'
                }`}
              >
                {format(date, 'M/d')}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/70">
        {students.map(student => (
          <tr key={student.studentId} className="group/row hover:bg-muted/35">
            <td className="sticky left-0 z-10 w-[112px] min-w-[112px] max-w-[112px] border-r border-border bg-card px-3 py-2 group-hover/row:bg-muted sm:w-[132px] sm:min-w-[132px] sm:max-w-[132px]">
              <StudentIdentity student={student} showAbsentCount={showAbsentCount} />
            </td>
            {dates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const periods = student.attendance[dateStr] || [];
              const day = date.getDay();
              const summary = summarizeDailyAttendance(periods);

              return (
                <td
                  key={dateStr}
                  className={`w-[40px] min-w-[40px] max-w-[40px] border-r border-border/50 p-0 text-center last:border-r-0 ${
                    day === 0
                      ? 'bg-red-50/15 dark:bg-red-900/5'
                      : day === 6
                        ? 'bg-blue-50/15 dark:bg-blue-900/5'
                        : ''
                  }`}
                >
                  {periods.length > 0 ? (
                    <button
                      type="button"
                      aria-label={`${format(date, 'M월 d일')} ${student.name}: ${attendanceSummaryLabel(summary)}. 교시별 상세 보기`}
                      onClick={() => openDetail(student, date, periods)}
                      className="mx-auto flex min-h-10 w-full touch-manipulation items-center justify-center rounded-md px-0.5 outline-none transition-[background-color,transform,box-shadow] hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/35 active:scale-[0.96]"
                    >
                      <span className="mx-auto grid w-fit grid-cols-2 gap-0.5" aria-hidden="true">
                        {periods.map((period, index) => (
                          <span
                            key={`${period.period}-${index}`}
                            className={`relative flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-medium ${
                              period.status === 'attended'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                                : period.status === 'excused'
                                  ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-900/20'
                                  : period.status === 'absent'
                                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20'
                                    : 'border-border bg-muted/60 text-muted-foreground'
                            }`}
                          >
                            {period.status === 'excused'
                              ? 'E'
                              : period.period === 0
                                ? '종'
                                : period.period}
                            {period.status === 'absent' && (
                              <span className="absolute inset-0 flex items-center justify-center text-[13px] font-normal leading-none text-red-500">
                                ×
                              </span>
                            )}
                          </span>
                        ))}
                      </span>
                    </button>
                  ) : (
                    <span className="flex min-h-10 items-center justify-center text-muted-foreground/25">
                      —
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const sortedSelectedPeriods = selectedAttendance
    ? [...selectedAttendance.periods].sort((a, b) => {
        if (a.period === 0) return -1;
        if (b.period === 0) return 1;
        return a.period - b.period;
      })
    : [];

  return (
    <>
      <div className={`flex min-h-0 flex-col ${className}`}>
        <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-muted-foreground"
            aria-label="출석 상태 범례"
          >
            <span className="font-semibold text-foreground">상태</span>
            <span className="text-emerald-600 dark:text-emerald-400">✓ 출석</span>
            <span className="text-teal-600 dark:text-teal-400">E 인정</span>
            <span className="text-red-600 dark:text-red-400">! 결석</span>
            <span>◷ 미확인</span>
          </div>

          <div
            role="group"
            aria-label="일별 출석 표시 방식"
            className="grid grid-cols-2 rounded-xl bg-muted p-1 sm:flex"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'summary'}
              onClick={() => changeViewMode('summary')}
              className={`min-h-9 rounded-lg px-3 text-xs font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
                viewMode === 'summary'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              요약 보기
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'periods'}
              onClick={() => changeViewMode('periods')}
              className={`min-h-9 rounded-lg px-3 text-xs font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
                viewMode === 'periods'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              교시 보기
            </button>
          </div>
        </div>

        <div className={`min-h-0 overflow-auto ${scrollAreaClassName}`}>
          {viewMode === 'summary' ? renderSummaryTable() : renderPeriodTable()}
        </div>
      </div>

      <Modal
        isOpen={!!selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        title={
          selectedAttendance
            ? `${format(selectedAttendance.date, 'M월 d일')} ${WEEKDAY_LABELS[selectedAttendance.date.getDay()]}요일 · ${selectedAttendance.student.name}`
            : undefined
        }
        size="sm"
      >
        {selectedAttendance && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/55 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedAttendance.student.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedAttendance.student.studentNumber ||
                    selectedAttendance.student.email.split('@')[0]}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${SUMMARY_STYLE[selectedSummary.kind]}`}
              >
                {attendanceSummaryLabel(selectedSummary)}
              </span>
            </div>

            <div className="space-y-2">
              {sortedSelectedPeriods.map((period, index) => (
                <div
                  key={`${period.period}-${index}`}
                  className="rounded-2xl border border-border/70 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {period.period === 0 ? '종일' : `${period.period}교시`}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[period.status]}`}
                    >
                      {attendanceStatusLabel(period.status)}
                    </span>
                  </div>
                  {(period.roomName || period.checkerName) && (
                    <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                      {period.roomName && <p>{period.roomName}</p>}
                      {period.checkerName && <p>확인 교사 · {period.checkerName}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
