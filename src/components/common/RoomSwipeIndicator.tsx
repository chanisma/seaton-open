import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RoomSwipeIndicatorProps {
  /** 표시할 화면 가장자리 (left = 이전 열람실, right = 다음 열람실) */
  edge: 'left' | 'right';
  /** 0~1. 1이면 손을 떼는 순간 열람실이 바뀝니다 */
  progress: number;
  roomName: string;
  /** 이동할 열람실의 순번 (1부터) */
  position: number;
  total: number;
}

const RING_RADIUS = 17;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * 출석체크·자리 신청 좌석표 좌우 스와이프 시 화면 가장자리에 나타나는 열람실 이동 안내.
 * 손가락 이동량에 따라 카드가 밀려 나오고 원형 게이지가 차며,
 * 임계점에 도달하면 강조 색으로 바뀌어 "놓으면 이동"을 알립니다.
 * 좌석표가 화면보다 길어도 보이도록 viewport 기준(fixed)으로 배치합니다.
 */
export const RoomSwipeIndicator = ({
  edge,
  progress,
  roomName,
  position,
  total,
}: RoomSwipeIndicatorProps) => {
  const p = Math.min(Math.max(progress, 0), 1);
  const armed = p >= 1;
  const isLeft = edge === 'left';
  const Chevron = isLeft ? ChevronLeft : ChevronRight;
  // 가장자리 쪽에서 손가락을 따라 밀려 나오는 거리 (px). 여백(12px) 안에서만 움직여 잘리지 않게 한다
  const slide = (1 - p) * 12 * (isLeft ? -1 : 1);

  return (
    <div className="pointer-events-none" aria-hidden="true">
      {/* 가장자리 글로우 */}
      <div
        className={`fixed inset-y-0 z-40 w-28 transition-opacity duration-150 motion-reduce:transition-none ${
          isLeft ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'
        } ${armed ? 'from-primary/25' : 'from-foreground/10'} to-transparent`}
        style={{ opacity: 0.35 + p * 0.65 }}
      />

      {/* 안내 카드 */}
      <div
        className={`fixed top-1/2 z-50 ${isLeft ? 'left-3' : 'right-3'}`}
        style={{
          transform: `translate(${slide}px, -50%)`,
          opacity: 0.4 + p * 0.6,
        }}
      >
        <div
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-md transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none ${
            isLeft ? 'flex-row' : 'flex-row-reverse'
          } ${
            armed
              ? 'scale-[1.03] border-primary/40 bg-card/95 shadow-primary/20'
              : 'border-border/70 bg-card/85'
          }`}
        >
          {/* 진행 게이지 + 방향 아이콘 */}
          <div className="relative h-10 w-10 shrink-0">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3"
                className="stroke-border"
              />
              <circle
                cx="20"
                cy="20"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - p)}
                className="stroke-primary"
              />
            </svg>
            <span
              className={`absolute inset-[5px] flex items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                armed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Chevron
                className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                  armed ? (isLeft ? '-translate-x-0.5' : 'translate-x-0.5') : ''
                }`}
                strokeWidth={2.5}
              />
            </span>
          </div>

          {/* 이동할 열람실 */}
          <div className={`min-w-0 max-w-[9.5rem] ${isLeft ? 'text-left' : 'text-right'}`}>
            <p
              className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                armed ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {armed ? '놓으면 이동' : isLeft ? '이전 열람실' : '다음 열람실'}
              <span className="ml-1 font-medium tabular-nums text-muted-foreground">
                {position}/{total}
              </span>
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
              {roomName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
