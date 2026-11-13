# Focus Forest 오버홀 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Focus Forest를 픽셀아트+개별 3D Canvas 혼재 구조에서 단일 R3F 로우폴리 3D 씬으로 전면 재구성하고, 방해 요소(말풍선·토스트·중간 모달)를 세션 종료 요약으로 이관하며 세션 목표(뽀모도로) 기능을 추가한다.

**Architecture:** 시뮬레이션 규칙(나무 심기·성장·동물 스폰·숲 완성)은 `useForestSimulation` 훅이 소유하고, 씬 컴포넌트는 결과를 그리기만 한다. 나무는 타입별 `InstancedMesh`, 동물은 기존 GLB 24종을 단일 Canvas 안에서 렌더. 낮/밤은 조명·하늘·안개 색 lerp.

**Tech Stack:** React 18, TypeScript, three ^0.183, @react-three/fiber ^8, @react-three/drei ^9, Tailwind CSS 3 (모두 기설치 — 신규 의존성 없음)

**스펙:** `docs/superpowers/specs/2026-07-11-focus-forest-overhaul-design.md`

## Global Constraints

- 신규 npm 의존성 추가 금지 (런타임·dev 모두)
- 타입 검사는 반드시 `npx tsc -b` (이 저장소에서 `tsc --noEmit`은 프로젝트 레퍼런스 미해석으로 거짓 통과함)
- 테스트 러너가 없으므로 각 태스크의 검증 = `npx tsc -b` + `npm run lint` + (UI 태스크는) dev 서버 수동 확인
- 기존 저장 데이터 하위 호환: `TreePosition`(x·y는 0~100 퍼센트), `CompletedForest`, `AnimalCollection`, `DailyRecord` 포맷 유지. 새 필드는 optional 또는 default 병합
- 좌표 매핑 규약: `worldX = tree.x - 50`, `worldZ = tree.y - 50` (월드 좌표 -50~50, 지형 반지름 70)
- 게임 수치 유지: 3분당 나무 1그루, 90초 완전 성장, 120그루 숲 완성, 낮밤 600초 주기(dawn 0 / day 140 / sunset 300 / night 440), 단계별 동물 수(small 2 / medium 3 / large 4), 동물 체류 3~5분
- 커밋 메시지는 `feat:`/`refactor:`/`chore:` 규칙 + 마지막 줄 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- 모든 사용자 노출 문구는 한국어

## 파일 구조 (최종)

```
src/components/focus-forest/
├── scene/
│   ├── ForestScene.tsx       # Canvas 진입점 + CameraRig + ErrorBoundary (Task 7)
│   ├── Terrain.tsx           # 로우폴리 지형 (Task 4)
│   ├── Trees.tsx             # InstancedMesh 렌더러 (Task 5)
│   ├── treeGeometries.ts     # 프로시저럴 지오메트리 (Task 1)
│   ├── Animals.tsx           # GLB 동물 (Task 6)
│   ├── SkyAndLights.tsx      # 낮/밤 조명 + dayNight 샘플러 (Task 3)
│   ├── Fireflies.tsx         # 야간 반딧불이 (Task 4)
│   └── MiniForest3D.tsx      # 정적 미니 프리뷰 (Task 11에서 생성, Task 12가 재사용)
├── useForestSimulation.ts    # 시뮬레이션 훅 (Task 2)
├── FocusHud.tsx              # 타이머 HUD (Task 8)
├── SessionSummary.tsx        # 세션 종료 요약 (Task 9)
├── FocusOverlay.tsx          # 일시정지 (Task 9에서 재작성)
├── ForestMap.tsx             # 숲 목록 (Task 12에서 재작성)
├── AnimalCollection.tsx      # 도감 (Task 13에서 재작성)
├── FocusStatistics.tsx       # 기록 (Task 13에서 토큰 정돈)
└── index.ts                  # (Task 14에서 갱신)

삭제(Task 14): ForestCanvas.tsx, FocusTimer.tsx, AnimalToast.tsx, Animal3DModel.tsx,
assets/ 전체(18파일), src/pages/admin/FocusForestAssetsPage.tsx(+라우트·네비),
public/forest-bg.png
수정: src/types/focusForest.types.ts, src/hooks/useFocusForestData.ts (Task 10),
src/pages/FocusForestPage.tsx (Task 11), src/App.tsx·Navigation.tsx (Task 14)
```

공통 모달 셸 토큰 (Task 9·12·13에서 반복 사용):
`bg-white dark:bg-gray-900 → bg-card` · `text-gray-900 dark:text-white → text-foreground` ·
`text-gray-500 dark:text-gray-400 → text-muted-foreground` · `border-gray-200 dark:border-gray-700 → border-border` ·
셸 라운드 `rounded-2xl → rounded-3xl` · 포인트 컬러는 emerald 유지

---

### Task 1: 프로시저럴 나무 지오메트리 (`treeGeometries.ts`)

**Files:**
- Create: `src/components/focus-forest/scene/treeGeometries.ts`

**Interfaces:**
- Consumes: `TreeType` (`@/types/focusForest.types`)
- Produces: `type TreeFamily`, `FAMILY_BY_TREE_TYPE: Record<TreeType, TreeFamily>`, `createTreeGeometry(family: TreeFamily): THREE.BufferGeometry` (vertex color 포함, 바닥 y=0), `TREE_MATERIAL: THREE.MeshStandardMaterial` (vertexColors + flatShading). Task 5(Trees.tsx)가 이 셋을 그대로 import한다.

- [ ] **Step 1: 파일 작성**

```ts
// treeGeometries.ts - 로우폴리 나무 프로시저럴 지오메트리 팩토리
// 모든 지오메트리는 바닥이 y=0, vertex color 포함 (재질 1개로 인스턴싱)

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TreeType } from '@/types/focusForest.types';

export type TreeFamily = 'broadLarge' | 'conifer' | 'broadSmall' | 'shrub' | 'sapling';

export const FAMILY_BY_TREE_TYPE: Record<TreeType, TreeFamily> = {
  large: 'broadLarge',
  medium: 'conifer',
  small: 'broadSmall',
  bush: 'shrub',
  sapling: 'sapling',
};

export const TREE_FAMILIES: TreeFamily[] = [
  'broadLarge',
  'conifer',
  'broadSmall',
  'shrub',
  'sapling',
];

const TRUNK_BROWN = new THREE.Color('#7a5230');
const GREEN_DARK = new THREE.Color('#2f6b3a');
const GREEN_MID = new THREE.Color('#3f8a4a');
const GREEN_LIGHT = new THREE.Color('#5aa85e');

// vertex color를 칠하고, merge 호환을 위해 uv를 제거한다
function paint(geo: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) color.toArray(colors, i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.deleteAttribute('uv');
  return geo;
}

function trunk(radius: number, height: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.7, radius, height, 5);
  geo.translate(0, height / 2, 0);
  return paint(geo, TRUNK_BROWN);
}

function broadLarge(): THREE.BufferGeometry {
  const canopy = new THREE.IcosahedronGeometry(2.6, 0);
  canopy.scale(1, 1.15, 1);
  canopy.translate(0, 4.6, 0);
  const lower = new THREE.IcosahedronGeometry(1.6, 0);
  lower.translate(1.1, 3.4, 0.6);
  return mergeGeometries([trunk(0.5, 3), paint(canopy, GREEN_MID), paint(lower, GREEN_DARK)]);
}

function conifer(): THREE.BufferGeometry {
  const c1 = new THREE.ConeGeometry(2.2, 2.4, 6);
  c1.translate(0, 2.8, 0);
  const c2 = new THREE.ConeGeometry(1.7, 2.1, 6);
  c2.translate(0, 4.3, 0);
  const c3 = new THREE.ConeGeometry(1.1, 1.8, 6);
  c3.translate(0, 5.7, 0);
  return mergeGeometries([
    trunk(0.4, 2),
    paint(c1, GREEN_DARK),
    paint(c2, GREEN_MID),
    paint(c3, GREEN_LIGHT),
  ]);
}

function broadSmall(): THREE.BufferGeometry {
  const canopy = new THREE.IcosahedronGeometry(1.7, 0);
  canopy.scale(1, 1.1, 1);
  canopy.translate(0, 3.1, 0);
  return mergeGeometries([trunk(0.35, 2), paint(canopy, GREEN_LIGHT)]);
}

function shrub(): THREE.BufferGeometry {
  const body = new THREE.SphereGeometry(1.4, 6, 4);
  body.scale(1, 0.65, 1);
  body.translate(0, 0.9, 0);
  const side = new THREE.SphereGeometry(0.8, 6, 4);
  side.scale(1, 0.7, 1);
  side.translate(1.1, 0.55, 0.3);
  return mergeGeometries([paint(body, GREEN_MID), paint(side, GREEN_DARK)]);
}

function sapling(): THREE.BufferGeometry {
  const top = new THREE.ConeGeometry(0.7, 1.4, 6);
  top.translate(0, 1.6, 0);
  return mergeGeometries([trunk(0.15, 1), paint(top, GREEN_LIGHT)]);
}

export function createTreeGeometry(family: TreeFamily): THREE.BufferGeometry {
  switch (family) {
    case 'broadLarge':
      return broadLarge();
    case 'conifer':
      return conifer();
    case 'broadSmall':
      return broadSmall();
    case 'shrub':
      return shrub();
    case 'sapling':
      return sapling();
  }
}

// 모든 나무가 공유하는 단일 재질 (인스턴스 tint는 instanceColor로 곱해짐)
export const TREE_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.9,
  metalness: 0,
});
```

- [ ] **Step 2: 타입 검사**

