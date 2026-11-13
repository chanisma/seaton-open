import { supabase } from '@/lib/supabase';
import type {
  FocusForestData,
  CompletedForest,
  TreePosition,
  AnimalCollection,
  DailyRecord,
} from '@/types/focusForest.types';
import type { UserType } from '@/types/user.types';
import { parseFocusFinish, type FocusFinishResult } from '@utils/wallet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// ---------------------------------------------------------------------------
// Focus Forest Data (per user)
// ---------------------------------------------------------------------------

interface FocusForestRow {
  id: string;
  user_id: string;
  total_focus_seconds: number;
  longest_session_seconds: number;
  current_forest_index: number;
  animal_collection: AnimalCollection;
  daily_records: DailyRecord[];
  saved_trees: TreePosition[];
  session_goal_minutes: number | null;
  updated_at: string;
}

interface CompletedForestRow {
  forest_index: number;
  completed_at: string;
  total_trees: number;
  focus_time_seconds: number;
  tree_positions: TreePosition[];
}

interface FocusForestParticipantRow {
  user_id: string;
  total_focus_seconds: number;
  updated_at: string;
  profiles:
    | {
        id: string;
        name: string | null;
        email: string | null;
        role: UserType;
      }
    | {
        id: string;
        name: string | null;
        email: string | null;
        role: UserType;
      }[]
    | null;
}

export interface FocusForestSessionRow {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  trees_planted: number;
  memo: string | null;
  created_at: string;
}

export interface FocusForestParticipant {
  id: string;
  name: string;
  email: string;
  role: UserType;
  totalFocusSeconds: number;
  updatedAt: string;
}

const rowToData = (row: FocusForestRow): FocusForestData => ({
  totalFocusSeconds: row.total_focus_seconds,
  longestSessionSeconds: row.longest_session_seconds,
  currentForestIndex: row.current_forest_index,
  forests: [], // loaded separately
  animalCollection: row.animal_collection,
  dailyRecords: row.daily_records,
  savedTrees: row.saved_trees,
  sessionGoalMinutes: row.session_goal_minutes ?? null,
});

export const getFocusForestData = async (userId: string): Promise<FocusForestData | null> => {
  const { data, error } = await db
    .from('focus_forest_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  const forestData = rowToData(data as FocusForestRow);

  // Load completed forests
  const { data: forests } = await db
    .from('focus_forest_completed')
    .select('*')
    .eq('user_id', userId)
    .order('forest_index', { ascending: true });

  forestData.forests = ((forests ?? []) as CompletedForestRow[]).map(f => ({
    id: f.forest_index,
    completedAt: f.completed_at,
    totalTrees: f.total_trees,
    focusTimeSeconds: f.focus_time_seconds,
    treePositions: f.tree_positions,
  }));

  return forestData;
};

/**
 * Focus Forest 데이터가 있는 사용자 목록입니다.
 * RLS에서 관리자만 다른 사용자의 행을 읽을 수 있으므로 관리자 화면에서만 호출합니다.
 */
export const getFocusForestParticipants = async (
  currentUserId?: string
): Promise<FocusForestParticipant[]> => {
  let query = db
    .from('focus_forest_data')
    .select(
      `
        user_id,
        total_focus_seconds,
        updated_at,
        profiles!focus_forest_data_user_id_fkey (
          id,
          name,
          email,
          role
        )
      `
    )
    .order('updated_at', { ascending: false });

  if (currentUserId) {
    query = query.neq('user_id', currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching focus forest participants:', error);
    throw new Error('집중 모드 사용자 목록을 불러오지 못했습니다.');
  }

  return ((data ?? []) as FocusForestParticipantRow[])
    .map(row => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile) return null;

      return {
        id: row.user_id,
        name: profile.name || profile.email || '이름 없음',
        email: profile.email || '',
        role: profile.role as UserType,
        totalFocusSeconds: row.total_focus_seconds ?? 0,
        updatedAt: row.updated_at,
      } satisfies FocusForestParticipant;
    })
    .filter((participant: FocusForestParticipant | null): participant is FocusForestParticipant => {
      return participant !== null;
    })
    .sort((a: FocusForestParticipant, b: FocusForestParticipant) =>
      a.name.localeCompare(b.name, 'ko')
    );
};

