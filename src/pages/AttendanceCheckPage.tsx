import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Select } from '@components/common/Select';
import { AttendanceSeat } from '@components/teacher/AttendanceSeat';
import { RoomSwipeIndicator } from '@components/common/RoomSwipeIndicator';
import {
  getReservationsByDateAndRoomWithProfiles,
  getRoomReservationCounts,
  checkAttendance,
  uncheckAttendance,
  checkExcusedAttendance,
  checkSupplementAttendance,
  getTemperaturesForStudents,
  getStudentSnums,
} from '@services/reservation.service';
import { refreshTemperatureRanking } from '@services/statistics.service';
import { SeatReservation, StudyRoom } from '@/types/reservation.types';
import { format, addDays } from 'date-fns';
import { safeParseDateString } from '@utils/dateHelpers';
import {
  Users,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowUpDown,
  Clock3,
} from 'lucide-react';

export const AttendanceCheckPage = () => {
  const { user } = useAuth();
  const { studyRooms: allRooms, isLoading: isRoomsLoading } = useStudyRooms();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [reservations, setReservations] = useState<SeatReservation[]>([]);
  const [studentTemperatures, setStudentTemperatures] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingSeats, setUpdatingSeats] = useState<Set<string>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [snums, setSnums] = useState<Record<string, string>>({});
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(0); // 0: All Day or Default
  // 드롭다운 및 통계 표시용 경량 데이터
  const [roomStats, setRoomStats] = useState<
    Record<
      string,
      {
        total: number;
        attended: number;
        uniqueSeats: number;
        byPeriod: Record<number, { total: number; attended: number }>;
      }
    >
  >({});

  // 초기 로딩 시 첫 번째 열람실 선택
  useEffect(() => {
    if (allRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(allRooms[0]);
    }
  }, [allRooms, selectedRoom]);

  // 데이터 조회 함수 (예약 및 통계)
  const fetchData = useCallback(
    async (showLoading = true) => {
      if (!selectedRoom) return;

      try {
        if (showLoading) setIsLoading(true);
        setError(null);

        const [reservationsData, roomStatsData] = await Promise.all([
          getReservationsByDateAndRoomWithProfiles(selectedRoom.id, selectedDate),
          getRoomReservationCounts(selectedDate),
        ]);

        setReservations(reservationsData);
        setRoomStats(roomStatsData);

        // 온도 및 학번 데이터 로드 (현재 열람실 학생만)
        const studentIds = reservationsData.map(r => r.student_id);
        const studentsForSnum = reservationsData
          .filter(r => r.profiles?.email)
          .map(r => ({ id: r.student_id, email: r.profiles!.email! }));

        const [temps, snumData] = await Promise.all([
          studentIds.length > 0 ? getTemperaturesForStudents(studentIds) : Promise.resolve({}),
          studentsForSnum.length > 0 ? getStudentSnums(studentsForSnum) : Promise.resolve({}),
        ]);

        setStudentTemperatures(temps);
        setSnums(snumData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [selectedDate, selectedRoom]
  );

  // 데이터 로드 Effect (날짜 또는 열람실 변경 시)
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // 방 변경 시 교시 초기화 및 자동 선택
  useEffect(() => {
    if (
      selectedRoom?.use_periods &&
      selectedRoom.operating_periods &&
      selectedRoom.operating_periods.length > 0
    ) {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const periods = selectedRoom.operating_periods;

      // 1. 현재 시간에 해당하는 교시 찾기
      const currentPeriod = periods.find(
        p => currentTime >= p.start_time && currentTime <= p.end_time
      );

      if (currentPeriod) {
        setSelectedPeriodId(currentPeriod.id);
      } else {
        // 2. 현재 시간이 교시 시작 전이면 가장 가까운 미래 교시 찾기
        const sortedPeriods = [...periods].sort((a, b) => a.start_time.localeCompare(b.start_time));
        const nextPeriod = sortedPeriods.find(p => currentTime < p.start_time);

        if (nextPeriod) {
          setSelectedPeriodId(nextPeriod.id);
        } else {
          // 3. 모든 교시가 지났거나 찾을 수 없으면 첫 번째 교시 선택
          setSelectedPeriodId(sortedPeriods[0].id);
        }
      }
    } else {
      setSelectedPeriodId(0);
    }
  }, [selectedRoom]);

  // 출석 토글
  const handleToggleAttendance = async (reservation: SeatReservation) => {
    if (!user || !selectedRoom) return;

    const seatKey = `${reservation.room_id}-${reservation.seat_number}`;
    setUpdatingSeats(prev => new Set(prev).add(seatKey));

    try {
      if (reservation.is_attended) {
        await uncheckAttendance(reservation.id);
      } else {
        await checkAttendance(reservation.id, user.profile_id);
      }

      // 랭킹 데이터 갱신 (비동기, 결과 기다리지 않음)
      refreshTemperatureRanking().catch(err => console.error('Ranking refresh failed:', err));

      // 데이터 새로고침 (로딩 표시 없이)
      await fetchData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 체크에 실패했습니다.');
    } finally {
      setUpdatingSeats(prev => {
        const newSet = new Set(prev);
        newSet.delete(seatKey);
        return newSet;
      });
    }
  };

  // 인정출석 처리
  const handleExcusedAttendance = async (reservation: SeatReservation) => {
    if (!user || !selectedRoom) return;

    const seatKey = `${reservation.room_id}-${reservation.seat_number}`;
    setUpdatingSeats(prev => new Set(prev).add(seatKey));

    try {
      await checkExcusedAttendance(reservation.id, user.profile_id);

      // 랭킹 데이터 갱신 (비동기, 결과 기다리지 않음)
      refreshTemperatureRanking().catch(err => console.error('Ranking refresh failed:', err));

      // 데이터 새로고침 (로딩 표시 없이)
      await fetchData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인정출석 처리에 실패했습니다.');
    } finally {
      setUpdatingSeats(prev => {
        const newSet = new Set(prev);
        newSet.delete(seatKey);
        return newSet;
      });
    }
  };

  // 보완 처리 (순공 열람실 전용)
  const handleSupplementAttendance = async (reservation: SeatReservation) => {
    if (!user || !selectedRoom) return;

    const seatKey = `${reservation.room_id}-${reservation.seat_number}`;
    setUpdatingSeats(prev => new Set(prev).add(seatKey));

    try {
      await checkSupplementAttendance(reservation.id, user.profile_id);
      refreshTemperatureRanking().catch(err => console.error('Ranking refresh failed:', err));
      await fetchData(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '보완 처리에 실패했습니다.');
    } finally {
      setUpdatingSeats(prev => {
        const newSet = new Set(prev);
        newSet.delete(seatKey);
        return newSet;
      });
    }
  };

  // 벌크 출석 기능은 현재 비활성화 (UI 주석 처리됨)

  // 현재 열람실과 교시에 실제로 표시되는 예약만 사용합니다.
  const roomReservations = useMemo(() => {
    if (!selectedRoom) return [];

    return reservations.filter(reservation => {
      if (reservation.room_id !== selectedRoom.id) return false;

      if (selectedRoom.use_periods) {
        return reservation.period_id === selectedPeriodId || reservation.period_id === 0;
      }

      return true;
    });
  }, [reservations, selectedPeriodId, selectedRoom]);

  const reservationsBySeat = useMemo(
    () =>
      new Map(roomReservations.map(reservation => [reservation.seat_number, reservation] as const)),
    [roomReservations]
  );

  const getReservationBySeat = (seatNumber: string): SeatReservation | undefined =>
    reservationsBySeat.get(seatNumber);

  // 통계 계산 (단일 패스 최적화)
  const stats = useMemo(() => {
    const initial = {
      total: 0,
      attended: 0,
      excused: 0,
      notAttended: 0,
      attendanceRate: 0,
      byGrade: {
        1: { total: 0, attended: 0, excused: 0, notAttended: 0 },
        2: { total: 0, attended: 0, excused: 0, notAttended: 0 },
        3: { total: 0, attended: 0, excused: 0, notAttended: 0 },
      } as Record<
        1 | 2 | 3,
        { total: number; attended: number; excused: number; notAttended: number }
      >,
    };

    const result = roomReservations.reduce((acc, r) => {
      acc.total++;
      if (r.attendance_status === 'excused') {
        acc.attended++;
        acc.excused++;
      } else if (r.is_attended) {
        acc.attended++;
      } else {
        acc.notAttended++;
      }

      const grade = r.profiles?.grade as 1 | 2 | 3;
      if (grade && acc.byGrade[grade]) {
        acc.byGrade[grade].total++;
        if (r.attendance_status === 'excused') {
          acc.byGrade[grade].attended++;
          acc.byGrade[grade].excused++;
        } else if (r.is_attended) {
          acc.byGrade[grade].attended++;
        } else {
          acc.byGrade[grade].notAttended++;
        }
      }

      return acc;
    }, initial);

    result.attendanceRate =
      result.total > 0 ? Math.round((result.attended / result.total) * 100) : 0;

    return result;
  }, [roomReservations]);

  const selectedPeriod = selectedRoom?.operating_periods?.find(
    period => period.id === selectedPeriodId
  );

  useEffect(() => {
    setSelectedSeatId(null);
  }, [selectedDate, selectedPeriodId, selectedRoom]);

  // Date Swipe Logic
  const [dateTouchStart, setDateTouchStart] = useState<number | null>(null);
  const [dateTouchEnd, setDateTouchEnd] = useState<number | null>(null);
  const [dateSwipeDirection, setDateSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDateThresholdReached, setIsDateThresholdReached] = useState(false);

  // Room Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

  if (!user || (user.type !== 'teacher' && user.type !== 'admin')) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl text-center max-w-md">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">접근 권한 없음</h2>
            <p className="text-muted-foreground">교사 계정으로만 접근할 수 있습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const onDateTouchStart = (e: React.TouchEvent) => {
    setDateTouchEnd(null);
    setDateTouchStart(e.targetTouches[0].clientX);
    setDateSwipeDirection(null);
    setIsDateThresholdReached(false);
  };

  const onDateTouchMove = (e: React.TouchEvent) => {
    if (!dateTouchStart) return;
    const currentX = e.targetTouches[0].clientX;
    setDateTouchEnd(currentX);

    const distance = dateTouchStart - currentX;
    const absDistance = Math.abs(distance);
    const threshold = 50;

    if (absDistance >= threshold) {
      setIsDateThresholdReached(true);
      setDateSwipeDirection(distance > 0 ? 'left' : 'right');
    } else if (absDistance >= 10) {
      setIsDateThresholdReached(false);
      setDateSwipeDirection(distance > 0 ? 'left' : 'right');
    } else {
      setDateSwipeDirection(null);
      setIsDateThresholdReached(false);
    }
  };

  const onDateTouchEnd = () => {
    if (!dateTouchStart || !dateTouchEnd) {
      setDateSwipeDirection(null);
      setIsDateThresholdReached(false);
      return;
    }
    const distance = dateTouchStart - dateTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Next Day
      setSelectedDate(prev => addDays(prev, 1));
    } else if (isRightSwipe) {
      // Previous Day
      setSelectedDate(prev => addDays(prev, -1));
    }

    setDateTouchStart(null);
    setDateTouchEnd(null);
    setDateSwipeDirection(null);
    setIsDateThresholdReached(false);
  };

  const getNextDateText = (direction: 'left' | 'right') => {
    const nextDate = addDays(selectedDate, direction === 'left' ? 1 : -1);
    return format(nextDate, 'MM/dd');
  };

  const minSwipeDistance = 100; // 민감도 낮춤 (50 -> 100)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeDirection(null);
    setIsThresholdReached(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);

    const distance = touchStart - currentX;
    const absDistance = Math.abs(distance);

    // 인계점 도달 여부 확인
    if (absDistance >= minSwipeDistance && allRooms.length > 1) {
      // 임계점을 넘는 순간 한 번만 짧은 햅틱 (지원 기기만)
      if (!isThresholdReached && 'vibrate' in navigator) navigator.vibrate(10);
      setIsThresholdReached(true);
      setSwipeDirection(distance > 0 ? 'left' : 'right');
    } else if (absDistance >= 30) {
      // 인계점 미도달 상태에서 방향만 표시
      setIsThresholdReached(false);
      setSwipeDirection(distance > 0 ? 'left' : 'right');
    } else {
      setSwipeDirection(null);
      setIsThresholdReached(false);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeDirection(null);
      setIsThresholdReached(false);
      return;
    }
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      if (selectedRoom && allRooms.length > 1) {
        const currentIndex = allRooms.findIndex(r => r.id === selectedRoom.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (isLeftSwipe) {
          nextIndex = (currentIndex + 1) % allRooms.length;
        } else {
          nextIndex = (currentIndex - 1 + allRooms.length) % allRooms.length;
        }
        setSelectedRoom(allRooms[nextIndex]);
      }
    }

    resetRoomSwipe();
  };

  const resetRoomSwipe = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDirection(null);
    setIsThresholdReached(false);
  };

  // 스와이프 중 안내할 열람실과 진행도 (손가락이 왼쪽으로 가면 다음, 오른쪽이면 이전 열람실)
  const roomSwipeTarget = (() => {
    if (!swipeDirection || !selectedRoom || allRooms.length <= 1) return null;
    if (touchStart === null || touchEnd === null) return null;
    const currentIndex = allRooms.findIndex(r => r.id === selectedRoom.id);
    if (currentIndex === -1) return null;
    const nextIndex =
      swipeDirection === 'left'
        ? (currentIndex + 1) % allRooms.length
        : (currentIndex - 1 + allRooms.length) % allRooms.length;
    return {
      edge: swipeDirection === 'left' ? ('right' as const) : ('left' as const),
      progress: Math.abs(touchStart - touchEnd) / minSwipeDistance,
      room: allRooms[nextIndex],
      position: nextIndex + 1,
    };
  })();

  return (
    <Layout title="출석 체크">
      <h1 className="sr-only">출석 체크</h1>

      <div className="space-y-5 sm:space-y-6">
        <section
          aria-labelledby="attendance-control-title"
          className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card"
        >
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.7fr)] lg:items-end">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Attendance control
                </p>
                <h2
                  id="attendance-control-title"
                  className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground"
                >
                  출석 기준 선택
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.2fr)]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  날짜
                </span>
                <div
                  className="relative touch-pan-y overflow-hidden rounded-xl"
                  onTouchStart={onDateTouchStart}
                  onTouchMove={onDateTouchMove}
                  onTouchEnd={onDateTouchEnd}
                >
                  <Calendar
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="date"
                    aria-label="출석 날짜"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={event => {
                      const date = safeParseDateString(event.target.value);
                      if (date) setSelectedDate(date);
                    }}
                    className="min-h-11 w-full rounded-xl border border-input bg-card/90 py-2.5 pl-10 pr-3.5 text-sm font-medium text-foreground shadow-card outline-none transition-[border-color,box-shadow] hover:border-primary/30 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/25"
                  />

                  {dateSwipeDirection === 'right' && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 left-0 z-20 flex w-16 flex-col items-center justify-center rounded-l-xl transition-all duration-150 ${
                        isDateThresholdReached
                          ? 'bg-primary/90 text-primary-foreground backdrop-blur-sm'
                          : 'bg-foreground/20 text-background/70'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                      <span className="mt-0.5 text-[10px] font-medium leading-tight">
                        {getNextDateText('right')}
                      </span>
                    </div>
                  )}

                  {dateSwipeDirection === 'left' && (
                    <div
                      className={`pointer-events-none absolute inset-y-0 right-0 z-20 flex w-16 flex-col items-center justify-center rounded-r-xl transition-all duration-150 ${
                        isDateThresholdReached
                          ? 'bg-primary/90 text-primary-foreground backdrop-blur-sm'
                          : 'bg-foreground/20 text-background/70'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      <span className="mt-0.5 text-[10px] font-medium leading-tight">
                        {getNextDateText('left')}
                      </span>
                    </div>
                  )}
                </div>
              </label>

              <Select
                label="열람실"
                aria-label="출석 열람실"
                options={[...allRooms]
                  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                  .map(room => {
                    const roomStat = roomStats[room.id];
                    let label = room.name;

                    if (roomStat) {
                      if (room.use_periods && selectedPeriodId !== 0) {
                        const periodStat = roomStat.byPeriod[selectedPeriodId] || {
                          total: 0,
                          attended: 0,
                        };
                        const allDayStat = roomStat.byPeriod[0] || { total: 0, attended: 0 };
                        label += ` · ${periodStat.attended + allDayStat.attended}/${periodStat.total + allDayStat.total}`;
                      } else {
                        label += ` · ${roomStat.attended}/${roomStat.total}`;
                      }
                    } else {
                      label += ' · 0/0';
                    }

                    return { value: room.id, label };
                  })}
                value={selectedRoom?.id || ''}
                onChange={event => {
                  const room = allRooms.find(item => item.id === event.target.value);
                  if (room) setSelectedRoom(room);
                }}
                fullWidth
              />
            </div>
          </div>

          {selectedRoom?.use_periods &&
            selectedRoom.operating_periods &&
            selectedRoom.operating_periods.length > 0 && (
              <div className="border-t border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  <span>교시 선택</span>
                </div>
                <div className="grid select-none grid-cols-4 gap-1.5 sm:-mx-6 sm:flex sm:gap-2 sm:overflow-x-auto sm:px-6 sm:pb-1 sm:scrollbar-hide">
                  {selectedRoom.operating_periods.map(period => {
                    const isSelected = selectedPeriodId === period.id;

                    return (
                      <button
                        key={period.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPeriodId(period.id)}
                        className={`min-w-0 touch-manipulation rounded-xl border px-1.5 py-2 text-center outline-none transition-[border-color,background-color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.97] sm:min-w-[104px] sm:shrink-0 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-left sm:active:scale-[0.98] ${
                          isSelected
                            ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                            : 'border-border/80 bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
                        }`}
                      >
                        <span className="block truncate text-xs font-semibold sm:text-sm">
                          {period.name}
                        </span>
                        <span className="mt-0.5 block whitespace-nowrap text-[9px] font-medium opacity-70 sm:text-[11px]">
                          {period.start_time}–{period.end_time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4"
          >
            <XCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-5 animate-fade-in-up">
          <section
            aria-labelledby="attendance-summary-title"
            className="rounded-[1.5rem] border border-border/70 bg-card p-2 shadow-card"
          >
            <h2 id="attendance-summary-title" className="sr-only">
              현재 출석 현황
            </h2>
            <dl className="grid grid-cols-2 lg:grid-cols-4">
              <div className="flex min-h-24 items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">신청 인원</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {stats.total}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">명</span>
                  </dd>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {selectedPeriod?.name || '종일'} 기준
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <div className="flex min-h-24 items-center justify-between gap-3 rounded-2xl border-l border-border/50 px-4 py-3 sm:px-5">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">출석 완료</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-emerald-600 dark:text-emerald-400">
                    {stats.attended}
                    <span className="ml-1 text-sm font-medium">명</span>
                  </dd>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    인정출석 {stats.excused}명 포함
                  </p>
                </div>
                <CheckCircle2
                  className="hidden h-5 w-5 text-emerald-500 sm:block"
                  aria-hidden="true"
                />
              </div>

              <div className="flex min-h-24 items-center justify-between gap-3 rounded-2xl border-t border-border/50 px-4 py-3 sm:px-5 lg:border-l lg:border-t-0">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">확인 대기</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-amber-600 dark:text-amber-400">
                    {stats.notAttended}
                    <span className="ml-1 text-sm font-medium">명</span>
                  </dd>
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    좌석을 눌러 처리
                  </p>
                </div>
                <XCircle className="hidden h-5 w-5 text-amber-500 sm:block" aria-hidden="true" />
              </div>

              <div className="min-h-24 rounded-2xl border-l border-t border-border/50 px-4 py-3 sm:px-5 lg:border-t-0">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs font-semibold text-muted-foreground">출석률</dt>
                  <dd className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {stats.attendanceRate}%
                  </dd>
                </div>
                <div
                  role="progressbar"
                  aria-label="현재 교시 출석률"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stats.attendanceRate}
                  className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                  {stats.attended}/{stats.total || 0}명 확인
                </p>
              </div>
            </dl>
          </section>

          {/* 메인 컨텐츠: 자리 배치도 */}
          {isLoading || isRoomsLoading ? (
            <div
              role="status"
              className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border/70 bg-card py-20 shadow-card"
            >
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                출석 데이터를 불러오는 중입니다...
              </p>
            </div>
          ) : selectedRoom ? (
            <section
              aria-labelledby="seat-map-title"
              className="relative touch-pan-y overflow-visible rounded-[1.75rem] border border-border/70 bg-card shadow-card"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onTouchCancel={resetRoomSwipe}
            >
              {/* 스와이프 인디케이터 (이전/다음 열람실) */}
              {roomSwipeTarget && (
                <RoomSwipeIndicator
                  edge={roomSwipeTarget.edge}
                  progress={roomSwipeTarget.progress}
                  roomName={roomSwipeTarget.room.name}
                  position={roomSwipeTarget.position}
                  total={allRooms.length}
                />
              )}
              <div className="relative z-0 border-b border-border/60 px-5 py-5 sm:px-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Current room
                      </p>
                      <h2
                        id="seat-map-title"
                        className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground"
                      >
                        {selectedRoom.name} 배치도
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-input bg-background px-3.5 text-xs font-semibold text-foreground shadow-sm outline-none transition-[border-color,background-color,transform] hover:border-primary/20 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] sm:self-auto"
                  >
                    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                    {isFlipped ? '원래 방향' : '배치도 뒤집기'}
                  </button>
                </div>

                <div
                  aria-label="좌석 상태 범례"
                  className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium text-muted-foreground sm:text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-border bg-background" />
                    <span>빈 자리</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40" />
                    <span>확인 대기</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/40" />
                    <span>출석</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-teal-300 bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40" />
                    <span>인정출석</span>
                  </div>
                  {selectedRoom.is_sungong && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full border border-indigo-300 bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/40" />
                      <span>보완</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full border border-border bg-muted text-[7px] font-bold text-destructive">
                      ×
                    </span>
                    <span>사용 불가</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 overflow-x-auto overflow-y-visible bg-muted/15 p-3 sm:p-8">
                <div className="mx-auto">
                  {/* Front Indicator (Top) */}
                  {!isFlipped && (
                    <div className="mx-auto mb-8 w-full max-w-md text-center">
                      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-border/70" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        정면
                      </span>
                    </div>
                  )}

                  {/* 좌석 그리드 */}
                  <div
                    className="mb-6 grid justify-center gap-1 sm:gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${selectedRoom.seat_layout.totalColumns}, minmax(1.6rem, 3.5rem))`,
                    }}
                  >
                    {(() => {
                      const {
                        totalRows,
                        totalColumns,
                        sections,
                        emptySeats = [],
                        unavailableSeats = [],
                      } = selectedRoom.seat_layout;
                      const grid = [];

                      // 행 순서 결정 (뒤집기 여부에 따라)
                      const rowIndices = [];
                      for (let i = 0; i < totalRows; i++) {
                        rowIndices.push(isFlipped ? totalRows - 1 - i : i);
                      }

                      for (const row of rowIndices) {
                        // 열 순서 결정 (뒤집기 여부에 따라)
                        const colIndices = [];
                        for (let j = 0; j < totalColumns; j++) {
                          colIndices.push(isFlipped ? totalColumns - 1 - j : j);
                        }

                        for (const col of colIndices) {
                          const section = sections.find(
                            s =>
                              row >= s.startRow &&
                              row < s.startRow + s.rows &&
                              col >= s.startCol &&
                              col < s.startCol + s.columns
                          );

                          if (section) {
                            const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;
                            const isEmpty = emptySeats.includes(seatNumber);
                            const isUnavailable = unavailableSeats.includes(seatNumber);

                            if (isEmpty) {
                              grid.push(
                                <div
                                  key={`${row}-${col}`}
                                  className="w-full h-full aspect-square"
                                  aria-hidden="true"
                                />
                              );
                            } else if (isUnavailable) {
                              grid.push(
                                <div
                                  key={`${row}-${col}`}
                                  className="relative flex aspect-square h-full w-full items-center justify-center rounded-b-md rounded-t-lg border border-border/70 bg-muted/70 opacity-70 sm:rounded-t-xl"
                                >
                                  <span className="z-10 text-xs font-medium text-muted-foreground/70">
                                    {seatNumber}
                                  </span>
                                  <div className="absolute inset-0 flex select-none items-center justify-center text-lg font-bold text-destructive/40">
                                    <svg
                                      className="h-full w-full p-1"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </div>
                                </div>
                              );
                            } else {
                              const reservation = getReservationBySeat(seatNumber);
                              const seatKey = `${selectedRoom.id}-${seatNumber}`;
                              const isUpdating = updatingSeats.has(seatKey);

                              // 시각적으로 아래쪽 절반에 있는/ 행인지 확인 (i는 현재 루프의 인덱스, 0부터 시작)
                              // rowIndices 루프 안에서 index를 사용해야 함.
                              // 현재 구조상 i는 이미 정의되어 있지 않음.
                              // rowIndices.forEach((row, rowIndex) => ...) 구조가 아니라 for ... of 구조임.
                              // rowIndices에서 row 값만으로는 시각적 순서를 알 수 없음(isFlipped 때문에).
                              // 하지만 우리는 rowIndices 배열 순서대로 그리므로, rowIndices 배열 내의 인덱스를 찾으면 됨.
                              const visualRowIndex = rowIndices.indexOf(row);
                              const isBottomHalf = visualRowIndex >= totalRows / 2;

                              // 좌우 위치 계산 (퍼센티지 기반)
                              const visualColIndex = colIndices.indexOf(col);
                              const totalColsMinusOne = totalColumns - 1;
                              let popupAlignment: 'left' | 'center' | 'right' = 'center';

                              if (totalColsMinusOne > 0) {
                                const percentage = visualColIndex / totalColsMinusOne;
                                if (percentage <= 0.2) popupAlignment = 'left';
                                else if (percentage >= 0.8) popupAlignment = 'right';
                              } else {
                                // 컬럼이 1개인 경우
                                popupAlignment = 'center';
                              }

                              grid.push(
                                <AttendanceSeat
                                  key={seatNumber}
                                  seatNumber={seatNumber}
                                  reservation={reservation}
                                  onToggleAttendance={handleToggleAttendance}
                                  onExcusedAttendance={handleExcusedAttendance}
                                  onSupplementAttendance={
                                    selectedRoom.is_sungong ? handleSupplementAttendance : undefined
                                  }
                                  temperature={
                                    reservation
                                      ? studentTemperatures[reservation.student_id]
                                      : undefined
                                  }
                                  isLoading={isUpdating}
                                  isSelected={selectedSeatId === seatKey}
                                  onSelect={id => setSelectedSeatId(id ? seatKey : null)}
                                  popupPosition={isBottomHalf ? 'top' : 'bottom'}
                                  popupAlignment={popupAlignment}
                                  studentNumber={
                                    reservation ? snums[reservation.student_id] : undefined
                                  }
                                />
                              );
                            }
                          } else {
                            grid.push(
                              <div
                                key={`${row}-${col}`}
                                className="w-full h-full aspect-square"
                                aria-hidden="true"
                              />
                            );
                          }
                        }
                      }
                      return grid;
                    })()}
                  </div>

                  {/* Front Indicator (Bottom) */}
                  {isFlipped && (
                    <div className="mx-auto mb-6 mt-4 w-full max-w-md text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        정면
                      </span>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/70" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-border/70 bg-card py-20 text-center shadow-card">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <MapPin className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">열람실을 선택해 주세요</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                위 선택 메뉴에서 관리할 열람실을 고르세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