Run: `npx tsc -b`
Expected: 에러 없음 (출력 없이 종료 코드 0)

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/scene/treeGeometries.ts
git commit -m "feat: 로우폴리 나무 프로시저럴 지오메트리 팩토리 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 시뮬레이션 훅 (`useForestSimulation.ts`)

**Files:**
- Create: `src/components/focus-forest/useForestSimulation.ts`

**Interfaces:**
- Consumes: `@/types/focusForest.types`의 `TreePosition`, `AnimalInstance`, `AnimalType`, `ForestStage`, `TimeOfDay`, `TreeType`, `ANIMAL_CONFIGS`
- Produces (Task 7·11이 사용):

```ts
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
  trees: TreePosition[];        // growthStage 0~1 파생 포함
  animals: AnimalInstance[];
  forestStage: ForestStage;
  timeOfDay: TimeOfDay;
  grownTreeCount: number;       // growthStage >= 1 개수
}
export function useForestSimulation(opts: UseForestSimulationOptions): ForestSimulation;
export function getForestStage(count: number): ForestStage;
export function getTimeOfDay(elapsedSeconds: number): TimeOfDay;
export const FOREST_COMPLETE_COUNT = 120;
export const DAY_CYCLE_S = 600;
```

핵심 설계: 기존 ForestCanvas의 500ms 성장 interval과 ref 미러링을 제거한다. `growthStage`는 `(elapsedSeconds - plantedAt) / 90`으로 **파생 계산**하고(상태 아님), 시각적 부드러움은 Task 5의 `useFrame` damping이 담당한다.

- [ ] **Step 1: 파일 작성**

```ts
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
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/useForestSimulation.ts
git commit -m "feat: 렌더와 분리된 useForestSimulation 훅 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 낮/밤 조명 시스템 (`SkyAndLights.tsx`)

**Files:**
- Create: `src/components/focus-forest/scene/SkyAndLights.tsx`

**Interfaces:**
- Consumes: `DAY_CYCLE_S` (Task 2)
- Produces: `sampleDayNight(cycleSeconds: number, goldenHour: boolean, out: DayNightSample): DayNightSample`, `createDayNightSample(): DayNightSample`, `interface DayNightSample`, `<SkyAndLights elapsedSeconds={number} goldenHour={boolean} />` (Canvas 내부 전용). Task 4의 Fireflies가 `sampleDayNight`·`createDayNightSample`을, Task 7·12가 컴포넌트를 사용.

- [ ] **Step 1: 파일 작성**

```tsx
// SkyAndLights.tsx - 낮/밤 사이클: 하늘·안개·태양광·반구광을 키프레임 lerp로 전환
// 오버레이 div 대신 실제 씬 조명이 변한다. goldenHour=true면 목표 달성 연출로 고정.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { DAY_CYCLE_S } from '../useForestSimulation';

export interface DayNightSample {
  sky: THREE.Color;
  fog: THREE.Color;
  sun: THREE.Color;
  sunIntensity: number;
  hemiIntensity: number;
  fireflyStrength: number; // 0~1, 밤에만 1
}

interface Keyframe {
  time: number;
  sky: string;
  fog: string;
  sun: string;
  sunIntensity: number;
  hemiIntensity: number;
  fireflyStrength: number;
}

// dawn 0 / day 140 / sunset 300 / night 440 (600초 주기, 스펙 고정값)
const KEYFRAMES: Keyframe[] = [
  { time: 0,   sky: '#f2b27d', fog: '#f7cba0', sun: '#ffb36b', sunIntensity: 0.9, hemiIntensity: 0.45, fireflyStrength: 0 },
  { time: 140, sky: '#9ed6ff', fog: '#cfe8ff', sun: '#fff3df', sunIntensity: 1.5, hemiIntensity: 0.7,  fireflyStrength: 0 },
  { time: 300, sky: '#ff9e6d', fog: '#ffbe94', sun: '#ff8a4a', sunIntensity: 1.0, hemiIntensity: 0.5,  fireflyStrength: 0.15 },
  { time: 440, sky: '#0e1a3a', fog: '#16234a', sun: '#8fb4ff', sunIntensity: 0.3, hemiIntensity: 0.18, fireflyStrength: 1 },
];

// 목표 달성(골든아워) 연출 프리셋
const GOLDEN: Keyframe = {
  time: 0, sky: '#ffb75e', fog: '#ffd9a0', sun: '#ffc46b',
  sunIntensity: 1.3, hemiIntensity: 0.6, fireflyStrength: 0,
};

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function applyKeyframePair(a: Keyframe, b: Keyframe, t: number, out: DayNightSample): void {
  out.sky.lerpColors(tmpA.set(a.sky), tmpB.set(b.sky), t);
  out.fog.lerpColors(tmpA.set(a.fog), tmpB.set(b.fog), t);
  out.sun.lerpColors(tmpA.set(a.sun), tmpB.set(b.sun), t);
  out.sunIntensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t;
  out.hemiIntensity = a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * t;
  out.fireflyStrength = a.fireflyStrength + (b.fireflyStrength - a.fireflyStrength) * t;
}

export function createDayNightSample(): DayNightSample {
  return {
    sky: new THREE.Color(),
    fog: new THREE.Color(),
    sun: new THREE.Color(),
    sunIntensity: 1,
    hemiIntensity: 0.6,
    fireflyStrength: 0,
  };
}

export function sampleDayNight(
  cycleSeconds: number,
  goldenHour: boolean,
  out: DayNightSample
): DayNightSample {
  if (goldenHour) {
    applyKeyframePair(GOLDEN, GOLDEN, 0, out);
    return out;
  }
  const cycle = ((cycleSeconds % DAY_CYCLE_S) + DAY_CYCLE_S) % DAY_CYCLE_S;
  for (let i = 0; i < KEYFRAMES.length; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[(i + 1) % KEYFRAMES.length];
    const end = i === KEYFRAMES.length - 1 ? DAY_CYCLE_S : b.time;
    if (cycle >= a.time && cycle < end) {
      applyKeyframePair(a, b, (cycle - a.time) / (end - a.time), out);
      return out;
    }
  }
  applyKeyframePair(KEYFRAMES[0], KEYFRAMES[0], 0, out);
  return out;
}

interface SkyAndLightsProps {
  elapsedSeconds: number;
  goldenHour: boolean;
}

