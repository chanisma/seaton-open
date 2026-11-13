import { useState, useEffect } from 'react';
import { addMonths, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import {
  getMonthlyTemperatureRanking,
  getTemperatureRanking,
  MonthlyTemperatureRanking,
  refreshTemperatureRanking,
  TemperatureRanking,
} from '@services/statistics.service';
import { getFlameTier } from '@utils/temperature';
import { ChevronLeft, ChevronRight, RefreshCw, Trophy, User } from 'lucide-react';

type RankingView = 'total' | 'monthly';

const formatChange = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

const getChangeColor = (value: number) => {
  if (value > 0) return 'text-red-500';
  if (value < 0) return 'text-blue-500';
  return 'text-muted-foreground';
};

const getRankBadgeClass = (rank: number) =>
  rank === 1
    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
    : rank <= 3
      ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
      : 'bg-muted text-muted-foreground';

export const TemperatureRankingPage = () => {
  const { user, isTeacher } = useAuth();

  // Ranking State
  const [rankings, setRankings] = useState<TemperatureRanking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monthly Ranking State
  const [view, setView] = useState<RankingView>('total');
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyTemperatureRanking[]>([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);

  const profileId = user?.profile_id || '';
  const isCurrentMonth = isSameMonth(selectedMonth, new Date());

  // Load Ranking
  useEffect(() => {
    const loadRankings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTemperatureRanking();
        setRankings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '랭킹 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, []);

  // Load Monthly Ranking
  useEffect(() => {
    if (view !== 'monthly') return;
    let cancelled = false;

    const loadMonthlyRankings = async () => {
      try {
        setIsMonthlyLoading(true);
        setError(null);
        const data = await getMonthlyTemperatureRanking(selectedMonth);
        if (!cancelled) setMonthlyRankings(data);
      } catch (err) {
        if (!cancelled) {
          setMonthlyRankings([]);
          setError(err instanceof Error ? err.message : '월별 랭킹을 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsMonthlyLoading(false);
      }
    };

    loadMonthlyRankings();
    return () => {
      cancelled = true;
    };
  }, [view, selectedMonth]);

  const getTemperatureColor = (temp: number) => {
    if (temp >= 36.5) return 'text-red-500';
    if (temp >= 30) return 'text-orange-500';
    if (temp >= 20) return 'text-primary-500';
    return 'text-blue-500';
  };

  // 불꽃 ���어 아이콘
  const FlameIcon = ({ temperature, size = 20 }: { temperature: number; size?: number }) => {
    const tier = getFlameTier(temperature);
    // 단계별 불꽃 크기와 형태가 달라짐
    const paths: Record<string, string> = {
      ember:
        'M12 21c-3.3 0-6-2.7-6-6 0-2.5 1.5-4.5 3-6 .5-.5 1-1.5 1-2.5 0-.5-.5-1-1-1.5 2 0 4 2 4 4 0 .5-.5 1-1 1s-1-.5-1-1c0-1-1-2-2-2 1 2 2 3 2 5 0 2.2-1.8 4-4 4z',
      flame:
        'M12 22c-4 0-7-3-7-7 0-3 2-5.5 4-7.5.5-.5 1-1.5 1-2.5s-.5-2-1.5-3C10 3 12 5.5 12 8c0 .5-.5 1.5-1.5 1.5S9 9 9 8.5C9 7 8 5.5 7 5c1.5 2.5 2.5 4 2.5 6.5 0 1.5-1 3-2.5 3s-2.5-1-2.5-2.5c0 0 0-1 .5-2C4 12 3 14 3 15c0 5 4 7 9 7s7-3 7-6c0-2-1-4-2.5-5.5-.5 1-1 2-1 3 0 1-.5 2-1.5 2s-1.5-1-1.5-2c0-2 1.5-4 3-5.5 2 2 3.5 4.5 3.5 7 0 4-3 7-7 7z',
      torch:
        'M12 22c-4.5 0-8-3.5-8-8 0-3.5 2-6 4.5-8.5.8-.8 1.5-2 1.5-3.5 0-.8-.3-1.5-.8-2.2C11.5 1.5 14 4 14 7c0 1-1 2-2 2s-2-1-2-2c0-1.5-.8-2.5-1.5-3.2C10 6 11 8 11 10c0 2-1.5 3.5-3.5 3.5S4 12 4 10c0-.5.2-1.5.5-2.5C3 9.5 2 12 2 14c0 5.5 4.5 8 10 8s8-3.5 8-7c0-3-1.5-5-3-7-.5 1.5-1 3-1 4.5 0 1.5-1 2.5-2 2.5s-2-1-2-2.5c0-2.5 2-5 4-7 2.5 2.5 4 5.5 4 8.5 0 4.5-3.5 8-8 8z',
      campfire:
        'M12 22c-5 0-9-4-9-9 0-4 2.5-7 5-9.5 1-1 1.5-2.5 1.5-4 0-1-.5-2-1.2-2.8C11 0 14 3 14 6.5c0 1-1 2.5-2.5 2.5S9 8 9 7c0-2-1-3-2-4 1.5 3 3 5 3 8 0 2.5-2 4-4 4s-4-1.5-4-3.5c0-1 .5-2.5 1-3.5C1.5 11 0 13.5 0 16c0 6 5 9 12 9s10-4 10-8c0-3-1.5-6-3.5-8-.5 2-1.5 3.5-1.5 5 0 2-1.5 3-2.5 3s-2.5-1.5-2.5-3c0-3 2-6 4.5-8.5C19.5 8 21 11 21 14.5c0 4.5-4 7.5-9 7.5z',
      beacon:
        'M12 22c-5.5 0-10-4.5-10-10 0-4.5 3-8 6-10.5 1-1 1.5-2.5 1.5-4C9.5 1 14 3.5 14 7.5c0 1.5-1.5 3-3 3s-3-1.5-3-3c0-2-1-3.5-2.5-4.5C8 6 9.5 8 9.5 11c0 3-2.5 5-5 5s-4.5-2-4.5-4.5c0-1.5.5-3 1.5-4.5C0 10 -1 13 -1 16c0 7 6 10 13 10s11-4.5 11-9c0-4-2-7-4-9.5-1 2-1.5 4-1.5 6 0 2-1.5 3.5-3 3.5s-3-1.5-3-3.5c0-3.5 2.5-7 5.5-9.5C20 7 22 11 22 14c0 5-4.5 8-10 8z',
    };

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={tier.color}
      >
        <path d={paths[tier.icon] || paths.ember} />
      </svg>
    );
  };

  if (!user || (user.type !== 'student' && user.type !== 'teacher' && user.type !== 'admin')) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">접근 권한이 없습니다.</p>
        </div>
      </Layout>
    );
  }

  const handleRefresh = async () => {
    if (view === 'monthly') {
      try {
        setIsMonthlyLoading(true);
        setError(null);
        setMonthlyRankings(await getMonthlyTemperatureRanking(selectedMonth));
      } catch (err) {
        setError(err instanceof Error ? err.message : '새로고침에 실패했습니다.');
      } finally {
        setIsMonthlyLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await refreshTemperatureRanking();
      const data = await getTemperatureRanking();
      setRankings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '새로고침에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const myRanking = rankings.find(ranking => ranking.studentId === profileId);
  const myMonthlyRanking = monthlyRankings.find(ranking => ranking.studentId === profileId);
  const monthLabel = format(selectedMonth, 'yyyy년 M월');
  const showSpinner = view === 'total' ? isLoading : isMonthlyLoading;

  return (
    <Layout title="온도 랭킹">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <h1 className="sr-only">온도 랭킹</h1>

        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <section className="content-surface rounded-[2rem] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Trophy className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {view === 'total' ? '실시간 학생 온도 랭킹' : '월별 학생 온도 랭킹'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {view === 'total'
                    ? '꾸준히 쌓은 열정 온도와 현재 순위를 확인하세요.'
                    : '한 달 동안 올린 온도로 순위를 매깁니다.'}
                </p>
              </div>
            </div>
            {/* refresh_temperature_rankings 는 교사·관리자만 실행할 수 있다 — 학생에게는 버튼을 숨긴다 */}
            {isTeacher && (
              <button
                type="button"
                onClick={handleRefresh}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                title="랭킹 새로고침"
                aria-label="랭킹 새로고침"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              aria-label="랭킹 보기"
              className="inline-flex self-start rounded-xl bg-muted/70 p-1"
            >
              {(
                [
                  ['total', '누적'],
                  ['monthly', '월별'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={view === value}
                  onClick={() => setView(value)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
                    view === value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {view === 'monthly' && (
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-28 text-center text-sm font-bold tabular-nums text-foreground">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                  disabled={isCurrentMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-40"
                  aria-label="다음 달"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {!showSpinner && view === 'total' && myRanking && (
            <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
              <p className="text-xs font-semibold text-primary">나의 현재 기록</p>
              <div className="mt-3 grid grid-cols-3 divide-x divide-border/70">
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">순위</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {myRanking.rank}
                    <span className="ml-0.5 text-sm">위</span>
                  </p>
                </div>
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">온도</p>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${getTemperatureColor(myRanking.temperature)}`}
                  >
                    {myRanking.temperature}
                    <span className="ml-0.5 text-sm">°C</span>
                  </p>
                </div>
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">단계</p>
                  <div className="mt-1.5 flex items-center justify-center gap-1.5">
                    <FlameIcon temperature={myRanking.temperature} size={20} />
                    <span
                      className={`truncate text-sm font-bold ${getFlameTier(myRanking.temperature).color}`}
                    >
                      {getFlameTier(myRanking.temperature).name}
                    </span>
                  </div>
                </div>
              </div>
              {myRanking.monthlyChange !== 0 && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  이번 달{' '}
                  <span
                    className={
                      myRanking.monthlyChange > 0
                        ? 'font-semibold text-red-500'
                        : 'font-semibold text-blue-500'
                    }
                  >
                    {myRanking.monthlyChange > 0 ? '▲' : '▼'} {Math.abs(myRanking.monthlyChange)}°C
                  </span>{' '}
                  변화
                </p>
              )}
            </div>
          )}

          {!showSpinner && view === 'monthly' && myMonthlyRanking && (
            <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary/[0.045] p-4 sm:p-5">
              <p className="text-xs font-semibold text-primary">나의 {monthLabel} 기록</p>
              <div className="mt-3 grid grid-cols-3 divide-x divide-border/70">
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">순위</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {myMonthlyRanking.rank}
                    <span className="ml-0.5 text-sm">위</span>
                  </p>
                </div>
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">온도 변화</p>
                  <p
                    className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${getChangeColor(myMonthlyRanking.monthlyChange)}`}
                  >
                    {formatChange(myMonthlyRanking.monthlyChange)}
                    <span className="ml-0.5 text-sm">°C</span>
                  </p>
                </div>
                <div className="px-2 text-center sm:px-4">
                  <p className="text-xs text-muted-foreground">출석</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                    {myMonthlyRanking.attendedDays}
                    <span className="ml-0.5 text-sm">일</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {showSpinner ? (
          <div className="content-surface flex min-h-64 items-center justify-center rounded-[2rem]">
            <LoadingSpinner size="lg" />
          </div>
        ) : view === 'monthly' ? (
          <section className="content-surface overflow-hidden rounded-[2rem]">
            <div className="border-b border-border/60 px-5 py-4 sm:px-7 sm:py-5">
              <h2 className="font-bold tracking-tight text-foreground">{monthLabel} 순위</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                그 달에 예약한 학생만 집계되며, 온도 변화가 같으면 공동 순위입니다.
              </p>
            </div>

            {monthlyRankings.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Trophy className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {monthLabel} 기록이 없습니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {monthlyRankings.map(ranking => {
                  const isMe = ranking.studentId === profileId;
                  return (
                    <article
                      key={ranking.studentId}
                      className={`flex items-center gap-3 px-4 py-4 sm:px-7 ${
                        isMe ? 'bg-primary/[0.055]' : 'hover:bg-muted/35'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tabular-nums ${getRankBadgeClass(ranking.rank)}`}
                      >
                        {ranking.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`truncate text-sm ${
                              isMe ? 'font-bold text-primary' : 'font-semibold text-foreground'
                            }`}
                          >
                            {ranking.name}
                          </p>
                          {isMe && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              나
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {ranking.grade ? `${ranking.grade}학년 ` : ''}
                          {ranking.class ? `${ranking.class}반 · ` : ''}출석 {ranking.attendedDays}
                          일
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-lg font-bold tabular-nums ${getChangeColor(ranking.monthlyChange)}`}
                      >
                        {formatChange(ranking.monthlyChange)}
                        <span className="ml-0.5 text-xs">°C</span>
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="content-surface overflow-hidden rounded-[2rem]">
            <div className="border-b border-border/60 px-5 py-4 sm:px-7 sm:py-5">
              <h2 className="font-bold tracking-tight text-foreground">전체 순위</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                온도가 같은 경우 공동 순위로 표시됩니다.
              </p>
            </div>

            {rankings.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Trophy className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  아직 랭킹 데이터가 없습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/60 md:hidden">
                  {rankings.map(ranking => {
                    const isMe = ranking.studentId === profileId;
                    const tier = getFlameTier(ranking.temperature);

                    return (
                      <article
                        key={ranking.studentId}
                        className={`flex items-center gap-3 px-4 py-4 ${
                          isMe ? 'bg-primary/[0.055]' : ''
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold tabular-nums ${
                            ranking.rank === 1
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : ranking.rank <= 3
                                ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ranking.rank}
                        </span>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/65">
                          <FlameIcon temperature={ranking.temperature} size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`truncate text-sm ${
                                isMe ? 'font-bold text-primary' : 'font-semibold text-foreground'
                              }`}
                            >
                              {ranking.name}
                            </p>
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                나
                              </span>
                            )}
                          </div>
                          <p className={`mt-0.5 truncate text-xs ${tier.color}`}>{tier.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-lg font-bold tabular-nums ${getTemperatureColor(ranking.temperature)}`}
                          >
                            {ranking.temperature}
                            <span className="ml-0.5 text-xs">°C</span>
                          </p>
                          {ranking.monthlyChange !== 0 && (
                            <p
                              className={`mt-0.5 text-[10px] font-semibold ${
                                ranking.monthlyChange > 0 ? 'text-red-500' : 'text-blue-500'
                              }`}
                            >
                              {ranking.monthlyChange > 0 ? '▲' : '▼'}{' '}
                              {Math.abs(ranking.monthlyChange)}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden md:block">
                  <table className="w-full table-fixed">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="w-24 px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                          순위
                        </th>
                        <th className="w-32 px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                          단계
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                          학생
                        </th>
                        <th className="w-40 px-6 py-3.5 text-right text-xs font-semibold text-muted-foreground">
                          열정 온도
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {rankings.map(ranking => {
                        const isMe = ranking.studentId === profileId;
                        const tier = getFlameTier(ranking.temperature);
                        return (
                          <tr
                            key={ranking.studentId}
                            className={`transition-colors ${
                              isMe ? 'bg-primary/[0.055]' : 'hover:bg-muted/35'
                            }`}
                          >
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${
                                  ranking.rank === 1
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : ranking.rank <= 3
                                      ? 'bg-orange-500/10 text-orange-700 dark:text-orange-300'
                                      : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {ranking.rank}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tier.bgColor} ${tier.color}`}
                                title={tier.description}
                              >
                                <FlameIcon temperature={ranking.temperature} size={14} />
                                {tier.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                    isMe
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  <User className="h-4 w-4" />
                                </span>
                                <span
                                  className={`truncate text-sm ${
                                    isMe ? 'font-bold text-primary' : 'font-medium text-foreground'
                                  }`}
                                >
                                  {ranking.name}
                                  {isMe && (
                                    <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                      나
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p
                                className={`text-lg font-bold tabular-nums ${getTemperatureColor(ranking.temperature)}`}
                              >
                                {ranking.temperature}
                                <span className="ml-0.5 text-xs">°C</span>
                              </p>
                              {ranking.monthlyChange !== 0 && (
                                <p
                                  className={`mt-0.5 text-[10px] font-semibold ${
                                    ranking.monthlyChange > 0 ? 'text-red-500' : 'text-blue-500'
                                  }`}
                                >
                                  이번 달 {ranking.monthlyChange > 0 ? '▲' : '▼'}{' '}
                                  {Math.abs(ranking.monthlyChange)}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
};
