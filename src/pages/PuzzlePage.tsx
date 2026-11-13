import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { AdminOwnershipPanel } from '@components/common/AdminOwnershipPanel';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { PointsDisplay } from '@components/student/puzzle/PointsDisplay';
import { PointHistory } from '@components/student/puzzle/PointHistory';
import { PuzzleGrid } from '@components/student/puzzle/PuzzleGrid';
import { PuzzleCollection } from '@components/student/puzzle/PuzzleCollection';
import { usePuzzle } from '@hooks/usePuzzle';
import { useToast } from '@hooks/useToast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Puzzle, Trophy, History, Clock, Calendar } from 'lucide-react';
import type { PuzzleEventWithProgress, PuzzlePiece } from '@project-types/puzzle.types';
import {
  getAllPuzzleEvents,
  getPuzzleOwnerCounts,
  getPuzzleOwnershipByEvent,
} from '@services/puzzle.service';
import type { PuzzleEvent } from '@project-types/puzzle.types';
import type { CollectionOwner, OwnershipItem } from '@project-types/ownership.types';
import { Users } from 'lucide-react';

type TabType = 'puzzles' | 'collection' | 'history';

export const PuzzlePage = () => {
  const { user } = useAuth();
  const {
    events,
    collection,
    points,
    wallet,
    quotes,
    transactions,
    isLoading,
    error,
    loadPieces,
    loadQuote,
    unlock,
    loadMoreTransactions,
  } = usePuzzle();
  const isAdmin = user?.type === 'admin';

  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('puzzles');
  const [selectedEvent, setSelectedEvent] = useState<PuzzleEventWithProgress | null>(null);
  const [eventPieces, setEventPieces] = useState<PuzzlePiece[]>([]);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [allEvents, setAllEvents] = useState<PuzzleEvent[]>([]);
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});
  const [ownershipByEvent, setOwnershipByEvent] = useState<Record<string, CollectionOwner[]>>({});
  const [isOwnershipLoading, setIsOwnershipLoading] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);

  // selectedEvent를 events 업데이트와 동기화
  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find(e => e.id === selectedEvent.id);
      if (updated) {
        setSelectedEvent(updated);
      }
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // 퍼즐 소유 현황 로드
  useEffect(() => {
    if (!isAdmin) {
      setOwnershipByEvent({});
      setOwnershipError(null);
      getPuzzleOwnerCounts().then(setOwnerCounts).catch(console.error);
      return;
    }

    let cancelled = false;
    setIsOwnershipLoading(true);
    setOwnershipError(null);

    Promise.all([getAllPuzzleEvents(), getPuzzleOwnershipByEvent()])
      .then(([loadedEvents, ownership]) => {
        if (cancelled) return;
        setAllEvents(loadedEvents);
        setOwnershipByEvent(ownership);
        setOwnerCounts(
          Object.fromEntries(
            Object.entries(ownership).map(([eventId, owners]) => [eventId, owners.length])
          )
        );
      })
      .catch(error => {
        console.error('Failed to load puzzle ownership:', error);
        if (!cancelled) setOwnershipError('퍼즐 소유 현황을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsOwnershipLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // 컬렉션 탭에서 이벤트 정보 필요
  useEffect(() => {
    if (!isAdmin && activeTab === 'collection' && collection.length > 0) {
      getAllPuzzleEvents().then(setAllEvents).catch(console.error);
    }
  }, [activeTab, collection.length, isAdmin]);

  const ownershipItems = useMemo<OwnershipItem[]>(
    () =>
      allEvents.map(event => ({
        id: event.id,
        label: event.title,
        detail: `${format(new Date(event.start_date), 'yyyy.M.d', { locale: ko })} ~ ${format(
          new Date(event.end_date),
          'yyyy.M.d',
          { locale: ko }
        )}`,
        owners: ownershipByEvent[event.id] ?? [],
      })),
    [allEvents, ownershipByEvent]
  );

  // 이벤트 선택 시 조각 로드
  const handleSelectEvent = async (event: PuzzleEventWithProgress) => {
    setSelectedEvent(event);
    setLoadingPieces(true);
    try {
      const [pieces] = await Promise.all([loadPieces(event.id), loadQuote(event.id)]);
      setEventPieces(pieces);
    } finally {
      setLoadingPieces(false);
    }
  };

  // 조각 오픈
  const handleUnlock = async (pieceIndex: number) => {
    if (!selectedEvent) return;
    try {
      const result = await unlock(selectedEvent.id, pieceIndex);
      if (result.is_puzzle_completed) {
        success('퍼즐을 완성했습니다! 컬렉션에 소장되었습니다! 🎉');
      } else {
        success(`조각 #${pieceIndex + 1}을 오픈했습니다!`);
      }
      // 조각 다시 로드
      const pieces = await loadPieces(selectedEvent.id);
      setEventPieces(pieces);
    } catch (err) {
      toastError(err instanceof Error ? err.message : '조각 오픈에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-500">{error}</div>
      </Layout>
    );
  }

  const tabs: { key: TabType; label: string; icon: typeof Puzzle }[] = [
    { key: 'puzzles', label: '퍼즐 이벤트', icon: Puzzle },
    { key: 'collection', label: '내 컬렉션', icon: Trophy },
    { key: 'history', label: '보상 이력', icon: History },
  ];

  return (
    <Layout title="이벤트 퍼즐">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <h1 className="sr-only">이벤트 퍼즐</h1>

        {isAdmin && (
          <AdminOwnershipPanel
            title="퍼즐 소유 현황"
            description="이벤트를 선택해 퍼즐을 완성한 사용자와 완료 날짜를 확인하세요."
            items={ownershipItems}
            dateLabel="완성"
            isLoading={isOwnershipLoading}
            error={ownershipError}
          />
        )}

        {/* 보상 카드: 코인 + 이전 포인트(퍼즐 전용) */}
        <PointsDisplay points={points} coins={wallet?.coins ?? null} />

        {/* 탭 */}
        <div
          className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/70 p-1"
          role="tablist"
          aria-label="퍼즐 메뉴"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedEvent(null);
                }}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-[color,background-color,box-shadow] sm:px-3 sm:text-sm ${
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'puzzles' && (
          <div className="space-y-4">
            {selectedEvent ? (
              <div className="space-y-4">
                {/* 뒤로가기 */}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  이벤트 목록
                </button>

                {/* 이벤트 정보 */}
                <section className="content-surface rounded-[2rem] p-5 sm:p-7">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {selectedEvent.title}
                  </h2>
                  {selectedEvent.description && (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(selectedEvent.start_date), 'M.d', { locale: ko })} ~{' '}
                      {format(new Date(selectedEvent.end_date), 'M.d', { locale: ko })}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      조각당 {selectedEvent.piece_cost}P
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1.5 font-semibold ${
                        selectedEvent.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : selectedEvent.status === 'upcoming'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {selectedEvent.status === 'active'
                        ? '진행 중'
                        : selectedEvent.status === 'upcoming'
                          ? '예정'
                          : '종료'}
                    </span>
                  </div>
                </section>

                {/* 퍼즐 그리드 */}
                {loadingPieces ? (
                  <div className="content-surface flex min-h-64 items-center justify-center rounded-[2rem]">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <PuzzleGrid
                    event={selectedEvent}
                    pieces={eventPieces}
                    balance={points.balance}
                    coins={wallet?.coins ?? null}
                    quote={quotes[selectedEvent.id] ?? null}
                    isAdmin={isAdmin}
                    onUnlock={handleUnlock}
                  />
                )}
              </div>
            ) : (
              // 이벤트 목록
              <section className="space-y-3">
                {events.length === 0 ? (
                  <div className="content-surface flex flex-col items-center rounded-[2rem] px-5 py-16 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Puzzle className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground">
                      현재 진행 중인 퍼즐 이벤트가 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      새 이벤트가 열리면 이곳에서 확인할 수 있어요.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {events.map(event => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleSelectEvent(event)}
                        className="content-surface w-full rounded-[1.75rem] p-4 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:p-5"
                      >
                        <div className="flex gap-4">
                          {/* 미니 퍼즐 프리뷰 */}
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                            {event.is_completed ? (
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Puzzle className="h-8 w-8 text-muted-foreground/60" />
                              </div>
                            )}
                            {event.is_collected && (
                              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20">
                                <Trophy className="h-6 w-6 text-emerald-600" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-bold text-foreground">{event.title}</h3>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {format(new Date(event.start_date), 'M.d', { locale: ko })} ~{' '}
                              {format(new Date(event.end_date), 'M.d', { locale: ko })}
                              {' · '}조각당 {event.piece_cost}P{' · '}
                              <span className="inline-flex items-center gap-0.5">
                                <Users className="h-3 w-3" />
                                {ownerCounts[event.id] || 0}명 완성
                              </span>
                            </p>

                            {/* 진행도 바 */}
                            <div className="mt-2">
                              <div className="mb-1 flex justify-between text-xs tabular-nums text-muted-foreground">
                                <span>
                                  {event.unlocked_pieces.length}/{event.total_pieces}
                                </span>
                                <span>
                                  {Math.round(
                                    (event.unlocked_pieces.length / event.total_pieces) * 100
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-muted">
                                <div
                                  className="h-1.5 rounded-full bg-primary transition-all"
                                  style={{
                                    width: `${(event.unlocked_pieces.length / event.total_pieces) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* 상태 뱃지 */}
                            <div className="mt-2">
                              <span
                                className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  event.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : event.status === 'upcoming'
                                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                      : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {event.status === 'active'
                                  ? '진행 중'
                                  : event.status === 'upcoming'
                                    ? '시작 예정'
                                    : '종료'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {activeTab === 'collection' && (
          <PuzzleCollection collection={collection} events={allEvents} />
        )}

        {activeTab === 'history' && (
          <section className="content-surface rounded-[2rem] p-5 sm:p-7">
            <h2 className="text-lg font-bold tracking-tight text-foreground">보상 이력</h2>
            <p className="mb-4 mt-1 text-xs text-muted-foreground">
              코인 이력과 이전 포인트(퍼즐 전용) 이력을 함께 보여드려요.
            </p>
            <PointHistory
              transactions={transactions}
              walletEntries={wallet?.recent ?? []}
              onLoadMore={loadMoreTransactions}
              hasMore={transactions.length >= 20 && transactions.length % 20 === 0}
            />
          </section>
        )}
      </div>
    </Layout>
  );
};
