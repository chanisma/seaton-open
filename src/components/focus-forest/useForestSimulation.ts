// useForestSimulation.ts - Focus Forest 시뮬레이션 규칙 (렌더링과 분리)
// 나무 심기(3분당 1그루) / 성장(90초, 파생 계산) / 동물 스폰 / 숲 완성(120그루)

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ANIMAL_CONFIGS,
  type AnimalInstance,
  type AnimalType,
  type ForestStage,
  type TimeOfDay,
  type TreePosition,
  type TreeType,
} from '@/types/focusForest.types';

export const TREE_GROW_INTERVAL_S = 180;
export const TREE_FULL_GROW_S = 90;
export const FOREST_COMPLETE_COUNT = 120;
export const DAY_CYCLE_S = 600;

const SMALL_STAGE_MAX = 30;
const MEDIUM_STAGE_MAX = 70;

const STAGE_ANIMAL_COUNT: Record<ForestStage, number> = { small: 2, medium: 3, large: 4 };
const ANIMAL_VISIBLE_MIN_MS = 180_000;
const ANIMAL_VISIBLE_MAX_MS = 300_000;

const CENTER_X = 50;
const CENTER_Y = 50;

const TIME_BREAKPOINTS: Array<[number, TimeOfDay]> = [
  [0, 'dawn'],
  [140, 'day'],
  [300, 'sunset'],
  [440, 'night'],
];

export function getForestStage(count: number): ForestStage {
  if (count <= SMALL_STAGE_MAX) return 'small';
  if (count <= MEDIUM_STAGE_MAX) return 'medium';
  return 'large';
}

