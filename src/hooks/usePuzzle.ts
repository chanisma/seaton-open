import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type {
  PuzzleEventWithProgress,
  PuzzlePiece,
  StudentPoints,
  PointTransaction,
  UnlockPieceResult,
} from '@project-types/puzzle.types';
import {
  getPuzzleEventsWithProgress,
  getPuzzlePieces,
  unlockPuzzlePiece,
  getStudentCollection,
} from '@services/puzzle.service';
import {
  getStudentPoints,
  getPointTransactions,
  getWallet,
  getPuzzleQuote,
} from '@services/points.service';
import type { StudentPuzzleCollection } from '@project-types/puzzle.types';
import type { PuzzleQuote, Wallet } from '@utils/wallet';

export const usePuzzle = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<PuzzleEventWithProgress[]>([]);
  const [collection, setCollection] = useState<StudentPuzzleCollection[]>([]);
  const [points, setPoints] = useState<StudentPoints>({
    student_id: '',
    total_earned: 0,
    total_spent: 0,
    balance: 0,
  });
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  // 통합 지갑 (코인 · 최근 코인 이력). 읽기 실패 시 null
  const [wallet, setWallet] = useState<Wallet | null>(null);
  // 이벤트별 «조각 하나에 낼 것» (서버 견적)
  const [quotes, setQuotes] = useState<Record<string, PuzzleQuote>>({});
  const [pieces, setPieces] = useState<Record<string, PuzzlePiece[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = user?.profile_id;

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [eventsData, pointsData, transData, collectionData, walletData] = await Promise.all([
        getPuzzleEventsWithProgress(studentId),
        getStudentPoints(studentId),
        getPointTransactions(studentId, { limit: 20 }),
        getStudentCollection(studentId),
        getWallet(),
      ]);
      setEvents(eventsData);
      setPoints(pointsData);
      setWallet(walletData);
      setTransactions(transData);
      setCollection(collectionData);
    } catch (err) {
      console.error('Failed to load puzzle data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 이벤트의 퍼즐 조각 로드
  const loadPieces = useCallback(
    async (eventId: string) => {
      if (pieces[eventId]) return pieces[eventId];
      try {
        const piecesData = await getPuzzlePieces(eventId);
        setPieces(prev => ({ ...prev, [eventId]: piecesData }));
        return piecesData;
      } catch (err) {
        console.error('Failed to load puzzle pieces:', err);
        return [];
      }
    },
    [pieces]
  );

  // 이벤트의 조각 견적 로드 (이전 포인트 먼저, 모자라면 코인)
  const loadQuote = useCallback(async (eventId: string) => {
    const quote = await getPuzzleQuote(eventId);
    if (quote) setQuotes(prev => ({ ...prev, [eventId]: quote }));
    return quote;
  }, []);

  // 조각 오픈
  const unlock = useCallback(
    async (eventId: string, pieceIndex: number): Promise<UnlockPieceResult> => {
      if (!studentId) throw new Error('로그인이 필요합니다.');

      const result = await unlockPuzzlePiece(eventId, pieceIndex);

      // 상태 즉시 반영
      setEvents(prev =>
        prev.map(e => {
          if (e.id !== eventId) return e;
          const newUnlocked = [...e.unlocked_pieces, pieceIndex];
          return {
            ...e,
            unlocked_pieces: newUnlocked,
            is_completed: result.is_puzzle_completed,
            is_collected: result.is_puzzle_completed ? true : e.is_collected,
          };
        })
      );

      // remaining_points = 남은 이전 포인트. 실제로 쓴 이전 포인트만큼만 누적 사용에 더한다
      setPoints(prev => ({
        ...prev,
        total_spent: prev.total_spent + Math.max(0, prev.balance - result.remaining_points),
        balance: result.remaining_points,
      }));

      // 트랜잭션·지갑·견적 새로고침 (코인으로 냈을 수도 있다)
      const [newTransactions, newWallet] = await Promise.all([
        getPointTransactions(studentId, { limit: 20 }),
        getWallet(),
        loadQuote(eventId),
      ]);
      setTransactions(newTransactions);
      if (newWallet) setWallet(newWallet);

      return result;
    },
    [studentId, loadQuote]
  );

  // 트랜잭션 더 불러오기
  const loadMoreTransactions = useCallback(async () => {
    if (!studentId) return;
    const more = await getPointTransactions(studentId, {
      limit: 20,
      offset: transactions.length,
    });
    setTransactions(prev => [...prev, ...more]);
  }, [studentId, transactions.length]);

  return {
    events,
    collection,
    points,
    wallet,
    quotes,
    transactions,
    pieces,
    isLoading,
    error,
    loadData,
    loadPieces,
    loadQuote,
    unlock,
    loadMoreTransactions,
  };
};
