// AnimalCollection.tsx - 동물 도감 (희귀도별 그룹핑, 미발견은 실루엣)

import { X } from 'lucide-react';

import type { AnimalCollection as AnimalCollectionType } from '@/types/focusForest.types';
import { ANIMAL_CONFIGS } from '@/types/focusForest.types';

interface AnimalCollectionProps {
  collection: AnimalCollectionType;
  totalFocusHours: number;
  onClose: () => void;
  title?: string;
}

type Rarity = (typeof ANIMAL_CONFIGS)[number]['rarity'];

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'hidden'];

const RARITY_LABEL: Record<Rarity, string> = {
  common: '흔함',
  uncommon: '보통',
  rare: '희귀',
  epic: '영웅',
  legendary: '전설',
  hidden: '히든',
};

const RARITY_ACCENT: Record<Rarity, string> = {
  common: 'text-gray-500 dark:text-gray-400',
  uncommon: 'text-green-600 dark:text-green-400',
  rare: 'text-blue-600 dark:text-blue-400',
  epic: 'text-purple-600 dark:text-purple-400',
  legendary: 'text-amber-600 dark:text-amber-400',
  hidden: 'text-rose-600 dark:text-rose-400',
};

const RARITY_CARD: Record<Rarity, string> = {
  common: 'border-border bg-muted/50',
  uncommon: 'border-green-400/50 bg-green-500/5',
  rare: 'border-blue-400/50 bg-blue-500/5',
  epic: 'border-purple-400/50 bg-purple-500/5',
  legendary: 'border-amber-400/50 bg-amber-500/5',
  hidden: 'border-rose-400/50 bg-rose-500/5',
};

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${mo}.${day}`;
}

export const AnimalCollection = ({
  collection,
  totalFocusHours,
  onClose,
  title = '동물 도감',
}: AnimalCollectionProps) => {
  const discoveredCount = ANIMAL_CONFIGS.filter(cfg => collection[cfg.type]?.discovered).length;
  const totalCount = ANIMAL_CONFIGS.length;
  const discoveryPct = Math.round((discoveredCount / totalCount) * 100);

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
            <p className="text-sm text-muted-foreground">
              {discoveredCount}/{totalCount} 발견
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 희귀도별 그룹 */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {RARITY_ORDER.map(rarity => {
            const animals = ANIMAL_CONFIGS.filter(cfg => cfg.rarity === rarity);
            if (animals.length === 0) return null;
            return (
              <section key={rarity}>
                <h3
                  className={`text-xs font-bold uppercase tracking-wider mb-2 ${RARITY_ACCENT[rarity]}`}
                >
                  {RARITY_LABEL[rarity]}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {animals.map(cfg => {
                    const discovery = collection[cfg.type];
                    const isDiscovered = discovery?.discovered ?? false;

                    if (isDiscovered) {
                      return (
                        <div
                          key={cfg.type}
                          className={`relative rounded-2xl border p-3 flex flex-col items-center gap-1.5 ${RARITY_CARD[rarity]}`}
                        >
                          {(discovery.totalSeen ?? 0) > 1 && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold bg-card text-muted-foreground rounded-full px-1.5 py-0.5 shadow-sm">
                              ×{discovery.totalSeen}
                            </span>
                          )}
                          <span className="text-4xl leading-none py-2">{cfg.emoji}</span>
                          <p className="text-sm font-semibold text-foreground">{cfg.nameKo}</p>
                          {discovery.firstSeenAt && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(discovery.firstSeenAt)} 첫 만남
                            </p>
                          )}
                        </div>
                      );
                    }

                    const canUnlock = totalFocusHours >= cfg.requiredHours;
                    return (
                      <div
                        key={cfg.type}
                        className="rounded-2xl border border-border bg-muted/30 p-3 flex flex-col items-center gap-1.5"
                      >
                        {/* 실루엣: emoji를 검게(다크모드는 밝게) */}
                        <span
                          className="text-4xl leading-none py-2 grayscale brightness-0 opacity-25 dark:invert select-none"
                          aria-hidden
                        >
                          {cfg.emoji}
                        </span>
                        <p className="text-sm font-semibold text-muted-foreground">???</p>
                        <p className="text-[10px] text-muted-foreground/80 text-center leading-tight">
                          {canUnlock
                            ? '곧 만날 수 있어요!'
                            : `총 ${cfg.requiredHours}시간 집중하면 만날 수 있어요`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* 발견률 */}
        <div className="px-6 pb-5 shrink-0 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>발견률</span>
            <span>{discoveryPct}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${discoveryPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