export function getTimeOfDay(elapsedSeconds: number): TimeOfDay {
  const cyclePos = elapsedSeconds % DAY_CYCLE_S;
  for (let i = TIME_BREAKPOINTS.length - 1; i >= 0; i--) {
    if (cyclePos >= TIME_BREAKPOINTS[i][0]) return TIME_BREAKPOINTS[i][1];
  }
  return 'dawn';
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickTreeType(rand: () => number): TreeType {
  const r = rand();
  if (r < 0.2) return 'large';
  if (r < 0.55) return 'medium';
  if (r < 0.8) return 'small';
  return 'bush';
}

// 중심에서 바깥으로 성장하는 radial 배치 (기존 규칙 포팅)
function pickTreePlacement(
  existing: TreePosition[],
  rand: () => number
): { x: number; y: number } | null {
  let existingMaxR = 0;
  for (const t of existing) {
    const dx = t.x - CENTER_X;
    const dy = t.y - CENTER_Y;
    existingMaxR = Math.max(existingMaxR, Math.sqrt(dx * dx + dy * dy));
  }
  const progress = existing.length / FOREST_COMPLETE_COUNT;
  const maxRadius = Math.max(5 + progress * 60, existingMaxR + 3);
  const minRadius = progress * progress * 20;

  for (let attempt = 0; attempt < 80; attempt++) {
    const angle = rand() * Math.PI * 2;
    const r = minRadius + Math.sqrt(rand()) * (maxRadius - minRadius);
    const x = CENTER_X + Math.cos(angle) * r + (rand() - 0.5) * 8;
    const y = CENTER_Y + Math.sin(angle) * r + (rand() - 0.5) * 8;
    if (x < 3 || x > 97 || y < 3 || y > 97) continue;

    const tooClose = existing.some(t => {
      const dx = t.x - x;
      const dy = t.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 7.2;
    });
    if (tooClose) continue;
    return { x, y };
  }
  return null;
}

export interface UseForestSimulationOptions {
  elapsedSeconds: number;
  isFocusing: boolean;
  savedTrees?: TreePosition[];
  currentForestIndex: number;
  onForestComplete?: (forestIndex: number) => void;
  onAnimalAppear?: (type: AnimalType) => void;
  onAnimalLeave?: (type: AnimalType) => void;
}

export interface ForestSimulation {
  trees: TreePosition[];
  animals: AnimalInstance[];
  forestStage: ForestStage;
  timeOfDay: TimeOfDay;
  grownTreeCount: number;
}

export function useForestSimulation({
  elapsedSeconds,
  isFocusing,
  savedTrees,
  currentForestIndex,
  onForestComplete,
  onAnimalAppear,
  onAnimalLeave,
}: UseForestSimulationOptions): ForestSimulation {
  // 저장된 나무는 완전 성장 상태로 복원
  const [plantedTrees, setPlantedTrees] = useState<TreePosition[]>(() =>
    (savedTrees ?? []).map(t => ({ ...t, growthStage: 1, plantedAt: -TREE_FULL_GROW_S }))
  );
  const [animals, setAnimals] = useState<AnimalInstance[]>([]);

  const randRef = useRef(seededRand(currentForestIndex * 31337));
  const lastPlantedRef = useRef(-TREE_GROW_INTERVAL_S);
  const completedRef = useRef(false);
  const forestIndexRef = useRef(currentForestIndex);
  forestIndexRef.current = currentForestIndex;

  // 콜백은 ref로 보관 (effect 의존성 오염 방지)
  const onForestCompleteRef = useRef(onForestComplete);
  onForestCompleteRef.current = onForestComplete;
  const onAnimalAppearRef = useRef(onAnimalAppear);
  onAnimalAppearRef.current = onAnimalAppear;
  const onAnimalLeaveRef = useRef(onAnimalLeave);
  onAnimalLeaveRef.current = onAnimalLeave;

  // ---- 성장: 파생 계산 (상태 아님) ----
  const trees = useMemo(
    () =>
      plantedTrees.map(t =>
        t.growthStage >= 1
          ? t
          : {
              ...t,
              growthStage: Math.max(
                0,
                Math.min(1, (elapsedSeconds - t.plantedAt) / TREE_FULL_GROW_S)
              ),
            }
      ),
    [plantedTrees, elapsedSeconds]
  );
  const grownTreeCount = useMemo(() => trees.filter(t => t.growthStage >= 1).length, [trees]);

  const forestStage = getForestStage(plantedTrees.length);
  const timeOfDay = getTimeOfDay(elapsedSeconds);

  // ---- 나무 심기: 3분 경과마다 1그루 ----
  useEffect(() => {
    if (!isFocusing || completedRef.current) return;
    if (elapsedSeconds - lastPlantedRef.current < TREE_GROW_INTERVAL_S) return;

    const rand = randRef.current;
    setPlantedTrees(prev => {
      if (prev.length >= FOREST_COMPLETE_COUNT) return prev;
      const placement = pickTreePlacement(prev, rand);
      if (!placement) return prev;
      lastPlantedRef.current = elapsedSeconds;
      return [
        ...prev,
        {
          id: `tree-${elapsedSeconds}-${Math.floor(rand() * 9999)}`,
          x: placement.x,
          y: placement.y,
          type: pickTreeType(rand),
          variant: Math.floor(rand() * 8),
          growthStage: 0,
          plantedAt: elapsedSeconds,
          size: 1,
        },
      ];
    });
  }, [elapsedSeconds, isFocusing]);

  // ---- 숲 완성: 120그루 전부 성장 → 이벤트 후 3초 뒤 조용히 리셋 ----
  useEffect(() => {
    if (grownTreeCount < FOREST_COMPLETE_COUNT || completedRef.current) return;
    completedRef.current = true;
    onForestCompleteRef.current?.(forestIndexRef.current);

    const timer = setTimeout(() => {
      randRef.current = seededRand((forestIndexRef.current + 1) * 31337);
      lastPlantedRef.current = elapsedSeconds;
      setPlantedTrees([]);
      setAnimals([]);
      completedRef.current = false;
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grownTreeCount]);

  // ---- 단계 전환 시 동물 초기화 (다음 effect가 목표 수까지 재스폰) ----
  const prevStageRef = useRef(forestStage);
  useEffect(() => {
    if (prevStageRef.current !== forestStage) {
      prevStageRef.current = forestStage;
      setAnimals([]);
    }
  }, [forestStage]);

  // ---- 동물 스폰: 단계별 목표 마릿수 유지 ----
  const plantedTreesRef = useRef(plantedTrees);
  plantedTreesRef.current = plantedTrees;

  useEffect(() => {
    if (!isFocusing || plantedTreesRef.current.length === 0) return;
    const target = STAGE_ANIMAL_COUNT[forestStage];
    const visibleCount = animals.filter(a => a.isVisible).length;
    if (visibleCount >= target) return;

    const delay = visibleCount === 0 ? 500 : 1500 + Math.random() * 2000;
    const timer = setTimeout(() => {
      const rand = randRef.current;
      const treeCount = plantedTreesRef.current.length;
      const available = ANIMAL_CONFIGS.filter(cfg => {
        if (treeCount <= SMALL_STAGE_MAX) return cfg.rarity === 'common';
        if (treeCount <= MEDIUM_STAGE_MAX)
          return cfg.rarity === 'common' || cfg.rarity === 'uncommon';
        return true;
      });
      if (available.length === 0) return;
      const cfg = available[Math.floor(rand() * available.length)];

      // 나무가 없는 중앙 클리어링 근처에 배치
      const distances = plantedTreesRef.current
        .map(t => Math.sqrt((t.x - CENTER_X) ** 2 + (t.y - CENTER_Y) ** 2))
        .sort((a, b) => a - b);
      const boundary =
        treeCount <= SMALL_STAGE_MAX
          ? treeCount
          : treeCount <= MEDIUM_STAGE_MAX
            ? SMALL_STAGE_MAX
            : MEDIUM_STAGE_MAX;
      const spawnR = Math.max(15, distances[Math.min(boundary, distances.length) - 1] ?? 15);

      let ax = CENTER_X;
      let ay = CENTER_Y;
      for (let attempt = 0; attempt < 20; attempt++) {
        const angle = rand() * Math.PI * 2;
        const r = rand() * spawnR;
        ax = Math.max(5, Math.min(95, CENTER_X + Math.cos(angle) * r));
        ay = Math.max(5, Math.min(95, CENTER_Y + Math.sin(angle) * r));
        const blocked = plantedTreesRef.current.some(t => {
          const dx = t.x - ax;
          const dy = t.y - ay;
          return Math.sqrt(dx * dx + dy * dy) < 8;
        });
        if (!blocked) break;
      }

      const duration =
        ANIMAL_VISIBLE_MIN_MS + rand() * (ANIMAL_VISIBLE_MAX_MS - ANIMAL_VISIBLE_MIN_MS);
      const newAnimal: AnimalInstance = {
        id: `animal-${Date.now()}-${Math.floor(rand() * 9999)}`,
        type: cfg.type,
        x: ax,
        y: ay,
        direction: rand() * 360,
        isVisible: true,
        spawnedAt: Date.now(),
        duration,
      };

      onAnimalAppearRef.current?.(cfg.type);
      setAnimals(prev => [...prev, newAnimal]);

      // 체류 시간 종료 → 퇴장 → 1.5초 뒤 제거 (제거가 재스폰 effect를 트리거)
      setTimeout(() => {
        onAnimalLeaveRef.current?.(cfg.type);
        setAnimals(a => a.map(an => (an.id === newAnimal.id ? { ...an, isVisible: false } : an)));
        setTimeout(() => setAnimals(a => a.filter(an => an.id !== newAnimal.id)), 1500);
      }, duration);
    }, delay);

    return () => clearTimeout(timer);
  }, [animals, forestStage, isFocusing]);

  return { trees, animals, forestStage, timeOfDay, grownTreeCount };
}