export const upsertFocusForestData = async (
  userId: string,
  data: FocusForestData
): Promise<void> => {
  const { error } = await db.from('focus_forest_data').upsert(
    {
      user_id: userId,
      total_focus_seconds: data.totalFocusSeconds,
      longest_session_seconds: data.longestSessionSeconds,
      current_forest_index: data.currentForestIndex,
      animal_collection: data.animalCollection,
      daily_records: data.dailyRecords,
      saved_trees: data.savedTrees,
      session_goal_minutes: data.sessionGoalMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) console.error('Error upserting focus forest data:', error);
};

// ---------------------------------------------------------------------------
// Completed Forests
// ---------------------------------------------------------------------------

export const saveCompletedForest = async (
  userId: string,
  forest: CompletedForest
): Promise<void> => {
  const { error } = await db.from('focus_forest_completed').insert({
    user_id: userId,
    forest_index: forest.id,
    completed_at: forest.completedAt,
    total_trees: forest.totalTrees,
    focus_time_seconds: forest.focusTimeSeconds,
    tree_positions: forest.treePositions,
  });

  if (error) console.error('Error saving completed forest:', error);
};

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const saveSession = async (
  userId: string,
  startedAt: string,
  endedAt: string,
  durationSeconds: number,
  treesPlanted: number
): Promise<void> => {
  const { error } = await db.from('focus_forest_sessions').insert({
    user_id: userId,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: durationSeconds,
    trees_planted: treesPlanted,
  });

  if (error) {
    console.error('Error saving session:', error);
  }

  // 2026-10-09: 세션 기록으로는 보상을 주지 않는다 (award_focus_points 는 항상 0 — 더 부르지 않는다).
  // 집중 코인은 서버가 시간을 잰 목표 세션만 → startFocusRun / finishFocusRun
};

// ---------------------------------------------------------------------------
// 집중 코인 — 서버가 시간을 잰다 (seaton_focus_runs)
//   25 · 50 · 90분 목표만, 목표 시각 ~ +15분 안에 끝내야 +2코인.
//   하루 2번 상한은 다마고찌 «함께 집중»과 공유한다. 무제한 모드는 코인이 없다.
// ---------------------------------------------------------------------------

export interface FocusRun {
  id: string;
  plannedSeconds: number;
  startedAt: string;
}

/** 목표 세션 시작 (학생만). 열려 있던 이전 기록은 서버가 'replaced' 로 닫는다. */
export const startFocusRun = async (minutes: number): Promise<FocusRun> => {
  const { data, error } = await db.rpc('seaton_focus_start', { p_minutes: minutes });
  if (error) throw new Error(error.message || '집중 기록을 시작하지 못했습니다.');
  const run = (data?.run ?? {}) as Record<string, unknown>;
  return {
    id: String(run.id),
    plannedSeconds: Number(run.planned_seconds) || minutes * 60,
    startedAt: String(run.started_at ?? new Date().toISOString()),
  };
};

/**
 * 목표 세션 끝내기. 목표 시각 전이면 outcome 'running' + remaining(초) — 실패가 아니다.
 * giveUp = true 면 언제든 끝낸다(코인 없음).
 */
export const finishFocusRun = async (runId: string, giveUp = false): Promise<FocusFinishResult> => {
  const { data, error } = await db.rpc('seaton_focus_finish', {
    p_id: runId,
    p_give_up: giveUp,
  });
  if (error) throw new Error(error.message || '집중 기록을 끝내지 못했습니다.');
  return parseFocusFinish(data);
};

export const getSessions = async (
  userId: string,
  page: number = 0,
  pageSize: number = 5
): Promise<{ sessions: FocusForestSessionRow[]; total: number }> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await db
    .from('focus_forest_sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching sessions:', error);
    return { sessions: [], total: 0 };
  }

  return { sessions: (data ?? []) as FocusForestSessionRow[], total: count ?? 0 };
};

export const updateSessionMemo = async (sessionId: string, memo: string): Promise<void> => {
  const { error } = await db.from('focus_forest_sessions').update({ memo }).eq('id', sessionId);

  if (error) console.error('Error updating session memo:', error);
};

export const getCompletedForests = async (userId: string): Promise<CompletedForest[]> => {
  const { data, error } = await db
    .from('focus_forest_completed')
    .select('*')
    .eq('user_id', userId)
    .order('forest_index', { ascending: true });

  if (error || !data) return [];

  return (data as CompletedForestRow[]).map(f => ({
    id: f.forest_index,
    completedAt: f.completed_at,
    totalTrees: f.total_trees,
    focusTimeSeconds: f.focus_time_seconds,
    treePositions: f.tree_positions,
  }));
};
