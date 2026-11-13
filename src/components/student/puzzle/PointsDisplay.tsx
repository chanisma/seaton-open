import { Coins, Puzzle, TrendingDown } from 'lucide-react';
import type { StudentPoints } from '@project-types/puzzle.types';

interface PointsDisplayProps {
  /** 이전 포인트 (2026-10-09 동결 — 퍼즐 전용) */
  points: StudentPoints;
  /** 통합 지갑의 코인. null = 아직 못 읽음 */
  coins?: number | null;
  compact?: boolean;
}

/**
 * 보상 카드 — 코인(새 보상) + 이전 포인트(퍼즐 전용)
 * 출석·피드백·집중의 숲 보상은 이제 코인으로 쌓이고, 이전 포인트는 더 쌓이지 않는다.
 */
export const PointsDisplay = ({ points, coins = null, compact = false }: PointsDisplayProps) => {
  const coinText = coins === null ? '–' : coins.toLocaleString();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-300">
          코인 {coinText} · {points.balance}P
        </span>
      </div>
    );
  }

  return (
    <section className="content-surface flex flex-col gap-5 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coins className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">보유 코인</h2>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums tracking-[-0.04em] text-foreground">
              {coinText}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">코인</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            출석·피드백·집중의 숲 보상은 코인으로 쌓여요
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:min-w-64">
        <div className="rounded-2xl bg-emerald-500/[0.08] px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Puzzle className="h-3.5 w-3.5" />
            이전 포인트
          </span>
          <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
            {points.balance}P
            <span className="ml-1 text-xs font-medium text-muted-foreground">(퍼즐 전용)</span>
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            포인트 누적 사용
          </span>
          <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
            {points.total_spent}P
          </p>
        </div>
      </div>
    </section>
  );
};