export const SkyAndLights = ({ elapsedSeconds, goldenHour }: SkyAndLightsProps) => {
  const scene = useThree(state => state.scene);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(createDayNightSample, []);
  // 초기값은 현재 시각 기준으로 한 번 샘플링
  const current = useMemo(
    () => sampleDayNight(elapsedSeconds, false, createDayNightSample()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 배경/안개 객체는 한 번만 설치하고 색만 매 프레임 갱신
  useEffect(() => {
    scene.background = current.sky;
    scene.fog = new THREE.Fog(current.fog, 60, 190);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, current]);

  useFrame((_, delta) => {
    sampleDayNight(elapsedSeconds, goldenHour, target);
    // 지수 감쇠로 부드럽게 목표값 추적 (골든아워 진입은 조금 빠르게)
    const k = 1 - Math.exp(-(goldenHour ? 1.2 : 0.5) * delta);
    current.sky.lerp(target.sky, k);
    current.fog.lerp(target.fog, k);
    current.sun.lerp(target.sun, k);
    current.sunIntensity += (target.sunIntensity - current.sunIntensity) * k;
    current.hemiIntensity += (target.hemiIntensity - current.hemiIntensity) * k;

    if (scene.fog) scene.fog.color.copy(current.fog);
    if (sunRef.current) {
      sunRef.current.color.copy(current.sun);
      sunRef.current.intensity = current.sunIntensity;
    }
    if (hemiRef.current) hemiRef.current.intensity = current.hemiIntensity;
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#cfe8ff', '#3c7443', 0.6]} />
      <directionalLight
        ref={sunRef}
        position={[40, 55, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={160}
      />
      <ambientLight intensity={0.25} />
    </>
  );
};
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/scene/SkyAndLights.tsx
git commit -m "feat: 낮/밤 조명 시스템(SkyAndLights) 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 지형 + 반딧불이 (`Terrain.tsx`, `Fireflies.tsx`)

**Files:**
- Create: `src/components/focus-forest/scene/Terrain.tsx`
- Create: `src/components/focus-forest/scene/Fireflies.tsx`

**Interfaces:**
- Consumes: `sampleDayNight`, `createDayNightSample` (Task 3)
- Produces: `<Terrain />`, `<Fireflies elapsedSeconds={number} />` (둘 다 Canvas 내부 전용, Task 7·12에서 사용)

- [ ] **Step 1: Terrain.tsx 작성**

```tsx
// Terrain.tsx - 원형 로우폴리 언덕 지형 (중앙은 평탄한 클리어링)

import { useMemo } from 'react';
import * as THREE from 'three';

const RADIUS = 70;

function buildTerrainGeometry(): THREE.BufferGeometry {
  // toNonIndexed로 면 단위 버텍스 분리 → flat shading + 면 단위 색상
  const geo = new THREE.CircleGeometry(RADIUS, 64).toNonIndexed();
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dark = new THREE.Color('#3c7443');
  const base = new THREE.Color('#4c8a4f');
  const c = new THREE.Color();

  // 정점 변위 (중앙 반경 12는 평탄 유지 — 동물 클리어링)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    const edgeFactor = Math.min(1, Math.max(0, (r - 12) / 20));
    const y =
      (Math.sin(x * 0.15) * Math.cos(z * 0.13) + Math.sin(x * 0.05 + z * 0.07) * 1.5) *
      0.9 *
      edgeFactor;
    pos.setY(i, y);
  }

  // 면 단위 색상 (삼각형의 3개 정점에 같은 색)
  for (let face = 0; face < pos.count / 3; face++) {
    const t = Math.abs(Math.sin(face * 127.1) * 43758.5453) % 1;
    c.lerpColors(dark, base, 0.35 + 0.65 * t);
    for (let v = 0; v < 3; v++) c.toArray(colors, (face * 3 + v) * 3);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export const Terrain = () => {
  const geometry = useMemo(buildTerrainGeometry, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
    </mesh>
  );
};
```

- [ ] **Step 2: Fireflies.tsx 작성**

```tsx
// Fireflies.tsx - 야간에만 나타나는 반딧불이 (additive Points)

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { createDayNightSample, sampleDayNight } from './SkyAndLights';

const COUNT = 110;

export const Fireflies = ({ elapsedSeconds }: { elapsedSeconds: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const sample = useMemo(createDayNightSample, []);
  const strengthRef = useRef(0);

  // 기준 위치 + 드리프트 시드
  const { basePositions, seeds, positions } = useMemo(() => {
    const basePositions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 43;
      basePositions[i * 3] = Math.cos(angle) * r;
      basePositions[i * 3 + 1] = 1 + Math.random() * 6;
      basePositions[i * 3 + 2] = Math.sin(angle) * r;
      seeds[i] = Math.random() * 100;
    }
    return { basePositions, seeds, positions: basePositions.slice() };
  }, []);

  useFrame(state => {
    sampleDayNight(elapsedSeconds, false, sample);
    // 밤 진입/이탈을 부드럽게
    strengthRef.current += (sample.fireflyStrength - strengthRef.current) * 0.02;
    const strength = strengthRef.current;

    if (materialRef.current) materialRef.current.opacity = strength * 0.9;
    if (!pointsRef.current || strength < 0.01) return;

    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = basePositions[i * 3] + Math.sin(t * 0.4 + seeds[i]) * 1.6;
      positions[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(t * 0.7 + seeds[i] * 2) * 0.9;
      positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(t * 0.5 + seeds[i]) * 1.6;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.8}
        color="#d8ffb0"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
```

- [ ] **Step 3: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/focus-forest/scene/Terrain.tsx src/components/focus-forest/scene/Fireflies.tsx
git commit -m "feat: 로우폴리 지형과 반딧불이 씬 요소 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 나무 InstancedMesh 렌더러 (`Trees.tsx`)

**Files:**
- Create: `src/components/focus-forest/scene/Trees.tsx`

**Interfaces:**
- Consumes: `createTreeGeometry`, `FAMILY_BY_TREE_TYPE`, `TREE_FAMILIES`, `TREE_MATERIAL`, `TreeFamily` (Task 1), `TreePosition`
- Produces: `<Trees trees={TreePosition[]} immediate={boolean?} />` — `immediate`는 성장 damping 없이 즉시 표시 (Task 12의 정적 프리뷰용). Task 7·12에서 사용.

- [ ] **Step 1: 파일 작성**

```tsx
// Trees.tsx - 타입(family)별 InstancedMesh 나무 렌더러
// 성장 스케일은 useFrame damping으로 부드럽게 목표값을 추적한다

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { TreePosition } from '@/types/focusForest.types';

import {
  createTreeGeometry,
  FAMILY_BY_TREE_TYPE,
  TREE_FAMILIES,
  TREE_MATERIAL,
  type TreeFamily,
} from './treeGeometries';

const MAX_INSTANCES = 130; // 숲 완성 120 + 여유

// 절제된 오버슈트 성장 이징
function easeOutBack(t: number): number {
  const c1 = 1.1;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// variant별 은은한 tint (vertex color에 곱해짐)
const TINTS = [
  '#ffffff',
  '#f2ffe8',
  '#e4f5d8',
  '#fff4d8',
  '#e8f0ff',
  '#f0ffe0',
  '#e0ffe8',
  '#fef0e0',
].map(c => new THREE.Color(c));

const dummy = new THREE.Object3D();

interface FamilyMeshProps {
  family: TreeFamily;
  trees: TreePosition[];
  immediate: boolean;
}

const FamilyMesh = ({ family, trees, immediate }: FamilyMeshProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createTreeGeometry(family), [family]);
  // 인스턴스별 표시 스케일 (id → 현재 표시값)
  const displayScale = useRef(new Map<string, number>());

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = 1 - Math.exp(-3 * delta);

    trees.forEach((tree, i) => {
      const target = tree.growthStage;
      const prev = displayScale.current.get(tree.id) ?? 0;
      const value = immediate ? target : prev + (target - prev) * k;
      displayScale.current.set(tree.id, value);

      const grow = easeOutBack(Math.max(0, Math.min(1, value)));
      const s = Math.max(0.001, grow) * (0.8 + (tree.variant % 8) * 0.05);
      dummy.position.set(tree.x - 50, 0, tree.y - 50);
      dummy.rotation.set(0, tree.variant * 0.785 + tree.x * 0.1, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, TINTS[tree.variant % TINTS.length]);
    });

    mesh.count = trees.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // 숲 리셋 등으로 사라진 나무의 스케일 캐시 정리
    if (displayScale.current.size > trees.length + 20) {
      const ids = new Set(trees.map(t => t.id));
      for (const id of displayScale.current.keys()) {
        if (!ids.has(id)) displayScale.current.delete(id);
      }
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, TREE_MATERIAL, MAX_INSTANCES]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
};

interface TreesProps {
  trees: TreePosition[];
  /** true면 damping 없이 즉시 목표 스케일로 표시 (정적 프리뷰용) */
  immediate?: boolean;
}

export const Trees = ({ trees, immediate = false }: TreesProps) => {
  const byFamily = useMemo(() => {
    const map: Record<TreeFamily, TreePosition[]> = {
      broadLarge: [],
      conifer: [],
      broadSmall: [],
      shrub: [],
      sapling: [],
    };
    for (const t of trees) map[FAMILY_BY_TREE_TYPE[t.type]].push(t);
    return map;
  }, [trees]);

  return (
    <>
      {TREE_FAMILIES.map(family => (
        <FamilyMesh key={family} family={family} trees={byFamily[family]} immediate={immediate} />
      ))}
    </>
  );
};
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/scene/Trees.tsx
git commit -m "feat: InstancedMesh 기반 나무 렌더러 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 단일 씬 GLB 동물 (`Animals.tsx`)

**Files:**
- Create: `src/components/focus-forest/scene/Animals.tsx`

**Interfaces:**
- Consumes: `AnimalInstance`, `AnimalType` (`@/types/focusForest.types`)
- Produces: `<Animals animals={AnimalInstance[]} />` (Canvas 내부 전용, Task 7에서 사용)

설계 메모: 기존 Animal3DModel은 동물마다 별도 `<Canvas>`(WebGL 컨텍스트)를 만들었다. 이 컴포넌트는 이미 존재하는 씬 안에 GLB를 배치한다. 스킨드 메시 호환을 위해 `scene.clone(true)` 대신 SkeletonUtils `clone`을 쓴다. 움직임은 "긴 정지(8~20초) + 가끔 느린 이동" — 방해 최소화 원칙.

- [ ] **Step 1: 파일 작성**

```tsx
// Animals.tsx - 단일 씬 안에서 렌더링되는 GLB 동물
// 개별 Canvas 없음. 로드 실패한 동물은 ErrorBoundary가 조용히 스킵.

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { AnimalInstance, AnimalType } from '@/types/focusForest.types';

const glbPath = (type: AnimalType) => `/GLB%20format/animal-${type}.glb`;

const WALK_SPEED = 2.2; // world units / s
const TARGET_SIZE = 3.2; // 최대 치수 정규화 목표

class AnimalErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function AnimalModel({ animal }: { animal: AnimalInstance }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(glbPath(animal.type));
  const cloned = useMemo(() => skeletonClone(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned]);

  // 크기 정규화(최대 치수 → TARGET_SIZE), 바닥 y=0, 그림자, 애니메이션 재생
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      cloned.scale.setScalar(TARGET_SIZE / maxDim);
      const box2 = new THREE.Box3().setFromObject(cloned);
      cloned.position.y -= box2.min.y;
    }
    cloned.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) obj.castShadow = true;
    });
    if (animations.length > 0) mixer.clipAction(animations[0]).play();
    return () => {
      mixer.stopAllAction();
    };
  }, [cloned, animations, mixer]);

  // 배회 상태 — 리렌더 없이 ref로만 관리
  const wander = useRef({
    mode: 'idle' as 'idle' | 'walk',
    until: 0, // clock 시간 기준; 0이면 첫 프레임에 idle 대기시간 설정
    target: new THREE.Vector3(),
    heading: (animal.direction * Math.PI) / 180,
  });
  const popScale = useRef(0);
  const moveDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    mixer.update(delta);
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const w = wander.current;

    // 등장/퇴장 팝 스케일 (재질 투명도 조작 없이 스케일로 처리)
    const targetPop = animal.isVisible ? 1 : 0;
    popScale.current += (targetPop - popScale.current) * (1 - Math.exp(-4 * delta));
    group.scale.setScalar(Math.max(0.001, popScale.current));

    if (w.until === 0) w.until = t + 3 + Math.random() * 8;

    if (t >= w.until) {
      if (w.mode === 'idle') {
        // 새 목표: 현재 위치에서 6~14 유닛, 섬 중심 반경 45 이내
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 8;
        w.target.set(
          THREE.MathUtils.clamp(group.position.x + Math.cos(angle) * dist, -45, 45),
          0,
          THREE.MathUtils.clamp(group.position.z + Math.sin(angle) * dist, -45, 45)
        );
        w.mode = 'walk';
        w.until = t + 20; // 도착 시 idle 전환되므로 상한만
      } else {
        w.mode = 'idle';
        w.until = t + 8 + Math.random() * 12; // 긴 정지 위주 (방해 최소화)
      }
    }

    if (w.mode === 'walk') {
      moveDir.subVectors(w.target, group.position);
      moveDir.y = 0;
      const distance = moveDir.length();
      if (distance < 0.3) {
        w.mode = 'idle';
        w.until = t + 8 + Math.random() * 12;
      } else {
        moveDir.normalize();
        group.position.addScaledVector(moveDir, Math.min(WALK_SPEED * delta, distance));
        const targetHeading = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetHeading - w.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        w.heading += diff * (1 - Math.exp(-5 * delta));
        group.rotation.y = w.heading;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[animal.x - 50, 0, animal.y - 50]}
      rotation={[0, wander.current.heading, 0]}
    >
      <primitive object={cloned} />
    </group>
  );
}

