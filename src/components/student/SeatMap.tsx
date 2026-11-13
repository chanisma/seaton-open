import { useMemo, useCallback, memo } from 'react';
import type { SeatLayout } from '../../types/reservation.types';
import { Seat } from './Seat';

interface SeatMapProps {
  layout: SeatLayout;
  occupiedSeats: Set<string>;
  selectedSeat: string | null;
  onSeatSelect: (seatNumber: string) => void;
  mySeat?: string | null;
  disabled?: boolean;
}

export const SeatMap = memo(
  ({
    layout,
    occupiedSeats,
    selectedSeat,
    onSeatSelect,
    mySeat,
    disabled = false,
  }: SeatMapProps) => {
    const handleSeatClick = useCallback(
      (seatNumber: string) => {
        if (disabled) return;
        if (occupiedSeats.has(seatNumber) && seatNumber !== mySeat) return;
        onSeatSelect(seatNumber);
      },
      [disabled, occupiedSeats, mySeat, onSeatSelect]
    );

    // 좌석 번호 생성
    const generateSeatNumber = (row: number, col: number): string => {
      const rowLetter = String.fromCharCode(65 + row);
      const colNumber = col + 1;
      return `${rowLetter}${colNumber}`;
    };

    // 좌석 그리드 메모이제이션 (섹션 기반)
    const seatGrid = useMemo(() => {
      const grid = [];
      const { totalRows, totalColumns, sections, emptySeats = [], unavailableSeats = [] } = layout;

      // 특정 위치에 섹션이 있는지 확인
      const findSectionAtPosition = (row: number, col: number) => {
        return sections.find(
          s =>
            row >= s.startRow &&
            row < s.startRow + s.rows &&
            col >= s.startCol &&
            col < s.startCol + s.columns
        );
      };

      for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
          const section = findSectionAtPosition(row, col);

          if (section) {
            // 좌석이 있는 위치
            const seatNumber = generateSeatNumber(row, col);
            const isEmpty = emptySeats.includes(seatNumber);
            const isUnavailable = unavailableSeats.includes(seatNumber);

            if (isEmpty) {
              grid.push({ key: `${row}-${col}`, isEmpty: true, isAisle: false });
            } else {
              const isOccupied = occupiedSeats.has(seatNumber);
              const isSelected = selectedSeat === seatNumber;
              const isMine = mySeat === seatNumber;

              grid.push({
                key: `${row}-${col}`,
                isEmpty: false,
                isAisle: false,
                seatNumber,
                isOccupied,
                isSelected,
                isMine,
                isUnavailable,
              });
            }
          } else {
            // 통로 (빈 공간)
            grid.push({ key: `${row}-${col}`, isEmpty: true, isAisle: true });
          }
        }
      }

      return { grid, totalColumns };
    }, [layout, occupiedSeats, selectedSeat, mySeat]);

    const legendItems = [
      { label: '선택 가능', className: 'border-border/80 bg-card' },
      { label: '예약됨', className: 'border-transparent bg-muted' },
      { label: '선택', className: 'border-primary bg-primary' },
      { label: '사용 불가', className: 'border-border bg-muted', unavailable: true },
      ...(mySeat
        ? [{ label: '내 자리', className: 'border-success bg-success', unavailable: false }]
        : []),
    ];

    return (
      <div className="space-y-4" aria-label="좌석 선택 영역">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-border/65 bg-muted/45 px-3 py-3">
          {legendItems.map(item => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span
                className={`relative h-3.5 w-3.5 overflow-hidden rounded-[0.3rem] border ${item.className}`}
                aria-hidden="true"
              >
                {item.unavailable && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-destructive">
                    ×
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto rounded-[1.6rem] border border-border/60 bg-muted/20 px-3 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto min-w-full">
            <div className="mx-auto mb-7 w-full max-w-md px-2">
              <div className="mb-2 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-muted-foreground/25 to-transparent" />
              <div className="text-center text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                앞쪽
              </div>
            </div>

            <div
              className="mx-auto grid w-full justify-center gap-0.5 sm:gap-2"
              style={{
                gridTemplateColumns: `repeat(${seatGrid.totalColumns}, minmax(2.5rem, 3.5rem))`,
                minWidth: `${seatGrid.totalColumns * 2.5 + Math.max(seatGrid.totalColumns - 1, 0) * 0.125}rem`,
                maxWidth: `${seatGrid.totalColumns * 4}rem`,
              }}
            >
              {seatGrid.grid.map(seat => {
                if (seat.isEmpty) {
                  return (
                    <div
                      key={seat.key}
                      className="aspect-square h-full w-full"
                      aria-hidden="true"
                    />
                  );
                }

                return (
                  <Seat
                    key={seat.key}
                    seatNumber={seat.seatNumber!}
                    isOccupied={seat.isOccupied!}
                    isSelected={seat.isSelected!}
                    isMine={seat.isMine!}
                    isUnavailable={seat.isUnavailable}
                    onClick={() => handleSeatClick(seat.seatNumber!)}
                    disabled={disabled}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          좌석을 누르면 선택 정보가 업데이트됩니다.
        </p>
      </div>
    );
  }
);
