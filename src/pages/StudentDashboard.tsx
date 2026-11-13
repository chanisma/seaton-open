import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Armchair,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gift,
  History,
  Info,
  MessageSquarePlus,
  Puzzle,
  Sparkles,
  Star,
  Thermometer,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import {
  getStudentTemperature,
  getMyReservationsByDateRange,
  submitFeedback,
} from '@services/reservation.service';
import { getDisplayBadge, getAllBadges, getAcquiredBadges } from '@services/badge.service';
import { getStudentPoints, getStudyWeek, getWallet } from '@services/points.service';
import { WeeklyStudyRewards } from '@components/student/WeeklyStudyRewards';
import type { StudyWeek } from '@utils/studyRewards';
import { getPuzzleEventsWithProgress } from '@services/puzzle.service';
import type { Badge } from '@project-types/badge.types';
import type { PuzzleEventWithProgress } from '@project-types/puzzle.types';
import type { SeatReservation } from '@project-types/reservation.types';
import { getTemperatureMessage } from '@utils/temperature';
import { formatDateKo } from '@utils/dateHelpers';
import { useStudyRooms } from '@/contexts/StudyRoomContext';

const FEEDBACK_PAGE_SIZE = 5;

export const StudentDashboard = () => {
  const { user } = useAuth();
  const { getStudyRoomById } = useStudyRooms();
  const [temperature, setTemperature] = useState<number>(28.0);
  const [displayBadge, setDisplayBadge] = useState<Badge | null>(null);
  const [reservations, setReservations] = useState<SeatReservation[]>([]);
  const [pointBalance, setPointBalance] = useState<number>(0);
  // 통합 지갑 코인 (null = 아직 못 읽음)
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  // 이번 주 출석 코인 — 자동으로 들어온 코인의 이유 (null = 못 읽음)
  const [studyWeek, setStudyWeek] = useState<StudyWeek | null>(null);
  const [isStudyWeekLoading, setIsStudyWeekLoading] = useState(true);
  const [eligibleBadgeCount, setEligibleBadgeCount] = useState<number>(0);
  const [activePuzzles, setActivePuzzles] = useState<PuzzleEventWithProgress[]>([]);
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTarget, setFeedbackTarget] = useState<SeatReservation | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.profile_id) return;

      // 다른 칸과 따로 읽는다 — 실패해도 이 카드만 비운다
      setIsStudyWeekLoading(true);
      getStudyWeek()
        .then(setStudyWeek)
        .finally(() => setIsStudyWeekLoading(false));

      try {
        const [temp, badge, points, allBadges, acquired, puzzleEvents, wallet] = await Promise.all([
          getStudentTemperature(user.profile_id),
          getDisplayBadge(user.profile_id),
          getStudentPoints(user.profile_id),
          getAllBadges(),
          getAcquiredBadges(user.profile_id),
          getPuzzleEventsWithProgress(user.profile_id),
          getWallet(),
        ]);

        setTemperature(temp);
        setDisplayBadge(badge);
        setPointBalance(points.balance);
        setCoinBalance(wallet?.coins ?? null);

        const acquiredIds = new Set(acquired.map(item => item.badge_id));
        setEligibleBadgeCount(
          allBadges.filter(item => !acquiredIds.has(item.id) && temp >= item.temperature).length
        );
        setActivePuzzles(
          puzzleEvents.filter(event => event.status === 'active' && !event.is_completed)
        );
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }

      try {
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        const data = await getMyReservationsByDateRange(user.profile_id, startDate, endDate);
        setReservations(data);
      } catch (error) {
        console.error('Failed to load reservations:', error);
      }
    };

    loadData();
  }, [user?.profile_id]);

  const pendingFeedback = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);

    return reservations
      .filter(reservation => {
        // 서버 가드: 출석 처리된(is_attended) 예약에만 · 이용일부터 7일 안 · 미래 날짜 불가
        const isCompleted = reservation.is_attended;
        if (!isCompleted || reservation.feedback_rating) return false;
        return new Date(reservation.reservation_date) >= cutoff;
      })
      .sort((a, b) => b.reservation_date.localeCompare(a.reservation_date));
  }, [reservations]);

  const feedbackTotalPages = Math.ceil(pendingFeedback.length / FEEDBACK_PAGE_SIZE);
  const pagedFeedback = pendingFeedback.slice(
    (feedbackPage - 1) * FEEDBACK_PAGE_SIZE,
    feedbackPage * FEEDBACK_PAGE_SIZE
  );

  useEffect(() => {
    const lastPage = Math.max(1, feedbackTotalPages);
    setFeedbackPage(current => Math.min(current, lastPage));
  }, [feedbackTotalPages]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayReservation = reservations.find(
    reservation => reservation.reservation_date === todayKey
  );
  const todayRoom = todayReservation
    ? getStudyRoomById(todayReservation.room_id)?.name || '열람실'
    : null;
  const displayName = user?.name || user?.email || '학생';

  const handleOpenFeedback = (reservation: SeatReservation) => {
    setFeedbackTarget(reservation);
    setFeedbackRating(reservation.feedback_rating || 0);
    setFeedbackNote(reservation.feedback_note || '');
    setFeedbackError(null);
  };

  const handleSaveFeedback = async () => {
    if (!feedbackTarget || feedbackRating === 0) return;

    setIsSavingFeedback(true);
    setFeedbackError(null);
    try {
      await submitFeedback(feedbackTarget.id, feedbackRating, feedbackNote);
      setReservations(previous =>
        previous.map(reservation =>
          reservation.id === feedbackTarget.id
            ? {
                ...reservation,
                feedback_rating: feedbackRating,
                feedback_note: feedbackNote || null,
                feedback_at: new Date().toISOString(),
              }
            : reservation
        )
      );
      setFeedbackTarget(null);
      // 처음 남긴 피드백이면 +1코인(하루 1번) — 지갑을 다시 읽어 보여준다
      getWallet().then(wallet => {
        if (wallet) setCoinBalance(wallet.coins);
      });
    } catch (error) {
      console.error('Failed to save feedback:', error);
      setFeedbackError(error instanceof Error ? error.message : '피드백 저장에 실패했습니다.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const metrics = [
    {
      label: '나의 온도',
      value: `${temperature}°C`,
      description: getTemperatureMessage(temperature),
      icon: <Thermometer className="h-5 w-5" />,
      tone: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
      label: '이번 주 신청',
      value: '0일',
      description: '이번 주 학습 일정',
      icon: <Calendar className="h-5 w-5" />,
      tone: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: '출석률',
      value: '0%',
      description: '꾸준한 참여 기록',
      icon: <CheckCircle2 className="h-5 w-5" />,
      tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <Layout title="학생 대시보드">
      <div className="space-y-5 sm:space-y-6">
        <section className="dashboard-section relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-5 shadow-card sm:p-7 lg:p-9">
          <div
            className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  My study space
                </span>
              </div>

              <h1 className="max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.14] tracking-[-0.04em] text-foreground text-balance [word-break:keep-all]">
                반가워요, {displayName}님.
                <span className="mt-1 block text-muted-foreground">
                  오늘의 몰입을 시작해 볼까요?
                </span>
              </h1>

              <div className="mt-5 flex w-fit max-w-full items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    todayReservation ? 'bg-success' : 'bg-muted-foreground/40'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate font-medium text-foreground">
                  {todayReservation
                    ? `오늘 ${todayRoom} · ${todayReservation.seat_number}번 자리`
                    : '오늘 예약이 아직 없어요'}
                </span>
              </div>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  to="/student/reservations"
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_-14px_hsl(var(--primary))] hover:bg-primary/90"
                >
                  <Armchair className="h-4 w-4" />
                  자리 신청하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/student/my-reservations"
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/80 px-5 text-sm font-semibold text-foreground shadow-card hover:border-primary/25 hover:bg-accent/60"
                >
                  <History className="h-4 w-4" />
                  신청 내역
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="rounded-[1.7rem] border border-primary/10 bg-gradient-to-br from-accent via-card to-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Current temperature
                    </p>
                    <p className="mt-2 text-4xl font-bold tracking-[-0.045em] text-foreground">
                      {temperature}
                      <span className="ml-0.5 text-xl text-muted-foreground">°C</span>
                    </p>
                  </div>
                  {displayBadge ? (
                    <Link
                      to="/student/badges"
                      className="pressable flex h-20 w-20 items-center justify-center rounded-[1.35rem] border border-white/70 bg-white/70 p-2.5 shadow-card dark:border-white/10 dark:bg-white/10"
                      title={`${displayBadge.name} 뱃지 보기`}
                    >
                      <img
                        src={displayBadge.image_path}
                        alt={displayBadge.name}
                        className="h-full w-full object-contain drop-shadow-sm"
                      />
                    </Link>
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-orange-500/10 text-orange-500">
                      <Thermometer className="h-7 w-7" />
                    </span>
                  )}
                </div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-300 via-orange-400 to-rose-400 transition-[width] duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, temperature))}%` }}
                    role="progressbar"
                    aria-label="현재 온도"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={temperature}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {getTemperatureMessage(temperature)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="dashboard-section grid gap-3 sm:grid-cols-3 sm:gap-4"
          style={{ animationDelay: '60ms' }}
          aria-label="학습 현황"
        >
          {metrics.map(metric => (
            <Card key={metric.label} padding="md" className="min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-[-0.035em] text-foreground">
                    {metric.value}
                  </p>
                </div>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] ${metric.tone}`}
                >
                  {metric.icon}
                </span>
              </div>
              <p className="mt-4 truncate border-t border-border/60 pt-3 text-sm text-muted-foreground">
                {metric.description}
              </p>
            </Card>
          ))}
        </section>

        <section
          className="dashboard-section grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(19rem,0.8fr)]"
          style={{ animationDelay: '120ms' }}
        >
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <MessageSquarePlus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-[-0.015em] text-foreground">자기 평가</h2>
                  <p className="text-sm text-muted-foreground">최근 출석 경험을 기록해 주세요</p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                미작성 {pendingFeedback.length}건
              </span>
            </div>

            {pagedFeedback.length > 0 ? (
              <div className="divide-y divide-border/60">
                {pagedFeedback.map(reservation => (
                  <div
                    key={reservation.id}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:px-6"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Armchair className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {getStudyRoomById(reservation.room_id)?.name || '열람실'} ·{' '}
                        {reservation.seat_number}번
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateKo(reservation.reservation_date)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => handleOpenFeedback(reservation)}
                    >
                      <Star className="h-3.5 w-3.5" />
                      평가
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">모든 평가를 작성했어요</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  새로운 평가가 생기면 알려드릴게요.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-5 py-3 sm:px-6">
              <Link
                to="/student/my-reservations"
                className="pressable -ml-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              >
                전체 내역
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              {feedbackTotalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="pressable flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                    disabled={feedbackPage === 1}
                    onClick={() => setFeedbackPage(page => page - 1)}
                    aria-label="이전 평가 목록"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
                    {feedbackPage} / {feedbackTotalPages}
                  </span>
                  <button
                    type="button"
                    className="pressable flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                    disabled={feedbackPage === feedbackTotalPages}
                    onClick={() => setFeedbackPage(page => page + 1)}
                    aria-label="다음 평가 목록"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>

          <div className="min-w-0 space-y-5">
            <Card padding="none" className="overflow-hidden">
              <div className="border-b border-border/70 p-5 sm:p-6">
                <h2 className="font-semibold tracking-[-0.015em] text-foreground">학습 보상</h2>
                <p className="mt-1 text-sm text-muted-foreground">꾸준함이 만든 작은 성취예요</p>
              </div>

              <div className="p-2">
                <div className="flex items-center gap-3 rounded-2xl p-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Coins className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">보유 코인</p>
                    <p className="mt-0.5 text-lg font-bold tracking-[-0.025em] text-foreground">
                      {coinBalance === null ? '–' : `${coinBalance.toLocaleString()}코인`}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      이전 포인트 {pointBalance.toLocaleString()}P (퍼즐 전용)
                    </p>
                  </div>
                </div>

                <Link
                  to="/student/badges"
                  className="pressable flex items-center gap-3 rounded-2xl p-3.5 hover:bg-muted/55"
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Gift className="h-5 w-5" />
                    {eligibleBadgeCount > 0 && (
                      <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-rose-500" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">획득 가능한 뱃지</p>
                    <p className="mt-0.5 text-lg font-bold tracking-[-0.025em] text-foreground">
                      {eligibleBadgeCount}개
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                <Link
                  to="/student/puzzle"
                  className="pressable flex items-center gap-3 rounded-2xl p-3.5 hover:bg-muted/55"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Puzzle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">참여 가능한 퍼즐</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {activePuzzles.length > 0
                        ? `${activePuzzles.length}개 · ${activePuzzles[0].title}`
                        : '진행 중인 이벤트 없음'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </Card>

            <WeeklyStudyRewards week={studyWeek} isLoading={isStudyWeekLoading} />
          </div>
        </section>

        <section
          className="dashboard-section rounded-2xl border border-blue-500/15 bg-blue-500/[0.055] p-5 sm:p-6"
          style={{ animationDelay: '180ms' }}
          aria-labelledby="usage-guide-title"
        >
          <div className="flex gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Info className="h-5 w-5" />
            </span>
            <div>
              <h2 id="usage-guide-title" className="text-sm font-semibold text-foreground">
                이용 전 확인해 주세요
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                <li>자리를 사용한 뒤에는 개인 물품과 주변을 정리해 주세요.</li>
                <li>신청 후 무단 결석하면 이용에 제한이 생길 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <Modal
        isOpen={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        title="자기 평가 작성"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFeedbackTarget(null)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveFeedback}
              disabled={feedbackRating === 0 || isSavingFeedback}
              isLoading={isSavingFeedback}
            >
              저장
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {feedbackTarget && (
            <div className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm text-muted-foreground">
              {formatDateKo(feedbackTarget.reservation_date)} ·{' '}
              {getStudyRoomById(feedbackTarget.room_id)?.name} · {feedbackTarget.seat_number}번
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground">평가</label>
            <p className="mt-1 text-sm text-muted-foreground">이용 경험은 어떠셨나요?</p>
            <div className="mt-3 flex gap-1" role="group" aria-label="별점 선택">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className="pressable flex h-11 w-11 items-center justify-center rounded-xl hover:bg-amber-500/10"
                  aria-label={`${star}점`}
                  aria-pressed={feedbackRating === star}
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= feedbackRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/35'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-note" className="block text-sm font-semibold text-foreground">
              비고 <span className="font-normal text-muted-foreground">(선택)</span>
            </label>
            <textarea
              id="feedback-note"
              value={feedbackNote}
              onChange={event => setFeedbackNote(event.target.value)}
              placeholder="추가 의견을 작성해 주세요."
              rows={4}
              maxLength={500}
              className="mt-2 w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground shadow-card outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring/25"
            />
            <p className="mt-1.5 text-right text-xs text-muted-foreground">
              {feedbackNote.length}/500
            </p>
          </div>

          <p className="rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            처음 남기는 평가는 <strong>+1코인</strong>이에요 (하루 1번 · 출석한 날부터 7일 안). 남긴
            평가는 고칠 수 있지만 지울 수는 없어요.
          </p>

          {feedbackError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {feedbackError}
            </p>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
