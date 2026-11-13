import { Coins, BookOpen, CheckCircle, Puzzle, Trees, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PointTransaction } from '@project-types/puzzle.types';
import { mergeRewardHistory, type WalletEntry } from '@utils/wallet';
import { Button } from '@components/common/Button';

interface PointHistoryProps {
  /** 이전 포인트 이력 (point_transactions) */
  transactions: PointTransaction[];
  /** 코인 이력 (seaton_wallet_read.recent — 최근 30건) */
  walletEntries?: WalletEntry[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const typeIcons: Record<string, typeof Coins> = {
  attendance: CheckCircle,
  review: BookOpen,
  puzzle_unlock: Puzzle,
  seaton_attendance: CheckCircle,
  seaton_attendance_reversal: Undo2,
  seaton_review: BookOpen,
  seaton_focus: Trees,
};

const typeColors: Record<string, string> = {
  attendance: 'text-green-500',
  review: 'text-purple-500',
  puzzle_unlock: 'text-red-500',
  seaton_attendance: 'text-green-500',
  seaton_attendance_reversal: 'text-muted-foreground',
  seaton_review: 'text-purple-500',
  seaton_focus: 'text-emerald-500',
};

export const PointHistory = ({
  transactions,
  walletEntries = [],
  onLoadMore,
  hasMore = true,
}: PointHistoryProps) => {
  const items = mergeRewardHistory(transactions, walletEntries);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Coins className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>아직 보상 이력이 없습니다.</p>
        <p className="text-sm mt-1">출석하거나 피드백을 남기면 코인을 받아요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(item => {
        const Icon = typeIcons[item.kind] || Coins;
        const colorClass = typeColors[item.kind] || 'text-gray-500';
        const isPositive = item.amount > 0;

        return (
          <div
            key={item.key}
            className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/70"
          >
            <div className={`p-2 rounded-full bg-muted ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.title}
                {item.detail && (
                  <span className="ml-1 font-normal text-muted-foreground">· {item.detail}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.at), 'M월 d일 (EEE) HH:mm', { locale: ko })}
              </p>
            </div>
            <span
              className={`shrink-0 text-sm font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {isPositive ? '+' : ''}
              {item.amount}
              {item.unit}
            </span>
          </div>
        );
      })}

      {hasMore && onLoadMore && (
        <div className="text-center pt-2">
          <Button variant="secondary" size="sm" onClick={onLoadMore}>
            이전 포인트 이력 더 보기
          </Button>
        </div>
      )}
    </div>
  );
};
