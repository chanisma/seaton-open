// Focus Forest - Type Definitions

export interface TreePosition {
  id: string;
  x: number;
  y: number;
  type: TreeType;
  variant: number;
  growthStage: number; // 0~1
  plantedAt: number; // elapsed seconds when planted
  size: number;
}

export type TreeType = 'large' | 'medium' | 'small' | 'bush' | 'sapling';

export type AnimalType =
  | 'chick'
  | 'bunny'
  | 'bee'
  | 'cat'
  | 'parrot'
  | 'dog'
  | 'pig'
  | 'cow'
  | 'fish'
  | 'crab'
  | 'fox'
  | 'deer'
  | 'penguin'
  | 'koala'
  | 'monkey'
  | 'beaver'
  | 'panda'
  | 'hog'
  | 'lion'
  | 'tiger'
  | 'elephant'
  | 'polar'
  | 'giraffe'
  | 'caterpillar';

export interface AnimalConfig {
  type: AnimalType;
  name: string;
  nameKo: string;
  emoji: string;
  requiredHours: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'hidden';
  spawnChance?: number;
}

export const ANIMAL_CONFIGS: AnimalConfig[] = [
  {
    type: 'chick',
    name: 'Chick',
    nameKo: '병아리',
    emoji: '🐥',
    requiredHours: 0.5,
    rarity: 'common',
  },
  { type: 'bunny', name: 'Bunny', nameKo: '토끼', emoji: '🐇', requiredHours: 1, rarity: 'common' },
  { type: 'bee', name: 'Bee', nameKo: '벌', emoji: '🐝', requiredHours: 2, rarity: 'common' },
  { type: 'cat', name: 'Cat', nameKo: '고양이', emoji: '🐱', requiredHours: 3, rarity: 'common' },
  {
    type: 'parrot',
    name: 'Parrot',
    nameKo: '앵무새',
    emoji: '🦜',
    requiredHours: 4,
    rarity: 'common',
  },
  { type: 'dog', name: 'Dog', nameKo: '강아지', emoji: '🐶', requiredHours: 5, rarity: 'uncommon' },
  { type: 'pig', name: 'Pig', nameKo: '돼지', emoji: '🐷', requiredHours: 7, rarity: 'uncommon' },
  { type: 'cow', name: 'Cow', nameKo: '소', emoji: '🐮', requiredHours: 9, rarity: 'uncommon' },
  {
    type: 'fish',
    name: 'Fish',
    nameKo: '물고기',
    emoji: '🐟',
    requiredHours: 11,
    rarity: 'uncommon',
  },
  { type: 'crab', name: 'Crab', nameKo: '게', emoji: '🦀', requiredHours: 13, rarity: 'uncommon' },
  {
    type: 'fox',
    name: 'Fox',
    nameKo: '여우',
    emoji: '🦊',
    requiredHours: 15,
    rarity: 'rare',
    spawnChance: 0.95,
  },
  {
    type: 'deer',
    name: 'Deer',
    nameKo: '사슴',
    emoji: '🦌',
    requiredHours: 18,
    rarity: 'rare',
    spawnChance: 0.92,
  },
  {
    type: 'penguin',
    name: 'Penguin',
    nameKo: '펭귄',
    emoji: '🐧',
    requiredHours: 21,
    rarity: 'rare',
    spawnChance: 0.88,
  },
  {
    type: 'koala',
    name: 'Koala',
    nameKo: '코알라',
    emoji: '🐨',
    requiredHours: 24,
    rarity: 'rare',
    spawnChance: 0.85,
  },
  {
    type: 'monkey',
    name: 'Monkey',
    nameKo: '원숭이',
    emoji: '🐵',
    requiredHours: 27,
    rarity: 'rare',
    spawnChance: 0.82,
  },
  {
    type: 'beaver',
    name: 'Beaver',
    nameKo: '비버',
    emoji: '🦫',
    requiredHours: 30,
    rarity: 'rare',
    spawnChance: 0.78,
  },
  {
    type: 'panda',
    name: 'Panda',
    nameKo: '판다',
    emoji: '🐼',
    requiredHours: 34,
    rarity: 'epic',
    spawnChance: 0.74,
  },
  {
    type: 'hog',
    name: 'Hog',
    nameKo: '멧돼지',
    emoji: '🐗',
    requiredHours: 38,
    rarity: 'epic',
    spawnChance: 0.7,
  },
  {
    type: 'lion',
    name: 'Lion',
    nameKo: '사자',
    emoji: '🦁',
    requiredHours: 42,
    rarity: 'epic',
    spawnChance: 0.66,
  },
  {
    type: 'tiger',
    name: 'Tiger',
    nameKo: '호랑이',
    emoji: '🐯',
    requiredHours: 47,
    rarity: 'epic',
    spawnChance: 0.62,
  },
  {
    type: 'elephant',
    name: 'Elephant',
    nameKo: '코끼리',
    emoji: '🐘',
    requiredHours: 52,
    rarity: 'epic',
    spawnChance: 0.58,
  },
  {
    type: 'polar',
    name: 'Polar Bear',
    nameKo: '북극곰',
    emoji: '🐻‍❄️',
    requiredHours: 60,
    rarity: 'legendary',
    spawnChance: 0.55,
  },
  {
    type: 'giraffe',
    name: 'Giraffe',
    nameKo: '기린',
    emoji: '🦒',
    requiredHours: 75,
    rarity: 'legendary',
    spawnChance: 0.52,
  },
  {
    type: 'caterpillar',
    name: 'Caterpillar',
    nameKo: '애벌레',
    emoji: '🐛',
    requiredHours: 100,
    rarity: 'hidden',
    spawnChance: 0.5,
  },
];

export interface AnimalInstance {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  direction: number;
  isVisible: boolean;
  spawnedAt: number;
  duration: number;
}

export interface AnimalDiscovery {
  discovered: boolean;
  firstSeenAt: string | null;
  totalSeen: number;
}

export type AnimalCollection = Record<AnimalType, AnimalDiscovery>;

export interface CompletedForest {
  id: number;
  completedAt: string;
  totalTrees: number;
  focusTimeSeconds: number;
  treePositions: TreePosition[];
}

export interface DailyRecord {
  date: string;
  focusSeconds: number;
  treesGrown: number;
  goalSessionsCompleted?: number; // 목표 세션 완료 수 (구버전 데이터엔 없음)
}

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

export type ForestStage = 'small' | 'medium' | 'large';

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

const DEFAULT_DISCOVERY: AnimalDiscovery = { discovered: false, firstSeenAt: null, totalSeen: 0 };

export const DEFAULT_ANIMAL_COLLECTION: AnimalCollection = Object.fromEntries(
  ANIMAL_CONFIGS.map(c => [c.type, { ...DEFAULT_DISCOVERY }])
) as AnimalCollection;

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