export const Animals = ({ animals }: { animals: AnimalInstance[] }) => (
  <>
    {animals.map(animal => (
      <AnimalErrorBoundary key={animal.id}>
        <Suspense fallback={null}>
          <AnimalModel animal={animal} />
        </Suspense>
      </AnimalErrorBoundary>
    ))}
  </>
);
```

주의: `three/examples/jsm/utils/SkeletonUtils.js`의 named export는 `clone`이다. 만약 `npx tsc -b`가 이 모듈의 타입 선언을 찾지 못하면, 대체 import로 `import { SkeletonUtils } from 'three-stdlib'`(drei의 전이 의존성)를 쓰지 말고 — 전이 의존성 직접 import는 금지 — `cloned = useMemo(() => scene.clone(true), [scene])`로 폴백하되 이 사실을 커밋 메시지에 남긴다(기존 코드도 clone(true)로 동작했음).

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/scene/Animals.tsx
git commit -m "feat: 단일 씬 GLB 동물 렌더러 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 씬 조립 (`ForestScene.tsx`)

**Files:**
- Create: `src/components/focus-forest/scene/ForestScene.tsx`

**Interfaces:**
- Consumes: `useForestSimulation` (Task 2), `SkyAndLights` (Task 3), `Terrain`·`Fireflies` (Task 4), `Trees` (Task 5), `Animals` (Task 6)
- Produces (Task 11이 사용):

```ts
export interface ForestSceneProps {
  elapsedSeconds: number;
  isFocusing: boolean;
  currentForestIndex: number;
  goldenHour?: boolean;          // 목표 달성 연출
  savedTrees?: TreePosition[];
  onForestComplete?: (forestIndex: number) => void;
  onAnimalAppear?: (type: AnimalType) => void;
  onAnimalLeave?: (type: AnimalType) => void;
  onTreeCountChange?: (grownCount: number) => void;
  onTreesChange?: (trees: TreePosition[]) => void;
}
export const ForestScene: (props: ForestSceneProps) => JSX.Element;
```

- [ ] **Step 1: 파일 작성**

```tsx
// ForestScene.tsx - Focus Forest 3D 씬 진입점 (단일 Canvas)
// 카메라: 3/4 부감 고정 + 느린 자동 궤도. 사용자 조작 없음(집중 모드).
// WebGL 실패/컨텍스트 로스 시 폴백 카드 표시 — 타이머·기록은 상위에서 계속 동작.

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { AnimalType, ForestStage, TreePosition } from '@/types/focusForest.types';

import { useForestSimulation } from '../useForestSimulation';
import { Animals } from './Animals';
import { Fireflies } from './Fireflies';
import { SkyAndLights } from './SkyAndLights';
import { Terrain } from './Terrain';
import { Trees } from './Trees';

export interface ForestSceneProps {
  elapsedSeconds: number;
  isFocusing: boolean;
  currentForestIndex: number;
  goldenHour?: boolean;
  savedTrees?: TreePosition[];
  onForestComplete?: (forestIndex: number) => void;
  onAnimalAppear?: (type: AnimalType) => void;
  onAnimalLeave?: (type: AnimalType) => void;
  onTreeCountChange?: (grownCount: number) => void;
  onTreesChange?: (trees: TreePosition[]) => void;
}

// 단계별 카메라 거리 — 숲이 클수록 멀리서 (기존 2D scale 축소의 3D 대응)
const STAGE_RADIUS: Record<ForestStage, number> = { small: 55, medium: 75, large: 95 };
const ORBIT_PERIOD_S = 800; // 한 바퀴 약 13.3분 (거의 인지 불가한 드리프트)
const POLAR = (55 * Math.PI) / 180; // 고도각

const CameraRig = ({ stage }: { stage: ForestStage }) => {
  const radiusRef = useRef(STAGE_RADIUS[stage]);

  useFrame((state, delta) => {
    const target = STAGE_RADIUS[stage];
    radiusRef.current += (target - radiusRef.current) * (1 - Math.exp(-0.6 * delta));
    // 카메라는 실제 시계 기준 (관리자 배속과 무관하게 항상 느리게)
    const angle = (state.clock.elapsedTime * Math.PI * 2) / ORBIT_PERIOD_S;
    const r = radiusRef.current;
    const y = r * Math.cos(POLAR);
    const horizontal = r * Math.sin(POLAR);
    state.camera.position.set(Math.sin(angle) * horizontal, y, Math.cos(angle) * horizontal);
    state.camera.lookAt(0, 2, 0);
  });

  return null;
};

// 숲 완성 시 중앙에서 피어오르는 골든 파티클 (모달 없이 은은한 연출)
const BURST_COUNT = 140;
const BURST_DURATION_S = 4;

const CompleteBurst = ({ onDone }: { onDone: () => void }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { origins, velocities, positions } = useMemo(() => {
    const origins = new Float32Array(BURST_COUNT * 3);
    const velocities = new Float32Array(BURST_COUNT * 3);
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 6;
      origins[i * 3] = Math.cos(angle) * r;
      origins[i * 3 + 1] = 0.5;
      origins[i * 3 + 2] = Math.sin(angle) * r;
      velocities[i * 3] = Math.cos(angle) * (2 + Math.random() * 3);
      velocities[i * 3 + 1] = 6 + Math.random() * 7;
      velocities[i * 3 + 2] = Math.sin(angle) * (2 + Math.random() * 3);
    }
    return { origins, velocities, positions: origins.slice() };
  }, []);

  useFrame(state => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - startRef.current;
    if (age > BURST_DURATION_S) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
      return;
    }
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < BURST_COUNT; i++) {
      pos.setXYZ(
        i,
        origins[i * 3] + velocities[i * 3] * age,
        Math.max(0.2, origins[i * 3 + 1] + velocities[i * 3 + 1] * age - 2.5 * age * age),
        origins[i * 3 + 2] + velocities[i * 3 + 2] * age
      );
    }
    pos.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = Math.max(0, 1 - age / BURST_DURATION_S);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={1.1}
        color="#ffd76b"
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const SceneFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-950 to-gray-950">
    <div className="text-center px-6">
      <p className="text-white/90 text-lg font-semibold mb-2">3D 숲을 표시할 수 없어요</p>
      <p className="text-white/60 text-sm leading-relaxed">
        그래픽 환경 문제로 씬을 그릴 수 없지만,
        <br />
        타이머와 집중 기록은 계속 작동합니다.
      </p>
    </div>
  </div>
);

export const ForestScene = ({
  elapsedSeconds,
  isFocusing,
  currentForestIndex,
  goldenHour = false,
  savedTrees,
  onForestComplete,
  onAnimalAppear,
  onAnimalLeave,
  onTreeCountChange,
  onTreesChange,
}: ForestSceneProps) => {
  const [burstKey, setBurstKey] = useState<number | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const onForestCompleteRef = useRef(onForestComplete);
  onForestCompleteRef.current = onForestComplete;

  const handleForestComplete = useCallback((forestIndex: number) => {
    setBurstKey(Date.now());
    onForestCompleteRef.current?.(forestIndex);
  }, []);

  const sim = useForestSimulation({
    elapsedSeconds,
    isFocusing,
    savedTrees,
    currentForestIndex,
    onForestComplete: handleForestComplete,
    onAnimalAppear,
    onAnimalLeave,
  });

  // 성장 완료 수 통지
  const onTreeCountChangeRef = useRef(onTreeCountChange);
  onTreeCountChangeRef.current = onTreeCountChange;
  useEffect(() => {
    onTreeCountChangeRef.current?.(sim.grownTreeCount);
  }, [sim.grownTreeCount]);

  // 나무 배치 변화 시에만 저장 통지 (매초 성장 파생값 저장 방지)
  const onTreesChangeRef = useRef(onTreesChange);
  onTreesChangeRef.current = onTreesChange;
  const treesRef = useRef(sim.trees);
  treesRef.current = sim.trees;
  useEffect(() => {
    onTreesChangeRef.current?.(treesRef.current);
  }, [sim.trees.length]);

  if (webglFailed) return <SceneFallback />;

  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.5, far: 400, position: [0, 45, 55] }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', e => {
            e.preventDefault();
            setWebglFailed(true);
          });
        }}
      >
        <SkyAndLights elapsedSeconds={elapsedSeconds} goldenHour={goldenHour} />
        <CameraRig stage={sim.forestStage} />
        <Terrain />
        <Trees trees={sim.trees} />
        <Animals animals={sim.animals} />
        <Fireflies elapsedSeconds={elapsedSeconds} />
        {burstKey !== null && <CompleteBurst key={burstKey} onDone={() => setBurstKey(null)} />}
      </Canvas>
    </SceneErrorBoundary>
  );
};
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/scene/ForestScene.tsx
git commit -m "feat: 단일 Canvas 3D 씬 조립(ForestScene) 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: 집중 HUD (`FocusHud.tsx`)

**Files:**
- Create: `src/components/focus-forest/FocusHud.tsx`

