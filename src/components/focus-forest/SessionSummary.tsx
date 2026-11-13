// SessionSummary.tsx - 세션 종료 요약. 세션 중 억제했던 보상(동물·발견·완성)을 여기서 몰아서 보여준다.

import { useMemo } from 'react';

import { ANIMAL_DIALOGUES } from '@/data/animalDialogues';
import { ANIMAL_CONFIGS, type AnimalType } from '@/types/focusForest.types';

import { formatDurationKorean } from './formatDuration';
import { FOREST_COMPLETE_COUNT } from './useForestSimulation';

export interface SessionSummaryData {
  durationSeconds: number;
  treesPlanted: number;
  animalsSeen: { type: AnimalType; isNew: boolean }[];
  forestsCompleted: number;
  forestProgressCount: number;
  goalReached: boolean;
  goalMinutes: number | null;
  /** 집중 코인 결과 한 줄 (서버가 시간을 잰 목표 세션만). null/undefined = 표시 안 함 */
  coinMessage?: string | null;
}

interface SessionSummaryProps {
  summary: SessionSummaryData;
  onClose: () => void;
}

export const SessionSummary = ({ summary, onClose }: SessionSummaryProps) => {
  const {
    durationSeconds,
    treesPlanted,
    animalsSeen,
    forestsCompleted,
    forestProgressCount,
    goalReached,
    goalMinutes,
    coinMessage,
  } = summary;

  // 다녀간 동물 중 하나의 대사를 "동물의 한마디"로 (세션 중 말풍선 대체)
  const quote = useMemo(() => {
    if (animalsSeen.length === 0) return null;
    const pick = animalsSeen[Math.floor(Math.random() * animalsSeen.length)];
    const dialogues = ANIMAL_DIALOGUES[pick.type];
    if (!dialogues || dialogues.length === 0) return null;
    const config = ANIMAL_CONFIGS.find(c => c.type === pick.type);
    return {
      text: dialogues[Math.floor(Math.random() * dialogues.length)],
      name: config?.nameKo ?? '',
      emoji: config?.emoji ?? '',
    };
  }, [animalsSeen]);

  const newCount = animalsSeen.filter(a => a.isNew).length;
  const progressPct = Math.round((forestProgressCount / FOREST_COMPLETE_COUNT) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl
          p-8 flex flex-col items-center gap-6 text-center animate-scale-in
          max-h-[90vh] overflow-y-auto"
      >
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl">{goalReached ? '🎉' : '🌿'}</span>
          <h2 className="text-2xl font-bold text-foreground">
            {goalReached ? '목표 달성!' : '수고했어요'}
          </h2>
          {goalMinutes !== null && (
            <p className="text-sm text-muted-foreground">
              {goalReached
                ? `${goalMinutes}분 집중을 해냈어요`
                : `목표 ${goalMinutes}분 중 일부를 집중했어요`}
            </p>
          )}
          {coinMessage && (
            <p className="mt-2 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
              🪙 {coinMessage}
            </p>
          )}
        </div>

        {/* 집중 시간 */}
        <div className="flex flex-col items-center">
          <span className="text-4xl font-mono font-bold text-emerald-500 tabular-nums">
            {formatDurationKorean(durationSeconds)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">이번 세션 집중 시간</span>
        </div>

        {/* 통계 칩 */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-full px-3 py-1">
            🌱 나무 {treesPlanted}그루
          </span>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-full px-3 py-1">
            🌳 숲 진행 {forestProgressCount}/{FOREST_COMPLETE_COUNT} ({progressPct}%)
          </span>
          {forestsCompleted > 0 && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold rounded-full px-3 py-1">
              🏆 숲 {forestsCompleted}개 완성!
            </span>
          )}
        </div>

        {/* 다녀간 동물 */}
        {animalsSeen.length > 0 && (
          <div className="w-full">
            <p className="text-sm font-semibold text-foreground mb-2">
              이번 세션에 다녀간 동물
              {newCount > 0 && (
                <span className="ml-2 text-xs font-bold text-emerald-500">
                  새 발견 {newCount}종!
                </span>
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {animalsSeen.map(({ type, isNew }) => {
                const config = ANIMAL_CONFIGS.find(c => c.type === type);
                if (!config) return null;
                return (
                  <span
                    key={type}
                    className={`relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm ${
                      isNew
                        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-border bg-muted text-foreground'
                    }`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    {config.nameKo}
                    {isNew && (
                      <span className="text-[10px] font-bold bg-emerald-500 text-white rounded-full px-1.5 py-0.5">
                        NEW
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 동물의 한마디 */}
        {quote && (
          <blockquote className="w-full bg-muted rounded-2xl p-4 text-sm text-foreground leading-relaxed">
            “{quote.text}”
            <footer className="mt-2 text-xs text-muted-foreground">
              {quote.emoji} {quote.name}의 한마디
            </footer>
          </blockquote>
        )}

        {/* 휴식 안내 */}
        {goalReached && (
          <p className="text-sm text-muted-foreground">잠깐 5분 정도 쉬어가는 걸 추천해요 ☕</p>
        )}

        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
            text-white font-semibold rounded-2xl px-8 py-3.5 transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          숲으로 돌아가기
        </button>
      </div>
    </div>
  );
};
