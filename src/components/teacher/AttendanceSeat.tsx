import { SeatReservation } from '@/types/reservation.types';
import { getTemperatureColor } from '@utils/temperature';
import { Button } from '@components/common/Button';

interface AttendanceSeatProps {
  seatNumber: string;
  reservation?: SeatReservation;
  onToggleAttendance: (reservation: SeatReservation) => void;
  onExcusedAttendance: (reservation: SeatReservation) => void;
  /** 순공 열람실일 때만 전달 - 보완 출석 처리 */
  onSupplementAttendance?: (reservation: SeatReservation) => void;
  isLoading?: boolean;
  temperature?: number;
  isSelected: boolean;
  onSelect: (seatNumber: string | null) => void;
  popupPosition?: 'top' | 'bottom';
  popupAlignment?: 'left' | 'center' | 'right';
  studentNumber?: string;
}

export const AttendanceSeat = ({
  seatNumber,
  reservation,
  onToggleAttendance,
  onExcusedAttendance,
  onSupplementAttendance,
  isLoading = false,
  temperature,
  isSelected,
  onSelect,
  popupPosition = 'bottom',
  popupAlignment = 'center',
  studentNumber,
}: AttendanceSeatProps) => {
  const isSungong = !!onSupplementAttendance;
  const popoverId = `attendance-seat-${seatNumber}`;

  const getSeatStyle = () => {
    if (!reservation) {
      return 'border-border/80 bg-background text-muted-foreground';
    }

    if (reservation.attendance_status === 'supplement') {
      return 'border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-100';
    }

    if (reservation.attendance_status === 'excused') {
      return 'border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-100';
    }

    if (reservation.is_attended) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100';
    }

    return 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100';
  };

  const getStatusLabel = () => {
    if (!reservation) return '빈 자리';
    if (reservation.attendance_status === 'supplement') return '보완';
    if (reservation.attendance_status === 'excused') return '인정출석';
    if (reservation.is_attended) return '출석';
    return '확인 대기';
  };

  const getStatusDotStyle = () => {
    if (reservation?.attendance_status === 'supplement') return 'bg-indigo-500';
    if (reservation?.attendance_status === 'excused') return 'bg-teal-500';
    if (reservation?.is_attended) return 'bg-emerald-500';
    return 'bg-amber-500';
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모로 이벤트 전파 방지
    if (!reservation) return;

    // 이미 선택된 상태에서 다시 클릭하면 출석 토글
    if (isSelected) {
      if (!isLoading) {
        onToggleAttendance(reservation);
        onSelect(null); // 팝업 닫기
      }
    } else {
      // 선택되지 않은 상태면 선택 (팝업 열기)
      onSelect(seatNumber);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reservation || isLoading) return;
    onToggleAttendance(reservation);
    onSelect(null); // 액션 후 팝오버 닫기
  };

  const handleExcusedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reservation || isLoading) return;
    onExcusedAttendance(reservation);
    onSelect(null); // 액션 후 팝오버 닫기
  };

  const handleSupplementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!reservation || isLoading || !onSupplementAttendance) return;
    onSupplementAttendance(reservation);
    onSelect(null); // 액션 후 팝오버 닫기
  };

  const alignmentClasses = {
    left: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    right: 'right-0 origin-top-right',
  };

  const arrowClasses = {
    left: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-4',
  };

  return (
    <div
      className="relative"
      onKeyDown={event => {
        if (event.key === 'Escape' && isSelected) {
          event.stopPropagation();
          onSelect(null);
        }
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={!reservation}
        aria-label={`${seatNumber} 좌석${reservation?.profiles?.name ? `, ${reservation.profiles.name}` : ''}, ${getStatusLabel()}`}
        aria-haspopup={reservation ? 'dialog' : undefined}
        aria-expanded={reservation ? isSelected : undefined}
        aria-controls={reservation && isSelected ? popoverId : undefined}
        className={`
          relative flex aspect-square h-full w-full items-center justify-center
          rounded-b-md rounded-t-lg border text-[10px] font-medium shadow-sm
          outline-none transition-[border-color,box-shadow,transform,opacity] duration-200 sm:rounded-t-xl sm:text-sm
          ${getSeatStyle()}
          ${isLoading ? 'cursor-wait opacity-50' : ''}
          ${reservation && !isLoading ? 'hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0' : 'cursor-default'}
          ${isSelected ? 'z-20 ring-2 ring-primary/50 ring-offset-2 ring-offset-background' : 'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background'}
        `}
      >
        <div className="z-10 flex min-w-0 flex-col items-center leading-tight">
          <span className="text-[11px] font-bold sm:text-sm">{seatNumber}</span>
          {reservation?.profiles?.name && (
            <span className="mt-0.5 max-w-full truncate px-0.5 text-[9px] font-semibold sm:text-[11px]">
              {reservation.profiles.name}
            </span>
          )}
        </div>

        {reservation && (
          <>
            <span
              className={`absolute bottom-1.5 left-1.5 h-1.5 w-1.5 rounded-full ring-2 ring-white/70 dark:ring-black/20 ${getStatusDotStyle()}`}
              aria-hidden="true"
            />
            <span className="sr-only">{getStatusLabel()}</span>
          </>
        )}

        {/* 학년 배지 */}
        {reservation?.profiles?.grade && (
          <span
            className={`
              absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center
              rounded-full border bg-card text-[9px] font-bold shadow-sm sm:h-5 sm:w-5 sm:text-[10px]
              ${
                reservation.profiles.grade === 1
                  ? 'text-pink-600 border-pink-200'
                  : reservation.profiles.grade === 2
                    ? 'text-blue-600 border-blue-200'
                    : 'text-purple-600 border-purple-200'
              }
            `}
          >
            {reservation.profiles.grade}
          </span>
        )}
      </button>

      {/* 학생 정보 팝오버 */}
      {isSelected && reservation && (
        <div
          id={popoverId}
          role="dialog"
          aria-label={`${reservation.profiles?.name || seatNumber} 출석 처리`}
          className={`
            absolute z-50 w-64 max-w-[calc(100vw-3rem)] rounded-2xl
            border border-border bg-card p-4 shadow-overlay
            animate-in fade-in zoom-in-95 duration-200 sm:w-72
            ${popupPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            ${alignmentClasses[popupAlignment]}
          `}
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-lg">
                {reservation.profiles?.name || '학생 정보 없음'}
              </h4>
              <button
                type="button"
                aria-label="학생 정보 닫기"
                onClick={e => {
                  e.stopPropagation();
                  onSelect(null);
                }}
                className="rounded-lg p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {reservation.profiles && (
              <div className="space-y-1.5 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">소속</span>
                  <span className="font-medium text-foreground">
                    {reservation.profiles.grade}학년 {reservation.profiles.class}반
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">학번</span>
                  <span className="font-medium text-foreground">
                    {studentNumber || reservation.profiles.student_number}
                  </span>
                </div>
                {temperature !== undefined && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-border mt-1.5">
                    <span className="text-muted-foreground">현재 온도</span>
                    <span className={`font-bold ${getTemperatureColor(temperature)}`}>
                      {temperature}°C
                    </span>
                  </div>
                )}
                {reservation.is_attended && reservation.checker?.name && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-border mt-1.5">
                    <span className="text-muted-foreground">체크 교사</span>
                    <span className="font-medium text-foreground">{reservation.checker.name}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              {!reservation.is_attended ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleActionClick}
                    isLoading={isLoading}
                  >
                    출석 확인하기
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    onClick={handleExcusedClick}
                    isLoading={isLoading}
                  >
                    인정출석
                  </Button>
                  {isSungong && (
                    <Button
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                      onClick={handleSupplementClick}
                      isLoading={isLoading}
                    >
                      보완
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {isSungong && reservation.attendance_status !== 'supplement' && (
                    <Button
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                      onClick={handleSupplementClick}
                      isLoading={isLoading}
                    >
                      보완으로 변경
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={handleActionClick}
                    isLoading={isLoading}
                  >
                    출석 취소하기
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 말풍선 화살표 */}
          <div
            className={`
              absolute w-4 h-4 
              bg-card rotate-45 border-border
              ${
                popupPosition === 'top' ? '-bottom-2 border-b border-r' : '-top-2 border-t border-l'
              }
              ${arrowClasses[popupAlignment]}
            `}
          ></div>
        </div>
      )}
    </div>
  );
};