**Interfaces:**
- Consumes: 없음 (독립 UI)
- Produces (Task 11이 사용):

```ts
interface FocusHudProps {
  formattedTime: string;
  forestIndex: number;
  treeCount: number;
  goalMinutes: number | null;    // null = 무제한
  elapsedSeconds: number;
  goalSessionsToday: number;     // 오늘 완료한 목표 세션 수
}
export const FocusHud: (props: FocusHudProps) => JSX.Element;
```

- [ ] **Step 1: 파일 작성**

```tsx
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
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/focus-forest/FocusHud.tsx
git commit -m "feat: 저대비 집중 HUD(FocusHud) 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 세션 종료 요약 + 일시정지 오버레이 (`SessionSummary.tsx`, `FocusOverlay.tsx`)

**Files:**
- Create: `src/components/focus-forest/SessionSummary.tsx`
- Modify: `src/components/focus-forest/FocusOverlay.tsx` (전체 교체)

**Interfaces:**
- Consumes: `ANIMAL_CONFIGS`, `AnimalType`, `ANIMAL_DIALOGUES` (`@/data/animalDialogues`), `FOREST_COMPLETE_COUNT` (Task 2)
- Produces (Task 11이 사용):

```ts
export interface SessionSummaryData {
  durationSeconds: number;
  treesPlanted: number;
  animalsSeen: { type: AnimalType; isNew: boolean }[];
  forestsCompleted: number;      // 이번 세션에 완성한 숲 수
  forestProgressCount: number;   // 현재 숲의 나무 수 (0~120)
  goalReached: boolean;
  goalMinutes: number | null;
}
export const SessionSummary: (props: { summary: SessionSummaryData; onClose: () => void }) => JSX.Element;
// FocusOverlay는 기존 props 유지: { sessionSeconds: number; totalSeconds: number; onResume: () => void }
```

- [ ] **Step 1: SessionSummary.tsx 작성**

```tsx
// SessionSummary.tsx - 세션 종료 요약. 세션 중 억제했던 보상(동물·발견·완성)을 여기서 몰아서 보여준다.

import { useMemo } from 'react';

import { ANIMAL_DIALOGUES } from '@/data/animalDialogues';
import { ANIMAL_CONFIGS, type AnimalType } from '@/types/focusForest.types';

import { FOREST_COMPLETE_COUNT } from './useForestSimulation';

export interface SessionSummaryData {
  durationSeconds: number;
  treesPlanted: number;
  animalsSeen: { type: AnimalType; isNew: boolean }[];
  forestsCompleted: number;
  forestProgressCount: number;
  goalReached: boolean;
  goalMinutes: number | null;
}

interface SessionSummaryProps {
  summary: SessionSummaryData;
  onClose: () => void;
}

function formatKorean(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  if (h === 0) parts.push(`${s}초`);
  return parts.join(' ');
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
        </div>

        {/* 집중 시간 */}
        <div className="flex flex-col items-center">
          <span className="text-4xl font-mono font-bold text-emerald-500 tabular-nums">
            {formatKorean(durationSeconds)}
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
          <p className="text-sm text-muted-foreground">
            잠깐 5분 정도 쉬어가는 걸 추천해요 ☕
          </p>
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
```

- [ ] **Step 2: FocusOverlay.tsx 전체 교체**

```tsx
// FocusOverlay.tsx - 집중 일시정지 오버레이 (탭 이탈/전체화면 종료 시)

interface FocusOverlayProps {
  sessionSeconds: number;
  totalSeconds: number;
  onResume: () => void;
}

const formatKorean = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  parts.push(`${s}초`);
  return parts.join(' ');
};

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
```

- [ ] **Step 3: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/focus-forest/SessionSummary.tsx src/components/focus-forest/FocusOverlay.tsx
git commit -m "feat: 세션 종료 요약 추가 및 일시정지 오버레이 리디자인

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 데이터 계층 확장 — 세션 목표 필드

**Files:**
- Modify: `src/types/focusForest.types.ts`
- Modify: `src/hooks/useFocusForestData.ts`

**Interfaces:**
- Produces (Task 11이 사용): `FocusForestData.sessionGoalMinutes: number | null`, `DailyRecord.goalSessionsCompleted?: number`, 훅 반환에 `setSessionGoalMinutes(minutes: number | null): void`, `incrementGoalSessions(): void` 추가
- 하위 호환: 구버전 저장 데이터에 두 필드가 없어도 동작 (`?? null` / `?? 0` 병합)

- [ ] **Step 1: `focusForest.types.ts` 수정 — DailyRecord에 optional 필드 추가**

기존:

```ts
export interface DailyRecord {
  date: string;
  focusSeconds: number;
  treesGrown: number;
}
```

변경:

```ts
export interface DailyRecord {
  date: string;
  focusSeconds: number;
  treesGrown: number;
  goalSessionsCompleted?: number; // 목표 세션 완료 수 (구버전 데이터엔 없음)
}
```

- [ ] **Step 2: `focusForest.types.ts` 수정 — FocusForestData에 목표 필드 추가**

기존:

```ts
export interface FocusForestData {
  totalFocusSeconds: number;
  longestSessionSeconds: number;
  currentForestIndex: number;
  forests: CompletedForest[];
  animalCollection: AnimalCollection;
  dailyRecords: DailyRecord[];
  savedTrees: TreePosition[];
}
```

변경 (필드 추가):

```ts
export interface FocusForestData {
  totalFocusSeconds: number;
  longestSessionSeconds: number;
  currentForestIndex: number;
  forests: CompletedForest[];
  animalCollection: AnimalCollection;
  dailyRecords: DailyRecord[];
  savedTrees: TreePosition[];
  sessionGoalMinutes: number | null; // 세션 목표 시간 (null = 무제한)
}
```

`DEFAULT_FOCUS_FOREST_DATA`에도 추가:

```ts
export const DEFAULT_FOCUS_FOREST_DATA: FocusForestData = {
  totalFocusSeconds: 0,
  longestSessionSeconds: 0,
  currentForestIndex: 1,
  forests: [],
  animalCollection: { ...DEFAULT_ANIMAL_COLLECTION },
  dailyRecords: [],
  savedTrees: [],
  sessionGoalMinutes: null,
};
```

- [ ] **Step 3: `useFocusForestData.ts` 수정 — 로드 병합에 기본값 추가**

기존 (로드 성공 시 setData 부분):

```ts
        setData({
          ...loaded,
          animalCollection: mergedCollection,
          savedTrees: loaded.savedTrees ?? [],
        });
```

변경:

```ts
        setData({
          ...loaded,
          animalCollection: mergedCollection,
          savedTrees: loaded.savedTrees ?? [],
          sessionGoalMinutes: loaded.sessionGoalMinutes ?? null,
        });
