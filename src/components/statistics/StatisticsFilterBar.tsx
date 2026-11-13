import { useMemo } from 'react';
import { format } from 'date-fns';
import { safeParseDateString } from '@utils/dateHelpers';
import { GRADE_OPTIONS, validateDateRange, type StatisticsFilters } from '@utils/statisticsFilters';

const FIELD_CLASS =
  'min-h-11 min-w-0 w-full rounded-xl border border-border/80 bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] hover:border-primary/25 focus:border-primary/40 focus:ring-2 focus:ring-ring/25';
const LABEL_CLASS = 'mb-2 block text-xs font-semibold text-muted-foreground';

export interface RoomOption {
  roomId: string;
  roomName: string;
}

interface StatisticsFilterBarProps {
  value: StatisticsFilters;
  onChange: (next: StatisticsFilters) => void;
  /** 전달하면 열람실 선택 드롭다운을 표시합니다. */
  rooms?: RoomOption[];
  /** 전달하면 "적용" 버튼을 표시합니다. (대시보드의 draft 모드) */
  onApply?: () => void;
  /** 'card'는 팝업 페이지용 흰 배경 카드, 'plain'은 대시보드용 */
  variant?: 'card' | 'plain';
}

/**
 * 통계 화면 공용 필터 바.
 *
 * 이전에는 대시보드와 팝업 3개가 같은 JSX를 복사해 쓰고 있어서
 * 날짜 검증이나 파싱 방식이 화면마다 달랐습니다.
 */
export const StatisticsFilterBar = ({
  value,
  onChange,
  rooms,
  onApply,
  variant = 'plain',
}: StatisticsFilterBarProps) => {
  const rangeError = useMemo(
    () => validateDateRange(value.startDate, value.endDate),
    [value.startDate, value.endDate]
  );

  const patch = (partial: Partial<StatisticsFilters>) => onChange({ ...value, ...partial });

  const handleDateChange = (key: 'startDate' | 'endDate') => (raw: string) => {
    const parsed = safeParseDateString(raw);
    if (parsed) patch({ [key]: parsed } as Partial<StatisticsFilters>);
  };

  const containerClass =
    variant === 'card'
      ? 'mb-6 rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-card sm:p-5'
      : 'content-surface rounded-[2rem] p-5 sm:p-6';

  return (
    <div className={containerClass}>
      {variant === 'plain' && (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Statistics filter
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-foreground">조회 기준</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            기간과 대상을 정한 뒤 통계에 적용합니다.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 items-end gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="min-w-0">
          <label className={LABEL_CLASS} htmlFor="stats-start-date">
            시작일
          </label>
          <input
            id="stats-start-date"
            type="date"
            value={format(value.startDate, 'yyyy-MM-dd')}
            onChange={e => handleDateChange('startDate')(e.target.value)}
            aria-invalid={!!rangeError}
            className={FIELD_CLASS}
          />
        </div>

        <div className="min-w-0">
          <label className={LABEL_CLASS} htmlFor="stats-end-date">
            종료일
          </label>
          <input
            id="stats-end-date"
            type="date"
            value={format(value.endDate, 'yyyy-MM-dd')}
            onChange={e => handleDateChange('endDate')(e.target.value)}
            aria-invalid={!!rangeError}
            className={FIELD_CLASS}
          />
        </div>

        <div className="min-w-0">
          <label className={LABEL_CLASS} htmlFor="stats-grade">
            학년
          </label>
          <select
            id="stats-grade"
            value={value.grade ?? ''}
            onChange={e => patch({ grade: e.target.value ? Number(e.target.value) : null })}
            className={FIELD_CLASS}
          >
            <option value="">전체 학년</option>
            {GRADE_OPTIONS.map(grade => (
              <option key={grade} value={grade}>
                {grade}학년
              </option>
            ))}
          </select>
        </div>

        {rooms && (
          <div className="min-w-0">
            <label className={LABEL_CLASS} htmlFor="stats-room">
              열람실
            </label>
            <select
              id="stats-room"
              value={value.roomId ?? ''}
              onChange={e => patch({ roomId: e.target.value || null })}
              className={FIELD_CLASS}
            >
              <option value="">전체 열람실</option>
              {rooms.map(room => (
                <option key={room.roomId} value={room.roomId}>
                  {room.roomName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border text-primary shadow-sm focus:ring-2 focus:ring-ring/25"
            checked={value.includeFuture}
            onChange={e => patch({ includeFuture: e.target.checked })}
          />
          <span className="text-sm font-medium text-foreground">미래 예약 데이터 포함</span>
        </label>

        {onApply && (
          <button
            type="button"
            onClick={onApply}
            disabled={!!rangeError}
            className="min-h-11 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
          >
            적용
          </button>
        )}
      </div>

      {rangeError && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {rangeError}
        </p>
      )}
    </div>
  );
};
