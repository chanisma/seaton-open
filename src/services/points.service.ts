import { supabase } from '@/lib/supabase';
import type { PointTransaction, StudentPoints } from '@project-types/puzzle.types';
import { parsePuzzleQuote, parseWallet, type PuzzleQuote, type Wallet } from '@utils/wallet';
import { parseStudyWeek, type StudyWeek } from '@utils/studyRewards';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * 학생의 «이전 포인트» 잔액 조회 (2026-10-09 동결 — 퍼즐 전용, 더 쌓이지 않는다)
 * 새 보상은 코인이다 → getWallet()
 */
export const getStudentPoints = async (studentId: string): Promise<StudentPoints> => {
  const { data, error } = await db.rpc('get_student_points', {
    p_student_id: studentId,
  });

  if (error) {
    console.error('Error fetching student points:', error);
    return { student_id: studentId, total_earned: 0, total_spent: 0, balance: 0 };
  }

  const row = data?.[0] || { total_earned: 0, total_spent: 0, balance: 0 };
  return {
    student_id: studentId,
    total_earned: row.total_earned,
    total_spent: row.total_spent,
    balance: row.balance,
  };
};

/**
 * 포인트 트랜잭션 이력 조회
 */
export const getPointTransactions = async (
  studentId: string,
  options?: { limit?: number; offset?: number; type?: string }
): Promise<PointTransaction[]> => {
  let query = db
    .from('point_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.limit) {
    const start = options.offset || 0;
    query = query.range(start, start + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching point transactions:', error);
    return [];
  }

  return (data as PointTransaction[]) || [];
};

/**
 * 포인트 트랜잭션 유형별 한글 라벨
 */
export const getTransactionTypeLabel = (type: string): string => {
  // 이전 포인트(point_transactions)의 유형 — 코인 이력은 walletKindLabel()
  const labels: Record<string, string> = {
    attendance: '출석',
    review: '리뷰 작성',
    puzzle_unlock: '퍼즐 조각 오픈',
    focus: '집중 세션',
  };
  return labels[type] || type;
};

/**
 * 통합 지갑 읽기 (RPC seaton_wallet_read) — 코인 · 이전 포인트 · 오늘 남은 보상 · 최근 코인 이력
 * 실패하면 null (화면은 코인 칸만 비우고 나머지는 그대로 그린다)
 */
export const getWallet = async (): Promise<Wallet | null> => {
  const { data, error } = await db.rpc('seaton_wallet_read');
  if (error) {
    console.error('Error reading wallet:', error);
    return null;
  }
  return parseWallet(data);
};

/**
 * 이번 주 자습 출석 코인 (RPC academy_study_read — 별빛 아카데미 자습 기록과 같은 자료)
 * 예약마다 출석 상태 · 받았나를 준다. 실패하면 null (대시보드는 그 카드만 비운다)
 */
export const getStudyWeek = async (): Promise<StudyWeek | null> => {
  const { data, error } = await db.rpc('academy_study_read', {
    p_week: null,
    p_student_code: null,
  });
  if (error) {
    console.error('Error reading study rewards:', error);
    return null;
  }
  return parseStudyWeek(data);
};

/**
 * 퍼즐 조각 한 개를 열 때 낼 것 (RPC seaton_puzzle_quote) — 이전 포인트 먼저, 모자라면 2P = 1코인
 */
export const getPuzzleQuote = async (eventId: string): Promise<PuzzleQuote | null> => {
  const { data, error } = await db.rpc('seaton_puzzle_quote', { p_event_id: eventId });
  if (error) {
    console.error('Error fetching puzzle quote:', error);
    return null;
  }
  return parsePuzzleQuote(data);
};
