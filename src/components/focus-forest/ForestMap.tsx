// ForestMap.tsx - 완성한 숲 갤러리 (미니 3D 스냅샷 + SVG 폴백)

import { X } from 'lucide-react';

import type { CompletedForest } from '@/types/focusForest.types';

import { MiniForest3D } from './scene/MiniForest3D';

interface ForestMapProps {
  forests: CompletedForest[];
  currentForestIndex: number;
  onClose: () => void;
  title?: string;
}

// WebGL 컨텍스트 제한(브라우저당 8~16개) 대비: 최신 N개만 3D
const MAX_3D_PREVIEWS = 6;

function formatFocusTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${mo}.${day}`;
}

// SVG 점 프리뷰 — 오래된 숲 카드와 WebGL 폴백 겸용
function SvgPreview({ forest }: { forest: CompletedForest }) {
  const xs = forest.treePositions.map(t => t.x);
  const ys = forest.treePositions.map(t => t.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 1;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const rangeX = Math.max(maxX - minX, 1);
  const rangeY = Math.max(maxY - minY, 1);
  const pad = 10;

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full bg-emerald-100 dark:bg-emerald-950">
      {forest.treePositions.map(tree => {
        const cx = pad + ((tree.x - minX) / rangeX) * (200 - pad * 2);
        const cy = pad + ((tree.y - minY) / rangeY) * (120 - pad * 2);
        return <circle key={tree.id} cx={cx} cy={cy} r={4} fill="#22c55e" opacity={0.8} />;
      })}
    </svg>
  );
}

export const ForestMap = ({
  forests,
  currentForestIndex,
  onClose,
  title = '나의 숲 목록',
}: ForestMapProps) => {
  // 최신 숲부터 표시
  const sorted = [...forests].sort((a, b) => b.id - a.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-3xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">완성한 숲 {forests.length}개</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 목록 */}
        <div className="overflow-y-auto p-6">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-4">🌱</span>
              <p className="text-muted-foreground text-sm leading-relaxed">
                아직 완성된 숲이 없어요.
                <br />
                집중해서 첫 번째 숲을 완성해보세요!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sorted.map((forest, index) => {
                const isCurrent = forest.id === currentForestIndex;
                const use3D = index < MAX_3D_PREVIEWS;
                return (
                  <div
                    key={forest.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isCurrent ? 'border-emerald-500 bg-emerald-500/5' : 'border-border bg-card'
                    }`}
                  >
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        성장 중
                      </span>
                    )}

                    {/* 프리뷰 */}
                    <div className="aspect-[5/3] rounded-xl overflow-hidden mb-3">
                      {use3D ? (
                        <MiniForest3D
                          trees={forest.treePositions}
                          className="w-full h-full"
                          fallback={<SvgPreview forest={forest} />}
                        />
                      ) : (
                        <SvgPreview forest={forest} />
                      )}
                    </div>

                    <p className="font-semibold text-foreground text-sm mb-1">숲 #{forest.id}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      나무 {forest.totalTrees}그루 · {formatFocusTime(forest.focusTimeSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {isCurrent ? '진행 중' : formatDate(forest.completedAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
