import { format, addDays, startOfWeek, isBefore, startOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getCurrentWeekDays, getWeekdays } from '@utils/dateHelpers';
import { Button } from '@components/common/Button';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  availableDates?: Date[];
  disabled?: boolean;
  operatingDays?: number[]; // 운영 요일 (0=일, 1=월, ..., 6=토)
  /** @deprecated operatingDays 사용 권장 */
  isSaturdayOpen?: boolean;
  /** @deprecated operatingDays 사용 권장 */
  isSundayOpen?: boolean;
}

export const DateSelector = ({
  selectedDate,
  onDateSelect,
  availableDates,
  disabled = false,
  operatingDays: operatingDaysProp,
  isSaturdayOpen = false,
  isSundayOpen = false,
}: DateSelectorProps) => {
  // operatingDays prop 우선, 없으면 레거시 필드에서 유추
  const operatingDays =
    operatingDaysProp ??
    (() => {
      const days = [1, 2, 3, 4, 5];
      if (isSaturdayOpen) days.push(6);
      if (isSundayOpen) days.push(0);
      return days;
    })();

  // 주말 운영 여부에 따라 보여질 날짜 결정
  const showWeekend = operatingDays.includes(0) || operatingDays.includes(6);
  const weekDates = showWeekend ? getCurrentWeekDays(selectedDate) : getWeekdays(selectedDate);
  const gridCols = showWeekend ? 'grid-cols-7' : 'grid-cols-5';

  // 현재 주의 시작일
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  // 선택된 주의 시작일
  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  // 이전 주 버튼 비활성화 여부 (현재 주보다 이전이면 비활성화)
  const isPrevWeekDisabled =
    disabled || isBefore(startOfDay(selectedWeekStart), startOfDay(currentWeekStart));

  const handlePrevWeek = () => {
    if (isPrevWeekDisabled) return;
    const prevWeek = addDays(selectedDate, -7);
    onDateSelect(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = addDays(selectedDate, 7);
    onDateSelect(nextWeek);
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!availableDates) return true;
    return availableDates.some(
      availableDate => format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isDateSelected = (date: Date): boolean => {
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  return (
    <div className="space-y-6">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevWeek}
          disabled={isPrevWeekDisabled}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          이전
        </Button>

        <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center justify-center">
          <span className="whitespace-nowrap">{format(weekDates[0], 'M월', { locale: ko })}</span>
          <span className="mx-2 text-muted-foreground/70">|</span>
          <span className="text-base sm:text-lg font-medium text-muted-foreground whitespace-nowrap">
            {format(weekDates[0], 'd일', { locale: ko })} -{' '}
            {format(weekDates[weekDates.length - 1], 'd일', { locale: ko })}
          </span>
        </h3>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextWeek}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          다음
          <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* 날짜 선택 (월~일, 7일) */}
      <div className={`grid ${gridCols} gap-1 sm:gap-3 pt-2 pb-2`}>
        {weekDates.map(date => {
          const available = isDateAvailable(date);
          const selected = isDateSelected(date);
          const dayOfWeek = format(date, 'E', { locale: ko });
          const dayOfMonth = format(date, 'd');
          const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

          // 운영하지 않는 요일 처리
          const dayNum = date.getDay(); // 0: 일요일, 6: 토요일
          const isDayClosed = !operatingDays.includes(dayNum);

          if (isDayClosed) {
            return (
              <div
                key={date.toISOString()}
                className="relative w-full h-16 sm:h-24 rounded-xl sm:rounded-2xl border border-border/70 bg-background opacity-50 flex flex-col items-center justify-center cursor-not-allowed"
              >
                <div className="text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 text-muted-foreground">
                  {dayOfWeek}
                </div>
                <div className="text-base sm:text-2xl font-bold tracking-tight text-muted-foreground/70">
                  {dayOfMonth}
                </div>
              </div>
            );
          }

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateSelect(date)}
              disabled={disabled || !available}
              className={`
 relative w-full h-16 sm:h-24
 rounded-xl sm:rounded-2xl border transition-all duration-300
 flex flex-col items-center justify-center
 ${
   selected
     ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none scale-105 ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-gray-900 z-10'
     : available
       ? 'bg-card border-border/70 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-card-hover hover:-translate-y-0.5 text-foreground'
       : 'bg-background border-border/70 text-muted-foreground/70 cursor-not-allowed'
 }
 `}
            >
              {isToday && !selected && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-primary-500"></span>
              )}
              <div
                className={`text-[10px] sm:text-sm font-medium mb-0.5 sm:mb-1 ${selected ? 'text-primary-100' : 'text-muted-foreground'}`}
              >
                {dayOfWeek}
              </div>
              <div className="text-base sm:text-2xl font-bold tracking-tight">{dayOfMonth}</div>
            </button>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      {availableDates && availableDates.length === 0 && (
        <div className="flex items-center justify-center p-4 bg-muted/50 rounded-xl border border-border/70 text-center">
          <p className="text-sm text-muted-foreground">
            현재 신청 가능한 날짜가 없습니다. <br className="sm:hidden" />
            <span className="font-medium text-foreground">일요일 20시</span>부터 다음 주 신청이
            가능합니다.
          </p>
        </div>
      )}
    </div>
  );
};
