import { memo } from 'react';

interface SeatProps {
  seatNumber: string;
  isOccupied: boolean;
  isSelected: boolean;
  isMine?: boolean;
  isUnavailable?: boolean;
  onClick: () => void;
  studentName?: string;
  disabled?: boolean;
}

export const Seat = memo(
  ({
    seatNumber,
    isOccupied,
    isSelected,
    isMine = false,
    isUnavailable = false,
    onClick,
    studentName,
    disabled = false,
  }: SeatProps) => {
    const getSeatStyle = () => {
      if (disabled) {
        return 'border-transparent bg-muted/65 text-muted-foreground/50 cursor-not-allowed';
      }
      if (isUnavailable) {
        return 'border-border/60 bg-muted/70 text-muted-foreground/45 cursor-not-allowed';
      }
      if (isMine) {
        return 'border-success bg-success text-success-foreground shadow-[0_8px_18px_-12px_hsl(var(--success))] cursor-pointer';
      }
      if (isSelected) {
        return 'border-primary bg-primary text-primary-foreground shadow-[0_10px_22px_-12px_hsl(var(--primary))] cursor-pointer';
      }
      if (isOccupied) {
        return 'border-transparent bg-muted text-muted-foreground/75 cursor-not-allowed';
      }
      return 'border-border/80 bg-card text-foreground shadow-card cursor-pointer hover:border-primary/35 hover:bg-accent/45 hover:text-primary hover:shadow-card-hover';
    };

    const seatState = disabled
      ? '현재 선택할 수 없음'
      : isUnavailable
        ? '사용 불가'
        : isMine
          ? '내 자리'
          : isSelected
            ? '선택됨'
            : isOccupied
              ? '예약됨'
              : '선택 가능';

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || (isOccupied && !isMine) || isUnavailable}
        aria-label={`${seatNumber} 좌석, ${seatState}`}
        aria-pressed={isSelected}
        className={`
        pressable relative flex aspect-square h-full min-h-10 w-full min-w-10
        items-center justify-center overflow-visible rounded-xl border
        text-[10px] font-semibold transition-[color,background-color,border-color,box-shadow,transform] sm:min-h-11 sm:min-w-11 sm:text-sm
        ${getSeatStyle()}
        ${isSelected ? 'z-10 ring-2 ring-primary/25 ring-offset-2 ring-offset-card' : ''}
      `}
        title={studentName || `${seatNumber} · ${seatState}`}
      >
        <span className="relative z-10">{seatNumber}</span>
        {isUnavailable && (
          <span className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-lg font-bold text-destructive/65">
            <svg
              className="h-full w-full p-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
        )}
        <span
          className="pointer-events-none absolute inset-x-1.5 top-1 h-px rounded-full bg-current opacity-15"
          aria-hidden="true"
        />

        {studentName && (
          <span className="absolute -bottom-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border/70 bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-card">
            {studentName}
          </span>
        )}
      </button>
    );
  }
);
