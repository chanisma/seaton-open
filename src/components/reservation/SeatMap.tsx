import type { StudyRoom, SeatSection } from '@project-types/reservation.types';

export type SeatStatus = 'available' | 'reserved' | 'selected' | 'mine' | 'disabled';

export interface SeatInfo {
  seatNumber: string;
  status: SeatStatus;
  studentName?: string;
  studentGrade?: number;
  studentClass?: number;
  isAttended?: boolean;
}

/**
 * 좌석 상태별 아이콘 — 색상 외 시각적 구분을 위한 WCAG 1.4.1 준수
 */
const SeatStatusIcon: React.FC<{ status: SeatStatus; compact: boolean }> = ({
  status,
  compact,
}) => {
  const size = compact ? 8 : 12;
  const cls = compact ? 'w-2 h-2' : 'w-3 h-3';

  switch (status) {
    case 'reserved':
      // X mark for occupied
      return (
        <svg
          className={`${cls} absolute top-0.5 right-0.5 opacity-60`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          width={size}
          height={size}
        >
          <line x1="2" y1="2" x2="10" y2="10" />
          <line x1="10" y1="2" x2="2" y2="10" />
        </svg>
      );
    case 'selected':
      // Filled circle for selected
      return (
        <svg
          className={`${cls} absolute top-0.5 right-0.5`}
          viewBox="0 0 12 12"
          width={size}
          height={size}
        >
          <circle cx="6" cy="6" r="4" fill="currentColor" />
        </svg>
      );
    case 'mine':
      // Checkmark for my seat
      return (
        <svg
          className={`${cls} absolute top-0.5 right-0.5`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width={size}
          height={size}
        >
          <polyline points="2,6 5,9.5 10,2.5" />
        </svg>
      );
    case 'disabled':
      // Dash for unavailable
      return (
        <svg
          className={`${cls} absolute top-0.5 right-0.5 opacity-40`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          width={size}
          height={size}
        >
          <line x1="2" y1="6" x2="10" y2="6" />
        </svg>
      );
    default:
      return null;
  }
};

interface SeatMapProps {
  room: Omit<StudyRoom, 'created_at' | 'updated_at'>;
  selectedSeat?: string | null;
  onSeatClick?: (seatNumber: string) => void;
  getSeatInfo?: (seatNumber: string) => SeatInfo;
  showSeatNumbers?: boolean;
  compact?: boolean;
}

/**
 * 섹션 기반 좌석 배치도 컴포넌트
 * 통로로 구분된 섹션들을 표시하고, 좌석 선택/예약 상태를 시각화합니다.
 */
export const SeatMap: React.FC<SeatMapProps> = ({
  room,
  selectedSeat,
  onSeatClick,
  getSeatInfo,
  showSeatNumbers = true,
  compact = false,
}) => {
  const { totalRows, totalColumns, sections, emptySeats = [] } = room.seat_layout;

  // 좌석 번호 생성
  const generateSeatNumber = (row: number, col: number): string => {
    const rowLetter = String.fromCharCode(65 + row);
    const colNumber = col + 1;
    return `${rowLetter}${colNumber}`;
  };

  // 특정 위치에 섹션이 있는지 확인
  const findSectionAtPosition = (row: number, col: number): SeatSection | undefined => {
    return sections.find(
      s =>
        row >= s.startRow &&
        row < s.startRow + s.rows &&
        col >= s.startCol &&
        col < s.startCol + s.columns
    );
  };

  // 좌석 정보 가져오기
  const getSeatStatus = (seatNumber: string): SeatInfo => {
    if (getSeatInfo) {
      return getSeatInfo(seatNumber);
    }

    // 기본 상태
    if (emptySeats.includes(seatNumber)) {
      return { seatNumber, status: 'disabled' };
    }
    if (selectedSeat === seatNumber) {
      return { seatNumber, status: 'selected' };
    }
    return { seatNumber, status: 'available' };
  };

  // 좌석 스타일 결정
  const getSeatClassName = (status: SeatStatus): string => {
    const baseClass = `
      ${compact ? 'w-6 h-6 text-[10px]' : 'w-10 h-10 min-w-[2.75rem] min-h-[2.75rem] text-xs'}
      relative flex items-center justify-center border rounded
      transition-all duration-200
    `;

    switch (status) {
      case 'available':
        return `${baseClass} bg-card border-input
 text-foreground hover:bg-blue-50 dark:hover:bg-blue-900/30
 cursor-pointer hover:scale-105`;
      case 'reserved':
        return `${baseClass} bg-muted border-gray-300 dark:border-gray-500
 text-muted-foreground cursor-not-allowed`;
      case 'selected':
        return `${baseClass} bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500
                text-white font-semibold cursor-pointer hover:scale-105 shadow-md`;
      case 'mine':
        return `${baseClass} bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500
                text-white font-semibold shadow-md`;
      case 'disabled':
        return `${baseClass} bg-muted border-border
 text-muted-foreground/70 cursor-not-allowed opacity-50`;
      default:
        return baseClass;
    }
  };

  // 좌석 클릭 핸들러
  const handleSeatClick = (seatNumber: string, seatInfo: SeatInfo) => {
    if (seatInfo.status === 'available' || seatInfo.status === 'selected') {
      onSeatClick?.(seatNumber);
    }
  };

  // Grid 렌더링
  const renderGrid = () => {
    const grid = [];

    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < totalColumns; col++) {
        const section = findSectionAtPosition(row, col);

        if (section) {
          // 좌석이 있는 위치
          const seatNumber = generateSeatNumber(row, col);
          const seatInfo = getSeatStatus(seatNumber);

          grid.push(
            <div
              key={`${row}-${col}`}
              className={getSeatClassName(seatInfo.status)}
              onClick={() => handleSeatClick(seatNumber, seatInfo)}
              title={
                seatInfo.studentName
                  ? `${seatNumber} - ${seatInfo.studentName} (${seatInfo.studentGrade}학년 ${seatInfo.studentClass}반)${
                      seatInfo.isAttended ? ' ✓ 출석' : ''
                    }`
                  : seatInfo.status === 'disabled'
                    ? '사용 불가'
                    : seatNumber
              }
              role={
                seatInfo.status === 'available' || seatInfo.status === 'selected'
                  ? 'button'
                  : undefined
              }
              aria-label={`좌석 ${seatNumber}`}
              aria-pressed={seatInfo.status === 'selected' ? true : undefined}
            >
              {showSeatNumbers && seatInfo.status !== 'disabled' && seatNumber}
              <SeatStatusIcon status={seatInfo.status} compact={compact} />
              {seatInfo.isAttended && !compact && (
                <span className="absolute -top-1 -right-1 text-green-500 text-xs font-bold">✓</span>
              )}
            </div>
          );
        } else {
          // 통로 (빈 공간)
          grid.push(
            <div
              key={`${row}-${col}`}
              className={compact ? 'w-6 h-6' : 'w-10 h-10'}
              aria-hidden="true"
            />
          );
        }
      }
    }

    return grid;
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div
        className={`grid ${compact ? 'gap-0.5' : 'gap-1'} mx-auto`}
        style={{
          gridTemplateColumns: `repeat(${totalColumns}, minmax(${compact ? '1.5rem' : '2.5rem'}, ${compact ? '1.5rem' : '2.5rem'}))`,
          width: 'fit-content',
        }}
      >
        {renderGrid()}
      </div>
    </div>
  );
};

/**
 * 좌석 범례 컴포넌트
 */
export const SeatLegend: React.FC<{ showMySeat?: boolean }> = ({ showMySeat = false }) => {
  return (
    <div className="flex flex-wrap gap-4 text-sm" role="list" aria-label="좌석 상태 범례">
      <div className="flex items-center gap-2" role="listitem">
        <div className="w-6 h-6 relative bg-card border border-input rounded flex items-center justify-center"></div>
        <span className="text-foreground">선택 가능</span>
      </div>
      <div className="flex items-center gap-2" role="listitem">
        <div className="w-6 h-6 relative bg-muted border border-gray-300 dark:border-gray-500 rounded flex items-center justify-center text-muted-foreground">
          <SeatStatusIcon status="reserved" compact={false} />
        </div>
        <span className="text-foreground">예약됨</span>
      </div>
      <div className="flex items-center gap-2" role="listitem">
        <div className="w-6 h-6 relative bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-500 rounded flex items-center justify-center text-white">
          <SeatStatusIcon status="selected" compact={false} />
        </div>
        <span className="text-foreground">선택됨</span>
      </div>
      {showMySeat && (
        <div className="flex items-center gap-2" role="listitem">
          <div className="w-6 h-6 relative bg-green-500 dark:bg-green-600 border border-green-600 dark:border-green-500 rounded flex items-center justify-center text-white">
            <SeatStatusIcon status="mine" compact={false} />
          </div>
          <span className="text-foreground">내 자리</span>
        </div>
      )}
      <div className="flex items-center gap-2" role="listitem">
        <div className="w-6 h-6 relative bg-muted border border-border rounded opacity-50 flex items-center justify-center text-muted-foreground/70">
          <SeatStatusIcon status="disabled" compact={false} />
        </div>
        <span className="text-foreground">사용 불가</span>
      </div>
    </div>
  );
};
