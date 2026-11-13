import { format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getWeekdays, getCurrentWeekDays } from '@utils/dateHelpers';
import { SeatReservation } from '@project-types/reservation.types';
import { Button } from '@components/common/Button';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReservationCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  reservations: SeatReservation[];
  operatingDays?: number[]; // 운영 요일 (0=일, 1=월, ..., 6=토)
  /** @deprecated operatingDays 사용 권장 */
  isSaturdayOpen?: boolean;
  /** @deprecated operatingDays 사용 권장 */
  isSundayOpen?: boolean;
  onFeedback?: (reservation: SeatReservation) => void;
}

export const ReservationCalendar = ({
  selectedDate,
  onDateChange,
  reservations,
  operatingDays: operatingDaysProp,
  isSaturdayOpen = false,
  isSundayOpen = false,
  onFeedback,
}: ReservationCalendarProps) => {
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
  const gridCols = showWeekend ? 'md:grid-cols-7' : 'md:grid-cols-5';

  // 날짜별 예약 맵 생성 (같은 날 여러 예약 지원, 열람실 이름 순 정렬)
  const reservationMap = new Map<string, SeatReservation[]>();
  reservations.forEach(reservation => {
    const dateKey = format(new Date(reservation.reservation_date), 'yyyy-MM-dd');
    const existing = reservationMap.get(dateKey) || [];
    reservationMap.set(dateKey, [...existing, reservation]);
  });
  reservationMap.forEach((list, key) => {
    reservationMap.set(
      key,
      list.sort((a, b) => {
        const nameA = a.study_rooms?.name || '';
        const nameB = b.study_rooms?.name || '';
        const nameCompare = nameA.localeCompare(nameB, 'ko');
        if (nameCompare !== 0) return nameCompare;
        return (a.period_id || 0) - (b.period_id || 0);
      })
    );
  });

  const { getStudyRoomById } = useStudyRooms();

  // 교시 이름 조회 헬퍼
  const getPeriodName = (reservation: SeatReservation): string | null => {
    if (reservation.period_id == null || reservation.period_id === 0) return null;
    const room = getStudyRoomById(reservation.room_id);
    const periods = room?.operating_periods;
    if (!periods) return `${reservation.period_id}교시`;
    const period = periods.find(p => p.id === reservation.period_id);
    return period?.name || `${reservation.period_id}교시`;
  };

  const handlePrevWeek = () => {
    const prevWeek = addDays(selectedDate, -7);
    onDateChange(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = addDays(selectedDate, 7);
    onDateChange(nextWeek);
  };

  return (
    <div className="space-y-4">
      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevWeek}
          aria-label="이전 주 보기"
          className="shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">이전 주</span>
        </Button>

        <h3 className="min-w-0 text-center text-sm font-bold tracking-tight text-foreground sm:text-base">
          {format(weekDates[0], 'yyyy년 M월 d일', { locale: ko })} ~{' '}
          {format(weekDates[weekDates.length - 1], 'M월 d일', { locale: ko })}
        </h3>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          aria-label="다음 주 보기"
          className="shrink-0"
        >
          <span className="hidden sm:inline">다음 주</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 주간 캘린더 */}
      <div className={`grid grid-cols-2 ${gridCols} gap-2.5 sm:gap-3`}>
        {weekDates.map(date => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayReservations = reservationMap.get(dateKey) || [];
          const dayOfWeek = format(date, 'EEEE', { locale: ko });
          const dayOfMonth = format(date, 'd');

          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          // 운영하지 않는 요일 처리
          const dayNum = date.getDay(); // 0: 일요일, 6: 토요일
          const isDayClosed = !operatingDays.includes(dayNum);

          if (isDayClosed) {
            return (
              <div
                key={dateKey}
                className="hidden min-h-36 rounded-2xl border border-border/50 bg-muted/25 p-4 opacity-60 md:block"
              >
                <div className="mb-5 text-center">
                  <div className="text-xs font-semibold text-muted-foreground">{dayOfWeek}</div>
                  <div className="mt-0.5 text-xl font-bold text-muted-foreground/70">
                    {dayOfMonth}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">운영 안 함</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={dateKey}
              className={`
                min-h-32 rounded-2xl border p-2.5 transition-[border-color,box-shadow,background-color] sm:p-3
                ${
                  dayReservations.length > 0
                    ? 'border-primary/20 bg-primary/[0.035]'
                    : 'border-border/60 bg-card'
                }
                ${isToday ? 'ring-2 ring-primary/25' : ''}
                ${dayReservations.length === 0 ? 'hidden md:block' : ''}
              `}
            >
              {/* 날짜 헤더 */}
              <div className="mb-2 flex items-center justify-center gap-1.5 md:hidden">
                <span className="text-xs font-semibold text-muted-foreground">{dayOfWeek}</span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {dayOfMonth}
                </span>
                {isToday && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    오늘
                  </span>
                )}
              </div>
              <div className="mb-3 hidden text-center md:block">
                <div className="text-xs font-semibold text-muted-foreground">{dayOfWeek}</div>
                <div className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                  {dayOfMonth}
                </div>
                {isToday && <div className="mt-1 text-[10px] font-semibold text-primary">오늘</div>}
              </div>

              {/* 예약 정보 */}
              {dayReservations.length > 0 ? (
                <div className="space-y-1.5">
                  {dayReservations.map(reservation => {
                    const periodName = getPeriodName(reservation);
                    const reservationDate = new Date(reservation.reservation_date);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const isPast = reservationDate < now;

                    // 상태별 박스 스타일
                    let boxStyle = 'border-border/60 bg-muted/55'; // 대기
                    if (reservation.attendance_status === 'excused') {
                      boxStyle = 'border-teal-500/20 bg-teal-500/[0.08]';
                    } else if (reservation.is_attended) {
                      boxStyle = 'border-emerald-500/20 bg-emerald-500/[0.08]';
                    } else if (isPast) {
                      boxStyle = 'border-red-500/20 bg-red-500/[0.08]';
                    }

                    const isAttended =
                      reservation.is_attended || reservation.attendance_status === 'excused';
                    const hasFeedback = !!reservation.feedback_rating;
                    // 7일 이내만 피드백 작성 가능
                    const feedbackCutoff = new Date();
                    feedbackCutoff.setDate(feedbackCutoff.getDate() - 7);
                    feedbackCutoff.setHours(0, 0, 0, 0);
                    const canWriteFeedback =
                      new Date(reservation.reservation_date) >= feedbackCutoff;

                    return (
                      <div
                        key={reservation.id}
                        className={`rounded-xl border p-2 text-center ${boxStyle}`}
                      >
                        <p className="truncate text-[10px] font-semibold text-muted-foreground sm:text-xs">
                          {reservation.study_rooms?.name || '열람실'}
                        </p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground sm:text-base">
                          {reservation.seat_number}번
                        </p>
                        {periodName && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground sm:text-xs">
                            {periodName}
                          </p>
                        )}
                        {isAttended && onFeedback && (hasFeedback || canWriteFeedback) && (
                          <button
                            type="button"
                            onClick={() => (canWriteFeedback ? onFeedback(reservation) : undefined)}
                            disabled={!canWriteFeedback && !hasFeedback}
                            className={`mt-2 w-full rounded-lg py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-xs ${
                              hasFeedback
                                ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300'
                                : 'bg-primary/10 text-primary hover:bg-primary/15'
                            }`}
                          >
                            {hasFeedback ? `★ ${reservation.feedback_rating}` : '피드백 작성'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-3 text-center">
                  <p className="text-xs text-muted-foreground">신청 없음</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 rounded-2xl bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">출석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
          <span className="text-xs font-medium text-muted-foreground">인정출석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-muted-foreground">결석</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs font-medium text-muted-foreground">예정</span>
        </div>
      </div>
    </div>
  );
};
