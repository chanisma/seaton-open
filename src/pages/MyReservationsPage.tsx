import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ReservationCalendar } from '@components/student/ReservationCalendar';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { Select } from '@components/common/Select';
import { StatCard } from '@components/common/StatCard';
import { getMyReservationHistory, submitFeedback } from '@services/reservation.service';
import { formatDateKo } from '@utils/dateHelpers';
import { SeatReservation } from '@project-types/reservation.types';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import { CalendarX2, CheckCircle2, CircleGauge, ClipboardList, Star } from 'lucide-react';

const isPastReservation = (dateString: string): boolean => {
  const reservationDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return reservationDate < today;
};

const ReservationStatusBadge = ({ reservation }: { reservation: SeatReservation }) => {
  if (reservation.attendance_status === 'excused') {
    return (
      <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
        인정출석
      </span>
    );
  }

  if (reservation.is_attended) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        출석
      </span>
    );
  }

  if (isPastReservation(reservation.reservation_date)) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
        결석
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      예정
    </span>
  );
};

export const MyReservationsPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<SeatReservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getStudyRoomById } = useStudyRooms();
  const profileId = user?.profile_id || '';

  // 피드백 모달 상태
  const [feedbackTarget, setFeedbackTarget] = useState<SeatReservation | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // 상세 내역 필터 및 페이지네이션
  const [filterMonth, setFilterMonth] = useState<string>(''); // 'YYYY-MM' 또는 '' (전체)
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  // 교시 이름 조회 헬퍼
  const getPeriodName = (reservation: SeatReservation): string | null => {
    if (reservation.period_id == null || reservation.period_id === 0) return null;
    const room = getStudyRoomById(reservation.room_id);
    const periods = room?.operating_periods;
    if (!periods) return `${reservation.period_id}교시`;
    const period = periods.find(p => p.id === reservation.period_id);
    return period?.name || `${reservation.period_id}교시`;
  };

  // 전체 예약 내역 로드
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 전체 히스토리 조회
        const data = await getMyReservationHistory(profileId);
        setReservations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '예약 내역을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (profileId) {
      loadReservations();
    }
  }, [profileId]); // selectedDate 의존성 제거 (전체 조회이므로)

  // 통계 계산
  const total = reservations.length;
  const attended = reservations.filter(
    r => r.is_attended || r.attendance_status === 'excused'
  ).length;
  const absent = reservations.filter(r => {
    return (
      !r.is_attended && r.attendance_status !== 'excused' && isPastReservation(r.reservation_date)
    );
  }).length;
  const pending = reservations.filter(r => {
    return (
      !r.is_attended && r.attendance_status !== 'excused' && !isPastReservation(r.reservation_date)
    );
  }).length;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  // 상세 내역: 날짜 내림차순 정렬 + 월별 필터
  const sortedReservations = useMemo(
    () =>
      [...reservations].sort((a, b) => {
        const dateCompare = b.reservation_date.localeCompare(a.reservation_date);
        if (dateCompare !== 0) return dateCompare;
        const nameA = getStudyRoomById(a.room_id)?.name || '';
        const nameB = getStudyRoomById(b.room_id)?.name || '';
        const nameCompare = nameA.localeCompare(nameB, 'ko');
        if (nameCompare !== 0) return nameCompare;
        return (a.period_id || 0) - (b.period_id || 0);
      }),
    [reservations, getStudyRoomById]
  );

  const filteredReservations = useMemo(() => {
    if (!filterMonth) return sortedReservations;
    return sortedReservations.filter(r => r.reservation_date.startsWith(filterMonth));
  }, [sortedReservations, filterMonth]);

  // 월 옵션 목록 (데이터에 있는 월만)
  const monthOptions = useMemo(() => {
    const months = new Set(reservations.map(r => r.reservation_date.slice(0, 7)));
    return [...months].sort();
  }, [reservations]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredReservations.length / PAGE_SIZE);
  const pagedReservations = useMemo(
    () => filteredReservations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredReservations, currentPage]
  );

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth]);

  // 피드백 모달 열기
  const handleOpenFeedback = (reservation: SeatReservation) => {
    setFeedbackTarget(reservation);
    setFeedbackRating(reservation.feedback_rating || 0);
    setFeedbackNote(reservation.feedback_note || '');
  };

  // 피드백 저장
  const handleSaveFeedback = async () => {
    if (!feedbackTarget || feedbackRating === 0) return;
    setIsSavingFeedback(true);
    try {
      await submitFeedback(feedbackTarget.id, feedbackRating, feedbackNote);
      // 로컬 상태 업데이트
      setReservations(prev =>
        prev.map(r =>
          r.id === feedbackTarget.id
            ? {
                ...r,
                feedback_rating: feedbackRating,
                feedback_note: feedbackNote || null,
                feedback_at: new Date().toISOString(),
              }
            : r
        )
      );
      setFeedbackTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '피드백 저장에 실패했습니다.');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const stats = {
    total,
    attended,
    absent,
    pending,
    attendanceRate,
  };

  if (!user || (user.type !== 'student' && user.type !== 'admin')) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">학생만 접근할 수 있습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="내 신청 내역">
      <h1 className="sr-only">내 신청 내역</h1>
      <div className="space-y-5 sm:space-y-6">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="content-surface flex min-h-64 items-center justify-center rounded-[2rem]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="총 신청"
                value={`${stats.total}건`}
                hint={`예정 ${stats.pending}건`}
                icon={<ClipboardList className="h-5 w-5" />}
              />
              <StatCard
                label="출석"
                value={`${stats.attended}건`}
                hint="인정출석 포함"
                tone="success"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <StatCard
                label="결석"
                value={`${stats.absent}건`}
                hint="지난 신청 기준"
                tone="danger"
                icon={<CalendarX2 className="h-5 w-5" />}
              />
              <StatCard
                label="출석률"
                value={`${stats.attendanceRate}%`}
                hint="전체 신청 기준"
                tone="info"
                icon={<CircleGauge className="h-5 w-5" />}
              />
            </div>

            <section className="content-surface rounded-[2rem] p-4 sm:p-7">
              <div className="mb-5">
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  주간 신청 현황
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  날짜별 자리와 출석 상태를 한눈에 확인하세요.
                </p>
              </div>
              <ReservationCalendar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                reservations={reservations}
                operatingDays={[0, 1, 2, 3, 4, 5, 6]}
                onFeedback={handleOpenFeedback}
              />
            </section>

            <section className="content-surface overflow-hidden rounded-[2rem]">
              <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    상세 내역
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    신청 기록과 열람실 평가를 확인할 수 있어요.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    aria-label="조회 월"
                    value={filterMonth}
                    onChange={event => setFilterMonth(event.target.value)}
                    options={[
                      { value: '', label: '전체 기간' },
                      ...monthOptions.map(month => ({
                        value: month,
                        label: `${month.replace('-', '년 ')}월`,
                      })),
                    ]}
                    className="min-w-36"
                  />
                  <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                    {filteredReservations.length}건
                  </span>
                </div>
              </div>

              {filteredReservations.length > 0 ? (
                <>
                  <div className="divide-y divide-border/60 md:hidden">
                    {pagedReservations.map(reservation => {
                      const reservationDate = new Date(`${reservation.reservation_date}T00:00:00`);
                      const dateObj = reservationDate;
                      const periodName = getPeriodName(reservation);
                      const roomName = getStudyRoomById(reservation.room_id)?.name || '-';
                      const isEligible = reservation.is_attended && !reservation.feedback_rating;
                      const cutoff = new Date();
                      cutoff.setDate(cutoff.getDate() - 7);
                      cutoff.setHours(0, 0, 0, 0);
                      const withinDeadline = reservationDate >= cutoff;

                      return (
                        <article key={reservation.id} className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-muted/70">
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                {dateObj.getMonth() + 1}월
                              </span>
                              <span className="text-base font-bold tabular-nums text-foreground">
                                {dateObj.getDate()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-foreground">
                                    {roomName}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {reservation.seat_number}번 자리
                                    {periodName ? ` · ${periodName}` : ''}
                                  </p>
                                </div>
                                <ReservationStatusBadge reservation={reservation} />
                              </div>

                              <div className="mt-3 flex min-h-7 items-center justify-between gap-3">
                                {reservation.feedback_rating ? (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 rounded-lg text-xs font-medium text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 dark:text-amber-400"
                                    onClick={() => {
                                      if (reservation.feedback_note) {
                                        setExpandedNoteId(previous =>
                                          previous === reservation.id ? null : reservation.id
                                        );
                                      }
                                    }}
                                  >
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    {reservation.feedback_rating}.0
                                    {reservation.feedback_note && (
                                      <span className="text-muted-foreground">
                                        {expandedNoteId === reservation.id ? '접기' : '메모 보기'}
                                      </span>
                                    )}
                                  </button>
                                ) : isEligible && withinDeadline ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFeedback(reservation)}
                                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                  >
                                    열람실 평가
                                  </button>
                                ) : isEligible ? (
                                  <span className="text-xs text-muted-foreground">
                                    평가 기한 만료
                                  </span>
                                ) : (
                                  <span />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatDateKo(reservation.reservation_date)}
                                </span>
                              </div>

                              {expandedNoteId === reservation.id && reservation.feedback_note && (
                                <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
                                  {reservation.feedback_note}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full table-fixed">
                      <thead className="bg-muted/55">
                        <tr>
                          <th className="w-[20%] px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            날짜
                          </th>
                          <th className="w-[18%] px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            열람실
                          </th>
                          <th className="w-[12%] px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            자리 · 교시
                          </th>
                          <th className="w-[12%] px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            출석
                          </th>
                          <th className="w-[14%] px-4 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            평가
                          </th>
                          <th className="w-[24%] px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground">
                            비고
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {pagedReservations.map(reservation => {
                          const reservationDate = new Date(
                            `${reservation.reservation_date}T00:00:00`
                          );
                          const isEligible =
                            reservation.is_attended && !reservation.feedback_rating;
                          const cutoff = new Date();
                          cutoff.setDate(cutoff.getDate() - 7);
                          cutoff.setHours(0, 0, 0, 0);
                          const withinDeadline = reservationDate >= cutoff;

                          return (
                            <tr
                              key={reservation.id}
                              className="transition-colors hover:bg-muted/35"
                            >
                              <td className="px-5 py-4 text-sm font-medium text-foreground">
                                {formatDateKo(reservation.reservation_date)}
                              </td>
                              <td className="truncate px-5 py-4 text-sm text-foreground">
                                {getStudyRoomById(reservation.room_id)?.name || '-'}
                              </td>
                              <td className="px-4 py-4 text-sm text-muted-foreground">
                                <span>{reservation.seat_number}번</span>
                                {getPeriodName(reservation) && (
                                  <span className="block text-xs">
                                    {getPeriodName(reservation)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <ReservationStatusBadge reservation={reservation} />
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {reservation.feedback_rating ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                    <Star className="h-4 w-4 fill-current" />
                                    {reservation.feedback_rating}.0
                                  </span>
                                ) : isEligible && withinDeadline ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFeedback(reservation)}
                                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                                  >
                                    평가하기
                                  </button>
                                ) : isEligible ? (
                                  <span className="text-xs text-muted-foreground">기한 만료</span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-sm text-muted-foreground">
                                <span className="block truncate">
                                  {reservation.feedback_note || '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center px-5 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <CalendarX2 className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    신청 내역이 없습니다.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    다른 기간을 선택하거나 새로운 자리를 신청해 보세요.
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <nav
                  aria-label="신청 내역 페이지"
                  className="flex items-center justify-center gap-2 border-t border-border/60 px-4 py-4"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="min-h-9 rounded-xl border border-input px-3 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                  >
                    이전
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(
                      page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    )
                    .reduce<(number | string)[]>((items, page, index, pages) => {
                      if (index > 0 && page - (pages[index - 1] as number) > 1) {
                        items.push('...');
                      }
                      items.push(page);
                      return items;
                    }, [])
                    .map((item, index) =>
                      typeof item === 'string' ? (
                        <span key={`dot-${index}`} className="px-1 text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          aria-current={currentPage === item ? 'page' : undefined}
                          onClick={() => setCurrentPage(item)}
                          className={`h-9 min-w-9 rounded-xl border px-2 text-sm font-semibold transition-colors ${
                            currentPage === item
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-input hover:bg-muted'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-9 rounded-xl border border-input px-3 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                  >
                    다음
                  </button>
                </nav>
              )}
            </section>
          </>
        )}
      </div>
      {/* 피드백 모달 */}
      <Modal
        isOpen={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        title="피드백 작성"
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
        <div className="space-y-4">
          {feedbackTarget && (
            <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              {formatDateKo(feedbackTarget.reservation_date)} ·{' '}
              {getStudyRoomById(feedbackTarget.room_id)?.name} · {feedbackTarget.seat_number}번
            </div>
          )}

          {/* 별점 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">평가</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star}점`}
                  aria-pressed={star <= feedbackRating}
                  onClick={() => setFeedbackRating(star)}
                  className="rounded-xl p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= feedbackRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 비고란 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">비고 (선택)</label>
            <textarea
              value={feedbackNote}
              onChange={e => setFeedbackNote(e.target.value)}
              placeholder="추가 의견을 작성해주세요..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-3 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/25"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {feedbackNote.length}/500
            </p>
          </div>

          <p className="rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            처음 남기는 평가는 <strong>+1코인</strong>이에요 (하루 1번 · 출석한 날부터 7일 안). 남긴
            평가는 고칠 수 있지만 지울 수는 없어요.
          </p>
        </div>
      </Modal>
    </Layout>
  );
};
