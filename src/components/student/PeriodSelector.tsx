import type { OperatingPeriod } from '../../types/reservation.types';

export interface PeriodSelectorDay {
  day: number; // 0=일 ~ 6=토
  label: string;
}

interface PeriodSelectorProps {
  mode: 'UNIFORM' | 'PER_DAY';
  operatingPeriods: OperatingPeriod[];
  /** PER_DAY 모드에서 표시할 운영 요일 (월~일 정렬 권장) */
  operatingDays?: PeriodSelectorDay[];

  // 선택값 (제어 컴포넌트)
  uniformValue?: number[]; // UNIFORM 모드 선택된 교시 ID
  perDayValue?: Record<number, number[]>; // PER_DAY 모드: 요일 -> 교시 ID 배열
  onUniformChange?: (ids: number[]) => void;
  onPerDayChange?: (sel: Record<number, number[]>) => void;

  /**
   * 특정 교시(+요일)가 이미 예약되어 선택 불가인지 판단.
   * 미전달 시 모든 교시 선택 가능 (필터 패널 용도).
   * dayOfWeek가 전달되면 해당 요일 기준, 없으면 요일 무관 기준.
   */
  isPeriodOccupied?: (periodId: number, dayOfWeek?: number) => boolean;

  /** 전체 선택/해제 버튼 표시 여부 (기본 true) */
  showBulkActions?: boolean;
  compact?: boolean;
}

/**
 * 교시 선택 UI 공통 컴포넌트.
 * - UNIFORM: 교시 버튼 그리드 (요일 무관)
 * - PER_DAY: 요일 x 교시 매트릭스
 *
 * 자리 신청 페이지의 "교시 필터 패널"과 "교시 선택 모달" 양쪽에서 재사용됩니다.
 * isPeriodOccupied를 전달하면 예약된 슬롯이 비활성화됩니다(모달 용도).
 */
export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  mode,
  operatingPeriods,
  operatingDays = [],
  uniformValue = [],
  perDayValue = {},
  onUniformChange,
  onPerDayChange,
  isPeriodOccupied,
  showBulkActions = true,
}) => {
  const occupied = (periodId: number, dayOfWeek?: number) =>
    isPeriodOccupied ? isPeriodOccupied(periodId, dayOfWeek) : false;

  // ─────────────────────────────────────────────────────────
  // PER_DAY 모드: 요일 x 교시 매트릭스
  // ─────────────────────────────────────────────────────────
  if (mode === 'PER_DAY') {
    const selectAll = () => {
      const updated: Record<number, number[]> = {};
      operatingDays.forEach(d => {
        updated[d.day] = operatingPeriods.filter(p => !occupied(p.id, d.day)).map(p => p.id);
      });
      onPerDayChange?.(updated);
    };

    const clearAll = () => {
      const updated: Record<number, number[]> = {};
      operatingDays.forEach(d => {
        updated[d.day] = [];
      });
      onPerDayChange?.(updated);
    };

    // 특정 요일 열 전체 토글 (occupied 제외)
    const toggleDayColumn = (day: number) => {
      const availableIds = operatingPeriods.filter(p => !occupied(p.id, day)).map(p => p.id);
      const current = perDayValue[day] || [];
      const allSelected = availableIds.length > 0 && availableIds.every(id => current.includes(id));
      const updated = { ...perDayValue };
      updated[day] = allSelected ? [] : [...availableIds];
      onPerDayChange?.(updated);
    };

    // 특정 교시 행 전체 토글 (occupied 제외)
    const togglePeriodRow = (periodId: number) => {
      const toggleableDays = operatingDays.filter(d => !occupied(periodId, d.day));
      const allSelected =
        toggleableDays.length > 0 &&
        toggleableDays.every(d => (perDayValue[d.day] || []).includes(periodId));
      const updated = { ...perDayValue };
      toggleableDays.forEach(d => {
        const current = updated[d.day] || [];
        if (allSelected) {
          updated[d.day] = current.filter(id => id !== periodId);
        } else if (!current.includes(periodId)) {
          updated[d.day] = [...current, periodId];
        }
      });
      onPerDayChange?.(updated);
    };

    // 단일 셀 토글
    const toggleCell = (day: number, periodId: number) => {
      const updated = { ...perDayValue };
      const current = updated[day] || [];
      if (current.includes(periodId)) {
        updated[day] = current.filter(id => id !== periodId);
      } else {
        updated[day] = [...current, periodId];
      }
      onPerDayChange?.(updated);
    };

    return (
      <div className="space-y-3">
        {showBulkActions && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              전체 선택
            </button>
            <span className="text-xs text-muted-foreground/70">|</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:underline"
            >
              전체 해제
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-1.5 text-xs font-medium text-muted-foreground text-left w-20" />
                {operatingDays.map(d => (
                  <th key={d.day} className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => toggleDayColumn(d.day)}
                      className="text-xs font-semibold text-foreground hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {d.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operatingPeriods.map(period => (
                <tr key={period.id}>
                  <td className="p-1.5">
                    <button
                      type="button"
                      onClick={() => togglePeriodRow(period.id)}
                      className="text-left w-full"
                    >
                      <div className="text-xs font-medium text-foreground hover:text-primary-600 dark:hover:text-primary-400 leading-tight">
                        {period.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {period.start_time}~{period.end_time}
                      </div>
                    </button>
                  </td>
                  {operatingDays.map(d => {
                    const dayPeriods = perDayValue[d.day] || [];
                    const isSelected = dayPeriods.includes(period.id);
                    const isOccupied = occupied(period.id, d.day);

                    return (
                      <td key={d.day} className="p-1">
                        <button
                          type="button"
                          disabled={isOccupied}
                          onClick={() => toggleCell(d.day, period.id)}
                          className={`w-full aspect-square rounded-lg border text-sm font-medium transition-colors min-w-[40px]
 ${
   isSelected
     ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900/40 dark:border-primary-500 dark:text-primary-300'
     : isOccupied
       ? 'bg-muted border-border text-muted-foreground/70 cursor-not-allowed'
       : 'bg-card border-border text-muted-foreground hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500 cursor-pointer'
 }`}
                        >
                          {isSelected ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // UNIFORM 모드: 교시 버튼 그리드
  // ─────────────────────────────────────────────────────────
  const toggleUniform = (periodId: number) => {
    if (uniformValue.includes(periodId)) {
      onUniformChange?.(uniformValue.filter(id => id !== periodId));
    } else {
      onUniformChange?.([...uniformValue, periodId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {operatingPeriods.map(period => {
        const isOccupied = occupied(period.id);
        const isSelected = uniformValue.includes(period.id);

        return (
          <button
            key={period.id}
            type="button"
            disabled={isOccupied}
            onClick={() => toggleUniform(period.id)}
            className={`p-3 rounded-lg border text-sm font-medium transition-colors
 ${
   isSelected
     ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-300'
     : isOccupied
       ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
       : 'bg-card border-border text-foreground hover:border-primary-300 dark:hover:border-primary-500 cursor-pointer'
 }`}
          >
            <div className="flex flex-col items-center">
              <span>{period.name}</span>
              <span className="text-xs opacity-70 mt-1">
                {period.start_time} ~ {period.end_time}
              </span>
              {isOccupied && <span className="text-xs text-red-500 mt-1">(예약됨)</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
};
