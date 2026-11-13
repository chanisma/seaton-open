/**
 * 통합 지갑 (2026-10-09) — 순수 함수
 *
 * - 코인 = academy·다마고찌와 같은 지갑 하나. 새 보상은 전부 코인이다.
 * - 이전 포인트(point_transactions 합계)는 더 쌓이지 않는다 → 퍼즐 조각에만 쓴다.
 * - 퍼즐 조각 = 이전 포인트를 먼저 쓰고, 모자란 만큼 코인으로 (2P = 1코인, 올림).
 * 규칙의 정본은 spacekijun 저장소의 supabase/migrations/20261009120000_unified_wallet_seaton_cutover.sql
 */

export type WalletKind =
  | 'seaton_attendance'
  | 'seaton_attendance_reversal'
  | 'seaton_review'
  | 'seaton_focus'
  | 'puzzle_unlock';

export interface WalletEntry {
  delta: number;
  kind: WalletKind | string;
  note: string | null;
  at: string;
  balance: number;
}

export interface Wallet {
  coins: number;
  /** 이전 포인트 (퍼즐 전용) */
  legacyPoints: number;
  /** 오늘 피드백 코인을 아직 받을 수 있는가 (0|1) */
  reviewLeft: number;
  /** 오늘 남은 집중 코인 횟수 (다마고찌 «함께 집중»과 공유) */
  focusLeft: number;
  recent: WalletEntry[];
  serverNow: number;
}

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** RPC seaton_wallet_read 의 jsonb → Wallet */
export const parseWallet = (raw: unknown): Wallet => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const recent = Array.isArray(r.recent) ? (r.recent as Record<string, unknown>[]) : [];
  return {
    coins: num(r.coins),
    legacyPoints: num(r.legacy_points),
    reviewLeft: num(r.review_left),
    focusLeft: num(r.focus_left),
    recent: recent.map(e => ({
      delta: num(e.delta),
      kind: String(e.kind ?? ''),
      note: (e.note as string | null) ?? null,
      at: String(e.at ?? ''),
      balance: num(e.balance),
    })),
    serverNow: num(r.server_now, Date.now()),
  };
};

export interface PuzzleQuote {
  costPoints: number;
  points: number;
  coins: number;
  payPoints: number;
  payCoins: number;
  affordable: boolean;
  free: boolean;
}

/** RPC seaton_puzzle_quote 의 jsonb → PuzzleQuote */
export const parsePuzzleQuote = (raw: unknown): PuzzleQuote => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    costPoints: num(r.cost_points),
    points: num(r.points),
    coins: num(r.coins),
    payPoints: num(r.pay_points),
    payCoins: num(r.pay_coins),
    affordable: r.affordable === true,
    free: r.free === true,
  };
};

/** 퍼즐 코인 환산 (서버 wallet_private.puzzle_coin_cost 와 같은 식: 2P = 1코인, 올림) */
export const puzzleCoinCost = (points: number) => Math.max(0, Math.ceil(points / 2));

/** 조각 하나에 무엇을 얼마나 내는지 — '10P' · '5P + 3코인' · '5코인' · '무료' */
export const formatPuzzleCost = (q: Pick<PuzzleQuote, 'payPoints' | 'payCoins' | 'free'>) => {
  if (q.free) return '무료';
  const parts: string[] = [];
  if (q.payPoints > 0) parts.push(`${q.payPoints}P`);
  if (q.payCoins > 0) parts.push(`${q.payCoins}코인`);
  return parts.length > 0 ? parts.join(' + ') : '0P';
};

/** 견적이 없을 때(조회 실패) 클라이언트가 같은 규칙으로 계산한 견적 */
export const estimatePuzzleQuote = (
  costPoints: number,
  points: number,
  coins: number,
  free = false
): PuzzleQuote => {
  const payPoints = free ? 0 : Math.min(Math.max(points, 0), costPoints);
  const payCoins = free ? 0 : puzzleCoinCost(costPoints - payPoints);
  return {
    costPoints,
    points,
    coins,
    payPoints,
    payCoins,
    affordable: free || payCoins <= coins,
    free,
  };
};

const KIND_LABELS: Record<string, string> = {
  seaton_attendance: '자습실 출석',
  seaton_attendance_reversal: '출석 취소',
  seaton_review: '피드백',
  seaton_focus: '집중의 숲',
  puzzle_unlock: '퍼즐 조각',
};

export const walletKindLabel = (kind: string) => KIND_LABELS[kind] ?? kind;

/** 이력 한 줄 (이전 포인트 + 코인을 한 목록으로) */
export interface RewardHistoryItem {
  key: string;
  source: 'legacy' | 'wallet';
  kind: string;
  title: string;
  detail: string | null;
  amount: number;
  unit: 'P' | '코인';
  at: string;
}

const LEGACY_TYPE_LABELS: Record<string, string> = {
  attendance: '출석',
  review: '리뷰 작성',
  puzzle_unlock: '퍼즐 조각 오픈',
  focus: '집중 세션',
};

export const mergeRewardHistory = (
  legacy: {
    id: string;
    amount: number;
    type: string;
    description?: string | null;
    created_at: string;
  }[],
  wallet: WalletEntry[]
): RewardHistoryItem[] => {
  const items: RewardHistoryItem[] = [
    ...legacy.map(tx => ({
      key: `p:${tx.id}`,
      source: 'legacy' as const,
      kind: tx.type,
      title: `이전 포인트 · ${tx.description || LEGACY_TYPE_LABELS[tx.type] || tx.type}`,
      detail: null,
      amount: tx.amount,
      unit: 'P' as const,
      at: tx.created_at,
    })),
    ...wallet.map((e, i) => ({
      key: `c:${e.at}:${i}`,
      source: 'wallet' as const,
      kind: e.kind,
      title: walletKindLabel(e.kind),
      detail: e.note,
      amount: e.delta,
      unit: '코인' as const,
      at: e.at,
    })),
  ];
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
};

// ---------------------------------------------------------------------------
// 집중의 숲 (서버가 시간을 잰다)
// ---------------------------------------------------------------------------

export const FOCUS_COIN_MINUTES = [25, 50, 90] as const;
export const FOCUS_COIN_AMOUNT = 2;

export type FocusOutcome = 'running' | 'completed' | 'expired' | 'gave_up' | 'replaced';

export interface FocusFinishResult {
  outcome: FocusOutcome;
  remaining?: number;
  credit: number;
  coins?: number;
}

export const parseFocusFinish = (raw: unknown): FocusFinishResult => {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    outcome: String(r.outcome ?? 'gave_up') as FocusOutcome,
    remaining: r.remaining === undefined ? undefined : num(r.remaining),
    credit: num(r.credit),
    coins: r.coins === undefined || r.coins === null ? undefined : num(r.coins),
  };
};

/** 집중 결과를 학생에게 한 줄로 (null = 말할 것 없음) */
export const focusRewardMessage = (r: FocusFinishResult): string | null => {
  if (r.outcome === 'completed') {
    return r.credit > 0
      ? `+${r.credit}코인을 받았어요`
      : '오늘 받을 수 있는 집중 코인은 다 받았어요';
  }
  if (r.outcome === 'expired') return '끝난 뒤 15분이 지나 코인을 받지 못했어요';
  if (r.outcome === 'gave_up') return '목표 시간 전에 끝내서 이번에는 코인이 없어요';
  return null;
};
