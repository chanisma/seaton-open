import { useState, useEffect, useMemo } from 'react';
import { Lock, Check, Coins, AlertCircle } from 'lucide-react';
import { parseGridSize } from '@utils/puzzleImageSplitter';
import type { PuzzleEventWithProgress, PuzzlePiece } from '@project-types/puzzle.types';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { estimatePuzzleQuote, formatPuzzleCost, type PuzzleQuote } from '@utils/wallet';

interface PuzzleGridProps {
  event: PuzzleEventWithProgress;
  pieces: PuzzlePiece[];
  /** 이전 포인트 잔액 (퍼즐 전용) */
  balance: number;
  /** 통합 지갑 코인 (모자란 포인트를 2P = 1코인으로 채운다) */
  coins?: number | null;
  /** 서버 견적 (seaton_puzzle_quote). 없으면 같은 규칙으로 추정한다 */
  quote?: PuzzleQuote | null;
  isAdmin?: boolean;
  onUnlock: (pieceIndex: number) => Promise<void>;
}

export const PuzzleGrid = ({
  event,
  pieces,
  balance,
  coins = null,
  quote = null,
  isAdmin = false,
  onUnlock,
}: PuzzleGridProps) => {
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);

  const { rows, cols } = useMemo(() => parseGridSize(event.grid_size), [event.grid_size]);

  const unlockedSet = useMemo(() => new Set(event.unlocked_pieces), [event.unlocked_pieces]);

  const progress = useMemo(() => {
    const unlocked = event.unlocked_pieces.length;
    const total = event.total_pieces;
    const percent = Math.round((unlocked / total) * 100);
    return { unlocked, total, percent };
  }, [event.unlocked_pieces, event.total_pieces]);

  // 조각 오픈 애니메이션 리셋
  useEffect(() => {
    if (justUnlocked !== null) {
      const timer = setTimeout(() => setJustUnlocked(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [justUnlocked]);

  const handlePieceClick = (index: number) => {
    if (unlockedSet.has(index) || event.status !== 'active') return;
    setSelectedPiece(index);
    setShowConfirm(true);
  };

  const handleConfirmUnlock = async () => {
    if (selectedPiece === null) return;
    setIsUnlocking(true);
    try {
      await onUnlock(selectedPiece);
      setJustUnlocked(selectedPiece);
      setShowConfirm(false);
      setSelectedPiece(null);
    } catch (err) {
      console.error('Unlock failed:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 서버 견적이 정본. 못 받았으면 같은 규칙(이전 포인트 먼저, 모자라면 2P = 1코인)으로 추정
  const effectiveQuote =
    quote ?? estimatePuzzleQuote(event.piece_cost, balance, coins ?? 0, isAdmin);
  const canAfford = isAdmin || effectiveQuote.affordable;
  const costLabel = formatPuzzleCost({ ...effectiveQuote, free: isAdmin || effectiveQuote.free });
  const isEnded = event.status === 'ended';

  return (
    <div className="space-y-4">
      {/* 진행 바 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
        <span>
          {progress.unlocked}/{progress.total} 조각
        </span>
        <span>{progress.percent}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* 퍼즐 그리드 */}
      <div
        className="grid gap-1 rounded-xl overflow-hidden bg-muted p-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          aspectRatio: `${cols}/${rows}`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, index) => {
          const isUnlocked = unlockedSet.has(index);
          const piece = pieces.find(p => p.piece_index === index);
          const isJustUnlocked = justUnlocked === index;

          return (
            <button
              key={index}
              onClick={() => handlePieceClick(index)}
              disabled={isUnlocked || isEnded}
              className={`
                relative overflow-hidden rounded-sm transition-all duration-300
                ${
                  isUnlocked
                    ? 'cursor-default'
                    : isEnded
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:ring-2 hover:ring-primary-400 hover:scale-[1.02]'
                }
                ${isJustUnlocked ? 'animate-scale-in' : ''}
              `}
            >
              {isUnlocked && piece ? (
                <img
                  src={piece.image_url}
                  alt={`조각 ${index + 1}`}
                  className={`w-full h-full ${isJustUnlocked ? 'animate-fade-in' : ''}`}
                />
              ) : (
                <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              {/* 완성 표시 */}
              {event.is_completed && isUnlocked && (
                <div className="absolute inset-0 bg-green-500/10" />
              )}
            </button>
          );
        })}
      </div>

      {/* 완성 메시지 */}
      {event.is_completed && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-300">
          <Check className="w-5 h-5" />
          <span className="font-medium">퍼즐 완성! 컬렉션에 소장되었습니다.</span>
        </div>
      )}

      {/* 종료 메시지 */}
      {isEnded && !event.is_completed && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">이벤트가 종료되었습니다.</span>
        </div>
      )}

      {/* 조각 오픈 확인 모달 */}
      <Modal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setSelectedPiece(null);
        }}
        title="퍼즐 조각 오픈"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            조각 #{selectedPiece !== null ? selectedPiece + 1 : ''} 을 오픈하시겠습니까?
          </p>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-sm">
              이번 조각: <strong>{costLabel}</strong> / 보유:{' '}
              <strong className={canAfford ? 'text-green-600' : 'text-red-500'}>
                {balance}P · 코인 {coins ?? effectiveQuote.coins}
              </strong>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            이전 포인트를 먼저 쓰고, 모자란 만큼은 코인으로 내요 (2P = 1코인).
          </p>
          {!canAfford && <p className="text-sm text-red-500">포인트와 코인이 부족합니다.</p>}
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirm(false);
                setSelectedPiece(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmUnlock} disabled={!canAfford || isUnlocking}>
              {isUnlocking ? '오픈 중...' : `오픈 · ${costLabel}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
