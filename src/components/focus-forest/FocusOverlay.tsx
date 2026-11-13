// FocusOverlay.tsx - 집중 일시정지 오버레이 (탭 이탈/전체화면 종료 시)

import { formatDurationKorean } from './formatDuration';

interface FocusOverlayProps {
  sessionSeconds: number;
  totalSeconds: number;
  onResume: () => void;
}

// 일시정지 화면은 시/분이 있어도 초까지 정밀 표시한다.
const formatKorean = (seconds: number): string =>
  formatDurationKorean(seconds, { alwaysShowSeconds: true });

export const FocusOverlay = ({ sessionSeconds, totalSeconds, onResume }: FocusOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl animate-fade-in">
      <div
        className="flex flex-col items-center gap-5 text-center px-8 py-10
          bg-white/5 border border-white/10 rounded-3xl max-w-sm w-full mx-4"
      >
        <span className="text-4xl">🌙</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-white">숲이 잠시 쉬고 있어요</h2>
          <p className="text-white/50 text-sm">화면을 벗어나면 나무도 잠시 성장을 멈춰요</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-white/85 text-base">
            이번 세션 <span className="font-semibold">{formatKorean(sessionSeconds)}</span>
          </span>
          <span className="text-white/50 text-sm">총 누적 {formatKorean(totalSeconds)}</span>
        </div>
        <button
          onClick={onResume}
          className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
            text-white text-base font-semibold rounded-2xl px-8 py-3.5
            transition-colors duration-150 focus:outline-none focus:ring-2
            focus:ring-emerald-400"
        >
          다시 집중하기
        </button>
      </div>
    </div>
  );
};