```

- [ ] **Step 4: `useFocusForestData.ts` 수정 — 액션 2개 추가**

`saveTrees` 함수 정의 바로 아래에 추가:

```ts
  const setSessionGoalMinutes = useCallback(
    (minutes: number | null) => {
      setData(prev => ({ ...prev, sessionGoalMinutes: minutes }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const incrementGoalSessions = useCallback(() => {
    const today = getTodayDateString();
    setData(prev => {
      const existingIdx = prev.dailyRecords.findIndex(r => r.date === today);
      let dailyRecords: DailyRecord[];
      if (existingIdx >= 0) {
        dailyRecords = prev.dailyRecords.map((r, i) =>
          i === existingIdx
            ? { ...r, goalSessionsCompleted: (r.goalSessionsCompleted ?? 0) + 1 }
            : r
        );
      } else {
        dailyRecords = [
          ...prev.dailyRecords,
          { date: today, focusSeconds: 0, treesGrown: 0, goalSessionsCompleted: 1 },
        ];
      }
      return { ...prev, dailyRecords };
    });
    scheduleSave();
  }, [scheduleSave]);
```

return 객체에 두 액션 추가:

```ts
  return {
    data,
    isLoaded,
    totalFocusHours,
    addSessionTime,
    updateLongestSession,
    completeForest,
    incrementForestIndex,
    discoverAnimal,
    getTodayRecord,
    getRecentRecords,
    addTreeToday,
    saveTrees,
    saveSession,
    setSessionGoalMinutes,
    incrementGoalSessions,
  };
```

- [ ] **Step 5: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 6: 커밋**

```bash
git add src/types/focusForest.types.ts src/hooks/useFocusForestData.ts
git commit -m "feat: 세션 목표(뽀모도로) 데이터 필드 및 액션 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: 미니 3D 프리뷰 + FocusForestPage 전면 재작성

**Files:**
- Create: `src/components/focus-forest/scene/MiniForest3D.tsx`
- Modify: `src/pages/FocusForestPage.tsx` (전체 교체)

**Interfaces:**
- Consumes: `ForestScene`(Task 7), `FocusHud`(Task 8), `SessionSummary`·`FocusOverlay`(Task 9), `setSessionGoalMinutes`·`incrementGoalSessions`·`sessionGoalMinutes`·`goalSessionsCompleted`(Task 10), `Terrain`(Task 4), `Trees`(Task 5), `FOREST_COMPLETE_COUNT`(Task 2)
- Produces: `<MiniForest3D trees={TreePosition[]} className={string?} fallback={ReactNode?} />` — Task 12(ForestMap)가 재사용
- 주의: 이 시점에 `index.ts`는 아직 구버전이므로 **모든 focus-forest import는 개별 파일 경로로 직접** 한다 (`@components/focus-forest/scene/ForestScene` 등). index.ts 정리는 Task 14.

- [ ] **Step 1: MiniForest3D.tsx 작성**

```tsx
// MiniForest3D.tsx - 정적 미니 숲 프리뷰 (frameloop="demand", 저해상도)
// 시작 화면의 현재 숲 카드와 숲 목록(ForestMap) 카드에서 사용

import { Component, useMemo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';

import type { TreePosition } from '@/types/focusForest.types';

import { Terrain } from './Terrain';
import { Trees } from './Trees';

class PreviewErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface MiniForest3DProps {
  trees: TreePosition[];
  className?: string;
  /** WebGL 실패 시 대체 콘텐츠 */
  fallback?: ReactNode;
}

export const MiniForest3D = ({ trees, className, fallback = null }: MiniForest3DProps) => {
  // 프리뷰는 항상 완전 성장 상태로
  const grownTrees = useMemo(() => trees.map(t => ({ ...t, growthStage: 1 })), [trees]);

  return (
    <div className={className}>
      <PreviewErrorBoundary fallback={fallback}>
        <Canvas
          frameloop="demand"
          dpr={1}
          camera={{ fov: 45, near: 0.5, far: 400, position: [0, 52, 74] }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        >
          <color attach="background" args={['#bfe3ff']} />
          <hemisphereLight args={['#cfe8ff', '#3c7443', 0.8]} />
          <directionalLight position={[40, 55, 25]} intensity={1.3} color="#fff3df" />
          <Terrain />
          <Trees trees={grownTrees} immediate />
        </Canvas>
      </PreviewErrorBoundary>
    </div>
  );
};
```

- [ ] **Step 2: FocusForestPage.tsx 전체 교체**

```tsx
// FocusForestPage - Focus Forest 진입점 (시작 화면 + 전체화면 집중 모드)
// 방해 최소화: 세션 중 토스트/모달 없음. 보상은 세션 종료 요약(SessionSummary)에서.

import { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart2, BookOpen, Map, Play } from 'lucide-react';

import { Layout } from '@components/common/Layout';
import { AnimalCollection } from '@components/focus-forest/AnimalCollection';
import { FocusHud } from '@components/focus-forest/FocusHud';
import { FocusOverlay } from '@components/focus-forest/FocusOverlay';
import { FocusStatistics } from '@components/focus-forest/FocusStatistics';
import { ForestMap } from '@components/focus-forest/ForestMap';
import { MiniForest3D } from '@components/focus-forest/scene/MiniForest3D';
import { ForestScene } from '@components/focus-forest/scene/ForestScene';
import {
  SessionSummary,
  type SessionSummaryData,
} from '@components/focus-forest/SessionSummary';
import { FOREST_COMPLETE_COUNT } from '@components/focus-forest/useForestSimulation';
import type { AnimalType, TreePosition } from '@/types/focusForest.types';
import { ANIMAL_CONFIGS } from '@/types/focusForest.types';
import { useAuth } from '@hooks/useAuth';
import { useFocusForestData } from '@hooks/useFocusForestData';
import { useFocusMode } from '@hooks/useFocusMode';

const SPEED_OPTIONS = [1, 2, 5, 10, 30, 60] as const;

const GOAL_OPTIONS: { label: string; value: number | null }[] = [
  { label: '25분', value: 25 },
  { label: '50분', value: 50 },
  { label: '90분', value: 90 },
  { label: '무제한', value: null },
];

type ModalType = 'forest-map' | 'animal-collection' | 'statistics' | null;

export const FocusForestPage = () => {
  const { isAdmin } = useAuth();
  const [speed, setSpeed] = useState(1);

  const {
    isFocusing,
    isPaused,
    elapsedSeconds,
    formattedTime,
    isFullscreen,
    toggleFullscreen,
    reset,
    containerRef,
  } = useFocusMode(speed);

  const {
    data,
    totalFocusHours,
    addSessionTime,
    updateLongestSession,
    discoverAnimal,
    addTreeToday,
    saveTrees,
    completeForest,
    incrementForestIndex,
    saveSession,
    setSessionGoalMinutes,
    incrementGoalSessions,
    getTodayRecord,
  } = useFocusForestData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [treeCount, setTreeCount] = useState(data.savedTrees?.length ?? 0);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [goalCardVisible, setGoalCardVisible] = useState(false);

  const goalMinutes = data.sessionGoalMinutes;
  const goalSessionsToday = getTodayRecord()?.goalSessionsCompleted ?? 0;

  // ---- 세션 추적 (리렌더 불필요 → ref) ----
  const sessionAnimalsRef = useRef(new Map<AnimalType, boolean>()); // type → isNew
  const sessionForestsRef = useRef(0);
  const goalReachedRef = useRef(false);
  const prevIsFullscreenRef = useRef(isFullscreen);
  const sessionStartRef = useRef<string | null>(null);
  const sessionTreeCountRef = useRef(0);

  // ---- 목표 달성 감지 → 골든아워 + 카드 ----
  useEffect(() => {
    if (!isFullscreen || goalMinutes === null || goalReachedRef.current) return;
    if (elapsedSeconds >= goalMinutes * 60) {
      goalReachedRef.current = true;
      setGoalCardVisible(true);
      incrementGoalSessions();
    }
  }, [elapsedSeconds, isFullscreen, goalMinutes, incrementGoalSessions]);

  // ---- 전체화면 진입: 세션 추적 초기화 / 종료: 저장 + 요약 표시 ----
  useEffect(() => {
    const wasFullscreen = prevIsFullscreenRef.current;
    prevIsFullscreenRef.current = isFullscreen;

    if (isFullscreen && !wasFullscreen) {
      sessionStartRef.current = new Date().toISOString();
      sessionTreeCountRef.current = treeCount;
      sessionAnimalsRef.current = new Map();
      sessionForestsRef.current = 0;
      goalReachedRef.current = false;
      setGoalCardVisible(false);
    }

    if (!isFullscreen && wasFullscreen && elapsedSeconds >= 5) {
      const endedAt = new Date().toISOString();
      const treesPlanted =
        Math.max(0, treeCount - sessionTreeCountRef.current) +
        sessionForestsRef.current * FOREST_COMPLETE_COUNT;

      addSessionTime(elapsedSeconds);
      updateLongestSession(elapsedSeconds);
      saveSession(sessionStartRef.current ?? endedAt, endedAt, elapsedSeconds, treesPlanted);

      setSummary({
        durationSeconds: elapsedSeconds,
        treesPlanted,
        animalsSeen: Array.from(sessionAnimalsRef.current, ([type, isNew]) => ({
          type,
          isNew,
        })),
        forestsCompleted: sessionForestsRef.current,
        forestProgressCount: treeCount,
        goalReached: goalReachedRef.current,
        goalMinutes,
      });
      setGoalCardVisible(false);
      reset();
    }
  }, [
    isFullscreen,
    elapsedSeconds,
    addSessionTime,
    updateLongestSession,
    reset,
    saveSession,
    treeCount,
    goalMinutes,
  ]);

  // ---- 동물 등장: 도감 기록 + 세션 추적만 (세션 중 알림 없음) ----
  const handleAnimalAppear = useCallback(
    (type: AnimalType) => {
      const wasNew = discoverAnimal(type);
      const prevIsNew = sessionAnimalsRef.current.get(type);
      sessionAnimalsRef.current.set(type, prevIsNew === true || wasNew);
    },
    [discoverAnimal]
  );

  // ---- 숲 완성: 저장/전환은 즉시, 축하는 요약에서 ----
  const handleForestComplete = useCallback(
    (forestIndex: number) => {
      completeForest({
        id: forestIndex,
        completedAt: new Date().toISOString(),
        totalTrees: FOREST_COMPLETE_COUNT,
        focusTimeSeconds: elapsedSeconds,
        treePositions: data.savedTrees ?? [],
      });
      incrementForestIndex();
      saveTrees([]);
      addTreeToday();
      setTreeCount(0);
      sessionForestsRef.current += 1;
    },
    [
      addTreeToday,
      completeForest,
      incrementForestIndex,
      saveTrees,
      elapsedSeconds,
      data.savedTrees,
    ]
  );

  const handleTreesChange = useCallback(
    (trees: TreePosition[]) => saveTrees(trees),
    [saveTrees]
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const discoveredCount = Object.values(data.animalCollection).filter(a => a.discovered).length;
  const totalAnimals = ANIMAL_CONFIGS.length;
  const focusHoursDisplay = Math.floor(totalFocusHours);

  // --- 전체화면 집중 모드 ---
  if (isFullscreen) {
    return (
      <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black">
        <ForestScene
          elapsedSeconds={elapsedSeconds}
          isFocusing={isFocusing}
          currentForestIndex={data.currentForestIndex}
          goldenHour={goalCardVisible}
          savedTrees={data.savedTrees}
          onAnimalAppear={handleAnimalAppear}
          onForestComplete={handleForestComplete}
          onTreeCountChange={setTreeCount}
          onTreesChange={handleTreesChange}
        />

        <FocusHud
          formattedTime={formattedTime}
          forestIndex={data.currentForestIndex}
          treeCount={treeCount}
          goalMinutes={goalMinutes}
          elapsedSeconds={elapsedSeconds}
          goalSessionsToday={goalSessionsToday}
        />

        {/* 종료 버튼: 호버 시에만 표시 */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 opacity-0 hover:opacity-100
            transition-opacity duration-200 bg-black/30 backdrop-blur-sm
            text-white/80 text-sm rounded-xl px-3 py-2"
        >
          전체화면 종료
        </button>

        {/* 관리자 배속 */}
        {isAdmin && (
          <div
            className="absolute top-4 left-4 z-20 flex items-center gap-1
            bg-black/40 backdrop-blur-sm rounded-xl px-2 py-1.5"
          >
            <span className="text-[10px] text-yellow-300 font-semibold mr-1">SPEED</span>
            {SPEED_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  speed === s
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {/* 목표 달성 카드 */}
        {goalCardVisible && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl
              px-8 py-8 flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4"
            >
              <span className="text-5xl">🌅</span>
              <h2 className="text-2xl font-bold text-white">목표 달성!</h2>
              <p className="text-white/80 text-base leading-relaxed">
                {goalMinutes}분 집중을 해냈어요.
                <br />
                숲에 골든아워가 찾아왔어요.
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={toggleFullscreen}
                  className="flex-1 bg-white/15 hover:bg-white/25 text-white
                    font-semibold rounded-2xl px-4 py-3 transition-colors duration-150"
                >
                  5분 쉬어가기
                </button>
                <button
                  onClick={() => setGoalCardVisible(false)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white
                    font-semibold rounded-2xl px-4 py-3 transition-colors duration-150"
                >
                  계속 집중하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일시정지 오버레이 */}
        {isPaused && (
          <FocusOverlay
            sessionSeconds={elapsedSeconds}
            totalSeconds={data.totalFocusSeconds}
            onResume={toggleFullscreen}
          />
        )}
      </div>
    );
  }

  // --- 시작 화면 ---
  return (
    <Layout title="Focus Forest">
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-7 py-6">
        {/* 타이틀 */}
        <div className="text-center flex flex-col items-center gap-2">
          <h1 className="text-4xl font-bold text-foreground">Focus Forest</h1>
          <p className="text-muted-foreground text-base">
            집중하는 동안 당신의 숲이 자라납니다
          </p>
        </div>

        {/* 현재 숲 라이브 프리뷰 */}
        <div className="w-full relative">
          <MiniForest3D
            trees={data.savedTrees ?? []}
            className="w-full aspect-video rounded-3xl overflow-hidden border border-border shadow-sm"
            fallback={
              <div
                className="w-full h-full flex items-center justify-center
                bg-gradient-to-b from-sky-200 to-emerald-300 dark:from-sky-900 dark:to-emerald-900"
              >
                <span className="text-5xl">🌱</span>
              </div>
            }
          />
          <span
            className="absolute top-3 left-3 inline-flex items-center gap-1.5
            bg-black/35 backdrop-blur-sm text-white text-xs font-medium rounded-full px-3 py-1.5"
          >
            🌱 {data.currentForestIndex}번째 숲 · 나무 {data.savedTrees?.length ?? 0}그루
          </span>
        </div>

        {/* 세션 목표 선택 */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-2xl p-1">
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => setSessionGoalMinutes(opt.value)}
                className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                  goalMinutes === opt.value
                    ? 'bg-card text-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {goalMinutes !== null
              ? '목표를 채우면 숲에 골든아워가 찾아와요 🌅'
              : '자유롭게 집중하고 싶을 때 좋아요'}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600
            active:bg-emerald-700 text-white text-lg font-semibold rounded-2xl
            px-10 py-4 transition-colors duration-150 shadow-lg shadow-emerald-500/25
            focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
        >
          <Play size={20} />
          집중 시작하기
        </button>

        {/* 관리자 배속 */}
        {isAdmin && (
          <div
            className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200
            dark:border-yellow-800 rounded-xl px-4 py-2.5"
          >
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
              관리자 배속
            </span>
            <div className="flex gap-1">
              {SPEED_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    speed === s
                      ? 'bg-yellow-400 dark:bg-yellow-500 text-black font-bold'
                      : 'text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 통계 3카드 */}
        <div className="w-full grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-1 bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{focusHoursDisplay}시간</span>
            <span className="text-xs text-muted-foreground text-center">총 집중 시간</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{data.forests.length}개</span>
            <span className="text-xs text-muted-foreground text-center">완성한 숲</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-card border border-border rounded-2xl p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">
              {discoveredCount}/{totalAnimals}종
            </span>
            <span className="text-xs text-muted-foreground text-center">발견한 동물</span>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex flex-row gap-3 w-full">
          <button
            onClick={() => setActiveModal('forest-map')}
            className="flex-1 flex items-center justify-center gap-2 border border-border
              bg-card hover:bg-accent text-foreground text-sm font-medium rounded-2xl
              px-4 py-3 transition-colors duration-150"
          >
            <Map size={16} />
            나의 숲 목록
          </button>
          <button
            onClick={() => setActiveModal('animal-collection')}
            className="flex-1 flex items-center justify-center gap-2 border border-border
              bg-card hover:bg-accent text-foreground text-sm font-medium rounded-2xl
              px-4 py-3 transition-colors duration-150"
          >
            <BookOpen size={16} />
            동물 도감
          </button>
          <button
            onClick={() => setActiveModal('statistics')}
            className="flex-1 flex items-center justify-center gap-2 border border-border
              bg-card hover:bg-accent text-foreground text-sm font-medium rounded-2xl
              px-4 py-3 transition-colors duration-150"
          >
            <BarChart2 size={16} />
            집중 기록
          </button>
        </div>

        {/* 안내 */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-sm">
          전체화면 모드에서 집중하면 나무가 자랍니다.
          <br />
          탭을 이동하거나 전체화면을 종료하면 타이머가 일시정지됩니다.
          <br />
          세션 중에 다녀간 동물은 끝나고 한꺼번에 알려드려요 🦊
        </p>
      </div>

      {/* 모달 */}
      {activeModal === 'forest-map' && (
        <ForestMap
          forests={data.forests}
          currentForestIndex={data.currentForestIndex}
          onClose={closeModal}
        />
      )}
      {activeModal === 'animal-collection' && (
        <AnimalCollection
          collection={data.animalCollection}
          totalFocusHours={totalFocusHours}
          onClose={closeModal}
        />
      )}
      {activeModal === 'statistics' && <FocusStatistics data={data} onClose={closeModal} />}

      {/* 세션 종료 요약 */}
      {summary && <SessionSummary summary={summary} onClose={() => setSummary(null)} />}
    </Layout>
  );
};
```

- [ ] **Step 3: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 4: dev 서버 수동 검증 (관리자 계정)**

Run: `npm run dev` 후 브라우저에서 `/focus-forest` 접속(관리자 계정), 다음을 확인:

1. 시작 화면에 미니 3D 프리뷰가 뜨고, 기존 savedTrees가 있다면 나무가 보인다
2. 목표 세그먼트에서 25분 선택 → 새로고침해도 선택 유지 (Supabase 저장)
3. "집중 시작하기" → 전체화면 3D 씬 진입, HUD에 진행률 링 표시
4. 배속 60x → 3분 경과마다 나무가 "뿅" 하고 자란다 (말풍선·토스트 없음)
5. 배속 60x로 25분 도달 → 씬이 골든아워로 물들고 목표 달성 카드 표시
6. "계속 집중하기" → 카드 닫히고 조명 복귀 / "5분 쉬어가기" → 전체화면 종료
7. 종료 후 세션 요약 모달: 시간·나무·다녀간 동물·동물 한마디 표시
8. 다른 탭 전환 → 일시정지 오버레이("숲이 잠시 쉬고 있어요")

- [ ] **Step 5: 커밋**

```bash
git add src/components/focus-forest/scene/MiniForest3D.tsx src/pages/FocusForestPage.tsx
git commit -m "feat: FocusForestPage 3D 씬 통합 및 세션 목표 플로우 추가

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: 숲 목록 리디자인 (`ForestMap.tsx`)

**Files:**
- Modify: `src/components/focus-forest/ForestMap.tsx` (전체 교체)

**Interfaces:**
- Consumes: `MiniForest3D` (Task 11), `CompletedForest`
- Produces: props 시그니처 유지 — `{ forests: CompletedForest[]; currentForestIndex: number; onClose: () => void }` (Task 11의 페이지가 그대로 사용)

설계 메모: WebGL 컨텍스트는 브라우저당 8~16개 제한이므로 **최신 6개 숲만 3D 스냅샷**, 나머지와 WebGL 실패 시는 기존 SVG 점 방식 폴백.

- [ ] **Step 1: 파일 전체 교체**

```tsx
// ForestMap.tsx - 완성한 숲 갤러리 (미니 3D 스냅샷 + SVG 폴백)

import { X } from 'lucide-react';

import type { CompletedForest } from '@/types/focusForest.types';

import { MiniForest3D } from './scene/MiniForest3D';

interface ForestMapProps {
  forests: CompletedForest[];
  currentForestIndex: number;
  onClose: () => void;
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

export const ForestMap = ({ forests, currentForestIndex, onClose }: ForestMapProps) => {
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
            <h2 className="text-lg font-bold text-foreground">나의 숲 목록</h2>
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
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-border bg-card'
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
```

- [ ] **Step 2: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 3: dev 서버 수동 검증**

`npm run dev` → 시작 화면에서 "나의 숲 목록" 클릭. 완성한 숲이 있으면 최신 6개는 3D 스냅샷, 이후는 SVG 점 프리뷰. 없으면 빈 상태 문구.

- [ ] **Step 4: 커밋**

```bash
git add src/components/focus-forest/ForestMap.tsx
git commit -m "feat: 숲 목록 3D 스냅샷 리디자인

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: 동물 도감 재작성 + 집중 기록 토큰 정돈

**Files:**
- Modify: `src/components/focus-forest/AnimalCollection.tsx` (전체 교체)
- Modify: `src/components/focus-forest/FocusStatistics.tsx` (클래스 치환만, 로직 변경 없음)

**Interfaces:**
- 두 컴포넌트 모두 props 시그니처 유지 (`AnimalCollection`: `{ collection, totalFocusHours, onClose }`, `FocusStatistics`: `{ data, onClose }`)
- AnimalCollection의 죽은 코드 제거: `./assets` SVG import와 `ANIMAL_COMPONENTS` 매핑은 현재 AnimalType 키와 불일치해 항상 emoji 폴백으로만 동작하던 사문(死文) — 삭제 (Task 14의 assets/ 삭제 선행 조건)

- [ ] **Step 1: AnimalCollection.tsx 전체 교체**

```tsx
// AnimalCollection.tsx - 동물 도감 (희귀도별 그룹핑, 미발견은 실루엣)

import { X } from 'lucide-react';

import type { AnimalCollection as AnimalCollectionType } from '@/types/focusForest.types';
import { ANIMAL_CONFIGS } from '@/types/focusForest.types';

interface AnimalCollectionProps {
  collection: AnimalCollectionType;
  totalFocusHours: number;
  onClose: () => void;
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
            <h2 className="text-lg font-bold text-foreground">동물 도감</h2>
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
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${RARITY_ACCENT[rarity]}`}>
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
```

- [ ] **Step 2: FocusStatistics.tsx 클래스 치환 (로직 변경 없음)**

파일 전체에서 아래 페어를 기계적으로 치환한다 (JSX 로직·훅·데이터 코드는 손대지 않는다):

| 기존 | 변경 |
| --- | --- |
| `bg-white dark:bg-gray-900` | `bg-card` |
| `bg-white dark:bg-gray-800` | `bg-card` |
| `text-gray-900 dark:text-white` | `text-foreground` |
| `text-gray-700 dark:text-gray-300` | `text-foreground/80` |
| `text-gray-600 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-500 dark:text-gray-400` | `text-muted-foreground` |
| `text-gray-400 dark:text-gray-500` | `text-muted-foreground/70` |
| `border-gray-200 dark:border-gray-700` | `border-border` |
| `border-gray-100 dark:border-gray-800` | `border-border` |
| `bg-gray-50 dark:bg-gray-800` | `bg-muted/50` |
| `bg-gray-100 dark:bg-gray-800` | `bg-muted` |
| `bg-gray-100 dark:bg-gray-700` | `bg-muted` |
| 모달 셸의 `rounded-2xl` (135행 최외곽 컨테이너 1곳) | `rounded-3xl` |

닫기 버튼의 인라인 `<svg>` X 아이콘이 있다면 `text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800` → `text-muted-foreground hover:text-foreground hover:bg-accent`로 치환.

- [ ] **Step 3: 타입 검사 + 린트**

Run: `npx tsc -b && npm run lint`
Expected: 에러 없음

- [ ] **Step 4: dev 서버 수동 검증**

동물 도감: 희귀도 6그룹 표시, 미발견은 실루엣(?), 라이트/다크 모드 전환 확인. 집중 기록: 기존 기능(차트·세션 목록·메모 편집) 그대로 동작, 새 토큰 적용 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/components/focus-forest/AnimalCollection.tsx src/components/focus-forest/FocusStatistics.tsx
git commit -m "feat: 동물 도감 희귀도 그룹핑 재작성 및 집중 기록 토큰 정돈

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: 구 컴포넌트 정리 + 최종 검증

**Files:**
- Delete: `src/components/focus-forest/ForestCanvas.tsx`, `FocusTimer.tsx`, `AnimalToast.tsx`, `Animal3DModel.tsx`, `assets/` 디렉터리 전체
- Delete: `src/pages/admin/FocusForestAssetsPage.tsx` (SVG 에셋 프리뷰가 주 목적이던 관리자 페이지 — 대상 소멸)
- Delete: `public/forest-bg.png`
- Modify: `src/components/focus-forest/index.ts` (전체 교체)
- Modify: `src/App.tsx` (라우트 제거), `src/components/common/Navigation.tsx` (링크 제거)

**Interfaces:**
- Produces: 최종 `index.ts` 공개 API — `ForestScene`, `MiniForest3D`, `FocusHud`, `SessionSummary`(+`SessionSummaryData` 타입), `FocusOverlay`, `ForestMap`, `AnimalCollection`, `FocusStatistics`

- [ ] **Step 1: 파일 삭제**

```bash
git rm src/components/focus-forest/ForestCanvas.tsx \
       src/components/focus-forest/FocusTimer.tsx \
       src/components/focus-forest/AnimalToast.tsx \
       src/components/focus-forest/Animal3DModel.tsx \
       src/pages/admin/FocusForestAssetsPage.tsx \
       public/forest-bg.png
git rm -r src/components/focus-forest/assets
```

- [ ] **Step 2: index.ts 전체 교체**

```ts
export { ForestScene } from './scene/ForestScene';
export { MiniForest3D } from './scene/MiniForest3D';
export { FocusHud } from './FocusHud';
export { SessionSummary } from './SessionSummary';
export type { SessionSummaryData } from './SessionSummary';
export { FocusOverlay } from './FocusOverlay';
export { ForestMap } from './ForestMap';
export { AnimalCollection } from './AnimalCollection';
export { FocusStatistics } from './FocusStatistics';
```

- [ ] **Step 3: App.tsx에서 라우트 제거**

다음 lazy import 선언을 삭제 (App.tsx 53~55행 부근):

```tsx
const FocusForestAssetsPage = lazy(() =>
  import('@pages/admin/FocusForestAssetsPage').then(m => ({ default: m.FocusForestAssetsPage }))
);
```

`/teacher/focus-forest-assets` Route 블록(277~281행 부근)과 `/admin/focus-forest-assets` 리다이렉트 Route 블록(297~301행 부근)을 삭제:

```tsx
<Route
  path="/teacher/focus-forest-assets"
  element={
    <ProtectedRoute ...>
      <FocusForestAssetsPage />
    </ProtectedRoute>
  }
/>
```

```tsx
<Route
  path="/admin/focus-forest-assets"
  element={<Navigate to="/teacher/focus-forest-assets" replace />}
/>
```

(정확한 JSX 래퍼는 현재 파일 기준으로 해당 path 문자열을 검색해 그 `<Route .../>` 블록 전체를 제거한다. `Navigate` import가 다른 곳에서 안 쓰이면 함께 정리.)

- [ ] **Step 4: Navigation.tsx에서 링크 제거**

68행 부근의 다음 항목을 삭제:

```ts
{ path: '/teacher/focus-forest-assets', label: '포커스 에셋' },
```

- [ ] **Step 5: 잔존 참조 검색**

Run: `grep -rn "ForestCanvas\|AnimalToast\|Animal3DModel\|FocusTimer\|focus-forest/assets\|forest-bg\|FocusForestAssetsPage" src/`
Expected: 결과 없음 (아무것도 출력되지 않아야 함)

- [ ] **Step 6: 최종 검증 — 타입/린트/빌드**

Run: `npx tsc -b && npm run lint && npm run build`
Expected: 모두 성공 (빌드 산출물 생성)

- [ ] **Step 7: 최종 수동 QA (dev 서버, 관리자 계정, 배속 60x)**

1. 시작 화면: 미니 프리뷰·목표 선택·통계·네비 정상
2. 집중 시작 → 3D 씬: 나무 성장, 동물 등장(말풍선·토스트 없음), 낮/밤 전환(10분 주기), 밤 반딧불이
3. 120그루 도달 → 골든 파티클 후 조용히 새 숲 시작 (모달 없음)
4. 목표 달성 → 골든아워 + 카드 → 계속/휴식 각각 동작
5. 종료 → 세션 요약(시간·나무·동물·한마디·숲 완성 배지)
6. 숲 목록·동물 도감·집중 기록 모달 3종 + 다크 모드 전환
7. 구버전 데이터 호환: savedTrees가 있는 계정으로 접속해 기존 숲이 3D로 복원되는지
8. 관리자 메뉴에 "포커스 에셋" 링크가 사라졌는지, `/teacher/focus-forest-assets` 접속 시 NotFound 처리되는지

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "chore: 구 픽셀아트 에셋 및 레거시 컴포넌트 제거

- ForestCanvas/FocusTimer/AnimalToast/Animal3DModel 삭제
- SVG 에셋 18종 및 관리자 에셋 프리뷰 페이지 삭제
- index.ts 공개 API를 새 3D 씬 구성으로 갱신

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## 스펙 커버리지 매핑

| 스펙 요구사항 | 태스크 |
| --- | --- |
| 단일 R3F Canvas 로우폴리 씬 | 7 |
| 프로시저럴 나무 4계열 + InstancedMesh | 1, 5 |
| 좌표 호환 (x·y% → 월드) | 5 (x-50, y-50), 2 (배치 규칙) |
| 카메라 3/4 부감 + 느린 드리프트 + 조작 비활성 | 7 (CameraRig, OrbitControls 없음) |
| 낮/밤 실조명 전환 + 반딧불이 | 3, 4 |
| GLB 동물 단일 씬 + 긴 정지 움직임 | 6 |
| 그림자 1개(1024) + 후처리 없음 + dpr [1,2] | 3, 7 |
| 말풍선/토스트 제거 → 종료 요약 | 9, 11 |
| 숲 완성 은은한 연출 (모달 없음) | 7 (CompleteBurst), 11 |
| HUD 저대비 + 3초 웨이크 + 진행 링 + 세션 도트 | 8 |
| 세션 목표 25/50/90/무제한 + 골든아워 + 휴식 안내 | 10, 11 |
| 목표 데이터 저장 (하위 호환) | 10 |
| 시작 화면 라이브 미니 프리뷰 + 목표 세그먼트 | 11 |
| 숲 목록 3D 스냅샷 + SVG 폴백 | 12 |
| 도감 희귀도 그룹핑 + 실루엣 | 13 |
| 집중 기록 토큰 정돈 | 13 |
| WebGL 폴백 (타이머는 계속 동작) | 7 |
| GLB 실패 시 동물 스킵 | 6 |
| 구 컴포넌트/에셋/관리자 페이지 정리 | 14 |
| 검증 (tsc -b + lint + 배속 실측) | 전 태스크 + 14 |
