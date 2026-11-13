// FocusHud.tsx - 전체화면 집중 모드 상단 HUD
// 평소 저대비(opacity 30%)로 가라앉고, 마우스 움직임 감지 시 3초간 선명해진다.

import { useEffect, useRef, useState } from 'react';

interface FocusHudProps {
  formattedTime: string;
  forestIndex: number;
  treeCount: number;
  goalMinutes: number | null;
  elapsedSeconds: number;
  goalSessionsToday: number;
}

const HUD_WAKE_MS = 3000;
const RING_RADIUS = 15.9155; // 원주가 정확히 100이 되는 반지름

export const FocusHud = ({
  formattedTime,
  forestIndex,
  treeCount,
  goalMinutes,
  elapsedSeconds,
  goalSessionsToday,
}: FocusHudProps) => {
  const [awake, setAwake] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wake = () => {
      setAwake(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setAwake(false), HUD_WAKE_MS);
    };
    wake();
    window.addEventListener('pointermove', wake);
    return () => {
      window.removeEventListener('pointermove', wake);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const progress = goalMinutes ? Math.min(1, elapsedSeconds / (goalMinutes * 60)) : null;

  return (
    <div
      className={`absolute top-5 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-700 ${
        awake ? 'opacity-100' : 'opacity-30'
      }`}
    >
      <div
        className="flex items-center gap-4 bg-black/25 backdrop-blur-md
          border border-white/10 rounded-2xl px-6 py-3.5"
      >
        {/* 목표 진행률 링 (무제한이면 표시 안 함) */}
        {progress !== null && (
          <svg viewBox="0 0 36 36" className="w-11 h-11 -rotate-90 shrink-0">
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke="#34d399"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${progress * 100} 100`}
              className="transition-all duration-1000"
            />
          </svg>
        )}

        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono text-white tracking-widest tabular-nums">
            {formattedTime}
          </span>
          <span className="text-xs text-white/60 mt-0.5">
            {forestIndex}번째 숲 · 나무 {treeCount}그루
            {goalMinutes ? ` · 목표 ${goalMinutes}분` : ''}
          </span>
        </div>

        {/* 오늘 완료한 목표 세션 도트 */}
        {goalSessionsToday > 0 && (
          <div
            className="flex flex-col gap-1 shrink-0"
            aria-label={`오늘 완료한 세션 ${goalSessionsToday}개`}
          >
            {Array.from({ length: Math.min(goalSessionsToday, 8) }, (_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
