import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useReservation } from '@hooks/useReservation';
import { useToast } from '@hooks/useToast';
import { Layout } from '@components/common/Layout';
import { Button } from '@components/common/Button';
import { Select } from '@components/common/Select';
import { ConfirmModal } from '@components/common/Modal';
import { ToastContainer } from '@components/common/Toast';
import { RoomSwipeIndicator } from '@components/common/RoomSwipeIndicator';
import { DateSelector } from '@components/student/DateSelector';
import { SeatMap } from '@components/student/SeatMap';
import { PeriodSelector } from '@components/student/PeriodSelector';
import { getSelectableDates, getOperatingDays } from '@utils/dateHelpers';
import { isBefore, isAfter, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getRoomSeatCounts } from '@services/reservation.service';
import {
  Armchair,
  CalendarRange,
  Check,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ReservationPage = () => {
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  // 학생 정보
  const profileId = user?.profile_id || '';
  const grade = user?.meta?.grade || 1;
  const isAdmin = user?.type === 'admin';

  const {
    studyRooms,
    selectedRoom,
    selectRoom: setSelectedRoom,
    selectedDate,
    setSelectedDate,
    occupiedSeats,
    myPoolReservations,
    reservations, // useReservation에서 가져온 현재 열람실의 예약 정보 (period_id 포함)
    isLoading,
    error,
    makeReservation,
    cancelMyReservation,
    changeSeat,
  } = useReservation(profileId, grade, isAdmin);

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // 선택 가능한 날짜 목록
  // 현재 주의 오늘 이후 + 일요일 20시 이후라면 다음 주
  const allAvailableDates = getSelectableDates();

  // 운영 기간(fixed dates)이 설정되어 있다면 필터링
  const availableDates = allAvailableDates.filter(date => {
    if (!selectedRoom?.fixed_start_date && !selectedRoom?.fixed_end_date) return true;

    let isWithin = true;
    if (selectedRoom.fixed_start_date) {
      if (isBefore(date, parseISO(selectedRoom.fixed_start_date))) isWithin = false;
    }
    if (selectedRoom.fixed_end_date) {
      if (isAfter(date, parseISO(selectedRoom.fixed_end_date))) isWithin = false;
    }
    return isWithin;
  });

  // 드롭다운 표시용 경량 통계 데이터 (열람실별 사용 중인 좌석 수 — 서버 RPC)
  const [roomStats, setRoomStats] = useState<Record<string, { uniqueSeats: number }>>({});

  useEffect(() => {
    const fetchRoomStats = async () => {
      try {
        // FIXED 모드 열람실이 있으면 운영 기간 전체로 조회
        const fixedRoom = studyRooms.find(
          r => r.reservation_mode === 'FIXED' && r.fixed_start_date && r.fixed_end_date
        );
        const dateRange = fixedRoom
          ? { startDate: fixedRoom.fixed_start_date!, endDate: fixedRoom.fixed_end_date! }
          : undefined;
        const counts = await getRoomSeatCounts(selectedDate, dateRange);
        setRoomStats(counts);
      } catch (err) {
        console.error('Failed to fetch room stats:', err);
      }
    };
    fetchRoomStats();
  }, [selectedDate, studyRooms]);

  // 신청 가능 여부 (날짜가 있으면 신청 가능)
  // const canReserve = availableDates.length > 0;

  // FIXED 모드 관련 로직
  const isFixedMode = selectedRoom?.reservation_mode === 'FIXED';
  const now = new Date();
  let isBookingPeriod = true;
  let fixedStatusMessage = '';

  if (isFixedMode && selectedRoom) {
    // booking_windows 우선, 없으면 레거시 단일 필드로 폴백
    const windows =
      selectedRoom.booking_windows && selectedRoom.booking_windows.length > 0
        ? selectedRoom.booking_windows
        : selectedRoom.booking_start_date || selectedRoom.booking_end_date
          ? [
              {
                id: 0,
                start: selectedRoom.booking_start_date || '',
                end: selectedRoom.booking_end_date || '',
              },
            ]
          : [];

    if (windows.length > 0) {
      const activeWindow = windows.find(w => {
        const afterStart = !w.start || !isBefore(now, parseISO(w.start));
        const beforeEnd = !w.end || !isAfter(now, parseISO(w.end));
        return afterStart && beforeEnd;
      });

      if (!activeWindow) {
        isBookingPeriod = false;
        const nextWindow = windows
          .filter(w => w.start && isBefore(now, parseISO(w.start)))
          .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())[0];

        if (nextWindow) {
          const startDate = parseISO(nextWindow.start);
          fixedStatusMessage = `예약 접수 시작 전입니다. ${nextWindow.label ? `(${nextWindow.label}) ` : ''}(${format(startDate, 'M월 d일 HH:mm')}부터)`;
        } else {
          fixedStatusMessage = '모든 예약 접수가 마감되었습니다.';
        }
      }
    }
  }

  const isSelectedDateAvailable = availableDates.some(
    date => format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const canReserveFinal = isAdmin ? true : isFixedMode ? isBookingPeriod : isSelectedDateAvailable;

  // 교시 선택 모달 상태
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<number[]>([]);
  const [periodModalError, setPeriodModalError] = useState<string | null>(null);

  // 요일별 교시 선택 상태 (PER_DAY 모드용)
  const [dayPeriodSelections, setDayPeriodSelections] = useState<Record<number, number[]>>({});

  // 교시 필터 패널 상태 (좌석 지도 필터 전용 — 신청 상태와 분리)
  const [filterPeriodIds, setFilterPeriodIds] = useState<number[]>([]); // UNIFORM 모드
  const [filterDaySelections, setFilterDaySelections] = useState<Record<number, number[]>>({}); // PER_DAY 모드

  // 교시 신청 모드 (열람실 설정에서 가져옴)
  const periodBookingMode = selectedRoom?.period_booking_mode || 'ALL_AT_ONCE';
  const dayPeriodMode = selectedRoom?.day_period_mode || 'UNIFORM';
  const isIndividualMode = periodBookingMode === 'INDIVIDUAL';
  const isPerDayMode = isIndividualMode && dayPeriodMode === 'PER_DAY';

  // 운영 요일 배열 (서비스/DateSelector 등에서 사용)
  const roomOperatingDays = useMemo(() => {
    if (!selectedRoom) return [1, 2, 3, 4, 5];
    return getOperatingDays(selectedRoom);
  }, [selectedRoom]);

  // 운영 요일 목록 (PER_DAY 탭용)
  const operatingDays = useMemo(() => {
    const dayLabels: Record<number, string> = {
      0: '일',
      1: '월',
      2: '화',
      3: '수',
      4: '목',
      5: '금',
      6: '토',
    };
    // 월~일 순서로 정렬하여 표시 (1,2,3,4,5,6,0)
    const displayOrder = [1, 2, 3, 4, 5, 6, 0];
    return displayOrder
      .filter(d => roomOperatingDays.includes(d))
      .map(d => ({ day: d, label: dayLabels[d] }));
  }, [roomOperatingDays]);

  // 교시 필터 패널을 표시할 열람실인지 (교시 사용 + INDIVIDUAL 방식)
  const isIndividualPeriodRoom = Boolean(
    selectedRoom?.use_periods &&
      selectedRoom.operating_periods &&
      selectedRoom.operating_periods.length > 0 &&
      isIndividualMode
  );

  // 열람실 변경 시 신청 관련 선택 상태 초기화
  // (이전 열람실의 교시 선택이 남아 교시 미운영 열람실에 교시 예약이 생성되는 것을 방지)
  useEffect(() => {
    setSelectedSeat(null);
    setSelectedPeriodIds([]);
    setDayPeriodSelections({});
    setShowPeriodModal(false);
    setPeriodModalError(null);
  }, [selectedRoom?.id]);

  // 열람실 변경 시 필터를 전체 운영 슬롯으로 재초기화
  useEffect(() => {
    if (!isIndividualPeriodRoom || !selectedRoom?.operating_periods) {
      setFilterPeriodIds([]);
      setFilterDaySelections({});
      return;
    }
    const allPeriodIds = selectedRoom.operating_periods.map(p => p.id);
    if (isPerDayMode) {
      const initial: Record<number, number[]> = {};
      operatingDays.forEach(d => {
        initial[d.day] = [...allPeriodIds];
      });
      setFilterDaySelections(initial);
    } else {
      setFilterPeriodIds([...allPeriodIds]);
    }
    // selectedRoom.id 기준으로만 재초기화 (선택값 변경 시 재실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id, isIndividualPeriodRoom, isPerDayMode]);

  // 선택된 교시 필터로 신청 불가한 좌석 집합 계산
  // "선택한 슬롯이 전부 비어있어야 활성" → 선택 슬롯 중 하나라도 예약되면 비활성(occupied)
  const filteredOccupiedSeats = useMemo(() => {
    if (!isIndividualPeriodRoom || !selectedRoom?.operating_periods) {
      return occupiedSeats;
    }
    const periods = selectedRoom.operating_periods;
    const periodIds = periods.map(p => p.id);

    // 좌석별로 선택된 슬롯 중 하나라도 예약되어 있으면 occupied
    const result = new Set<string>();

    for (const r of reservations) {
      const dayOfWeek = new Date(r.reservation_date + 'T00:00:00').getDay();
      const reservedPeriodId = r.period_id ?? 0;
      // 종일 예약(0)은 해당 요일의 모든 교시를 점유한 것으로 간주
      const reservedPeriodIds = reservedPeriodId === 0 ? periodIds : [reservedPeriodId];

      // 이 예약이 사용자가 "필터로 선택한 슬롯"과 겹치는지 확인
      const overlaps = isPerDayMode
        ? // PER_DAY: 해당 요일에 선택된 교시 중 예약된 교시가 있으면 겹침
          (filterDaySelections[dayOfWeek] || []).some(pid => reservedPeriodIds.includes(pid))
        : // UNIFORM: 요일 무관, 선택된 교시 중 예약된 교시가 있으면 겹침
          filterPeriodIds.some(pid => reservedPeriodIds.includes(pid));

      if (overlaps) {
        result.add(r.seat_number);
      }
    }
    return result;
  }, [
    isIndividualPeriodRoom,
    selectedRoom,
    reservations,
    isPerDayMode,
    filterPeriodIds,
    filterDaySelections,
    occupiedSeats,
  ]);

  // 좌석 선택 핸들러
  const handleSeatSelect = (seatNumber: string) => {
    if (
      myPoolReservations.some(r => r.seat_number === seatNumber && r.room_id === selectedRoom?.id)
    ) {
      setSelectedSeat(null);
      return;
    }

    setSelectedSeat(seatNumber);

    // 교시 사용 열람실인 경우 교시 선택 모달 표시
    if (
      selectedRoom?.use_periods &&
      selectedRoom.operating_periods &&
      selectedRoom.operating_periods.length > 0
    ) {
      setShowPeriodModal(true);
      setPeriodModalError(null);

      const allPeriods = selectedRoom.operating_periods;

      // 교시별 점유 여부 판단 헬퍼 (요일 고려)
      const isPeriodOccupiedForDay = (seat: string, periodId: number, dayOfWeek?: number) => {
        return reservations.some(r => {
          if (r.seat_number !== seat) return false;
          if (r.period_id !== periodId && r.period_id !== 0) return false;
          if (dayOfWeek !== undefined) {
            const rDay = new Date(r.reservation_date + 'T00:00:00').getDay();
            return rDay === dayOfWeek;
          }
          return true;
        });
      };

      if (isIndividualMode) {
        if (isPerDayMode) {
          // PER_DAY: 각 요일별로 비어있는 교시만 선택
          const initial: Record<number, number[]> = {};
          operatingDays.forEach(d => {
            initial[d.day] = allPeriods
              .filter(p => !isPeriodOccupiedForDay(seatNumber, p.id, d.day))
              .map(p => p.id);
          });
          setDayPeriodSelections(initial);
          // UNIFORM용 selectedPeriodIds도 전체 가용 교시로 설정
          const allAvailable = allPeriods
            .filter(p => !isPeriodOccupiedForDay(seatNumber, p.id))
            .map(p => p.id);
          setSelectedPeriodIds(allAvailable);
        } else {
          // INDIVIDUAL + UNIFORM: 비어있는 교시만 기본 선택
          const availablePeriodIds = allPeriods
            .filter(p => !isPeriodOccupiedForDay(seatNumber, p.id))
            .map(p => p.id);
          setSelectedPeriodIds(availablePeriodIds);
        }
      } else {
        // ALL_AT_ONCE: 모든 교시 자동 선택 (기존 동작)
        const availablePeriodIds = allPeriods
          .filter(p => !isPeriodOccupiedForDay(seatNumber, p.id))
          .map(p => p.id);
        setSelectedPeriodIds(availablePeriodIds);
      }
    }
  };

  // 신청 확인
  const handleReservationConfirm = () => {
    if (!selectedSeat) {
      showError('좌석을 선택해주세요.');
      return;
    }

    if (selectedRoom?.use_periods) {
      if (isPerDayMode) {
        // PER_DAY: 각 요일에 교시가 선택되었는지 확인
        const hasEmpty = operatingDays.some(d => {
          const periods = dayPeriodSelections[d.day];
          return !periods || periods.length === 0;
        });
        if (hasEmpty || Object.keys(dayPeriodSelections).length === 0) {
          setShowPeriodModal(true);
          return;
        }
      } else if (selectedPeriodIds.length === 0) {
        setShowPeriodModal(true);
        return;
      }
    }

    setShowConfirmModal(true);
  };

  // 신청 실행
  const handleReservation = async () => {
    if (!selectedSeat) return;

    try {
      if (myPoolReservations.length > 0) {
        const isSameRoom = myPoolReservations.some(r => r.room_id === selectedRoom?.id);
        if (isSameRoom) {
          // 같은 열람실 내 자리 이동
          await changeSeat(selectedSeat);
        } else {
          // 같은 풀, 다른 열람실: 새 예약 먼저 생성 후 기존 예약 취소 (안전한 순서)
          const daySelections = isPerDayMode ? dayPeriodSelections : undefined;
          await makeReservation(selectedSeat, selectedPeriodIds, daySelections, true);
          await cancelMyReservation();
        }
        success('자리가 변경되었습니다!');
      } else {
        // 교시 정보 포함하여 신청
        const daySelections = isPerDayMode ? dayPeriodSelections : undefined;
        await makeReservation(selectedSeat, selectedPeriodIds, daySelections);
        success('자리 신청이 완료되었습니다!');
      }
      setSelectedSeat(null);
      setSelectedPeriodIds([]);
      setDayPeriodSelections({});
      setShowConfirmModal(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : '작업 처리에 실패했습니다.');
      setShowConfirmModal(false);
    }
  };

  // 신청 취소 확인
  const handleCancelConfirm = () => {
    if (myPoolReservations.length > 0) {
      const reservationDate = new Date(myPoolReservations[0].reservation_date);
      const now = new Date();

      // 예약 날짜와 오늘 날짜가 같은지 확인
      const isSameDay =
        reservationDate.getFullYear() === now.getFullYear() &&
        reservationDate.getMonth() === now.getMonth() &&
        reservationDate.getDate() === now.getDate();

      if (isSameDay) {
        // 18:30 이후인지 확인
        const cutoffTime = new Date(now);
        cutoffTime.setHours(18, 30, 0, 0);

        if (now > cutoffTime) {
          showError('당일 예약 취소는 18:30까지만 가능합니다.');
          return;
        }
      }
    }
    setShowCancelModal(true);
  };

  // 신청 취소 실행
  const handleCancel = async () => {
    try {
      await cancelMyReservation();
      success('자리 신청이 취소되었습니다.');
      setShowCancelModal(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : '신청 취소에 실패했습니다.');
      setShowCancelModal(false);
    }
  };

  // Swipe Logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

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
    if (absDistance >= minSwipeDistance && studyRooms.length > 1) {
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
      if (selectedRoom && studyRooms.length > 1) {
        const currentIndex = studyRooms.findIndex(r => r.id === selectedRoom.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (isLeftSwipe) {
          nextIndex = (currentIndex + 1) % studyRooms.length;
        } else {
          nextIndex = (currentIndex - 1 + studyRooms.length) % studyRooms.length;
        }
        setSelectedRoom(studyRooms[nextIndex]);
        setSelectedSeat(null);
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
    if (!swipeDirection || !selectedRoom || studyRooms.length <= 1) return null;
    if (touchStart === null || touchEnd === null) return null;
    const currentIndex = studyRooms.findIndex(r => r.id === selectedRoom.id);
    if (currentIndex === -1) return null;
    const nextIndex =
      swipeDirection === 'left'
        ? (currentIndex + 1) % studyRooms.length
        : (currentIndex - 1 + studyRooms.length) % studyRooms.length;
    return {
      edge: swipeDirection === 'left' ? ('right' as const) : ('left' as const),
      progress: Math.abs(touchStart - touchEnd) / minSwipeDistance,
      room: studyRooms[nextIndex],
      position: nextIndex + 1,
    };
  })();

  const displayLayout = useMemo(() => {
    return selectedRoom?.seat_layout || { totalRows: 0, totalColumns: 0, sections: [] };
  }, [selectedRoom?.seat_layout]);

  const unavailableSeatCount = displayLayout.unavailableSeats?.length || 0;
  const totalSelectableSeats = selectedRoom
    ? Math.max(selectedRoom.total_seats - unavailableSeatCount, 0)
    : 0;
  const reservedSeatCount = selectedRoom
    ? (roomStats[selectedRoom.id]?.uniqueSeats ?? filteredOccupiedSeats.size)
    : 0;
  const availableSeatCount = Math.max(totalSelectableSeats - reservedSeatCount, 0);

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
    <Layout title="자리 신청">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <h1 className="sr-only">자리 신청</h1>

      <ol
        className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-card/65 p-1.5 shadow-card sm:mb-6"
        aria-label="자리 신청 단계"
      >
        {[
          { number: 1, label: isFixedMode ? '일정 확인' : '날짜 선택' },
          { number: 2, label: '좌석 선택' },
          { number: 3, label: '신청 확인' },
        ].map(step => {
          const isComplete = step.number === 1 || (step.number === 2 && Boolean(selectedSeat));
          const isActive =
            (step.number === 2 && !selectedSeat) || (step.number === 3 && Boolean(selectedSeat));

          return (
            <li
              key={step.number}
              aria-current={isActive ? 'step' : undefined}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-colors sm:text-sm ${
                isActive
                  ? 'bg-card text-foreground shadow-card'
                  : isComplete
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                  isComplete
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? <Check className="h-3 w-3" /> : step.number}
              </span>
              <span className="truncate">{step.label}</span>
            </li>
          );
        })}
      </ol>

      {/* 메인 컨텐츠 그리드 */}
      <div className="grid items-start gap-5 pb-24 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-6 lg:pb-0">
        {/* 왼쪽 패널 (날짜 선택 & 정보) */}
        <div className="space-y-4 lg:sticky lg:top-24">
          {/* 안내 메시지 */}
          {availableDates.length === 0 && !isFixedMode && (
            <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 shrink-0 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm leading-relaxed text-foreground">
                  현재 신청 가능한 날짜가 없습니다. 일요일 20시부터 다음 주 신청이 가능합니다.
                </p>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-sm leading-relaxed text-destructive">{error}</p>
            </div>
          )}

          {/* 날짜 선택 또는 기간 정보 */}
          <section className="content-surface rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Step 1
                </p>
                <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                  {isFixedMode ? '운영 일정' : '날짜 선택'}
                </h2>
              </div>
            </div>

            {isFixedMode ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted/55 p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <CalendarRange className="h-3.5 w-3.5" />
                    운영 기간
                  </div>
                  <div className="font-semibold leading-relaxed text-foreground">
                    {selectedRoom?.fixed_start_date} ~ {selectedRoom?.fixed_end_date}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/65 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    예약 접수 기간
                  </div>
                  {(() => {
                    const windows =
                      selectedRoom?.booking_windows && selectedRoom.booking_windows.length > 0
                        ? selectedRoom.booking_windows
                        : selectedRoom?.booking_start_date || selectedRoom?.booking_end_date
                          ? [
                              {
                                id: 0,
                                label: '',
                                start: selectedRoom?.booking_start_date || '',
                                end: selectedRoom?.booking_end_date || '',
                              },
                            ]
                          : [];

                    if (windows.length === 0) {
                      return <div className="font-semibold text-foreground">-</div>;
                    }

                    return (
                      <div className="space-y-2">
                        {windows.map((w, i) => {
                          const isActive =
                            w.start &&
                            w.end &&
                            !isBefore(now, parseISO(w.start)) &&
                            !isAfter(now, parseISO(w.end));
                          return (
                            <div
                              key={w.id ?? i}
                              className={`text-sm leading-relaxed ${
                                isActive ? 'font-semibold text-primary' : 'text-foreground'
                              }`}
                            >
                              {w.label && (
                                <span className="mb-0.5 block text-xs font-semibold text-muted-foreground">
                                  {w.label}
                                </span>
                              )}
                              {w.start
                                ? format(parseISO(w.start), 'M월 d일 (EEE) HH:mm', { locale: ko })
                                : '-'}
                              {' ~ '}
                              {w.end
                                ? format(parseISO(w.end), 'M월 d일 (EEE) HH:mm', { locale: ko })
                                : '-'}
                              {isActive && (
                                <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                                  접수 중
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                {!isBookingPeriod && (
                  <div className="rounded-2xl border border-destructive/15 bg-destructive/[0.08] p-3.5 text-sm leading-relaxed text-destructive">
                    <p>{fixedStatusMessage}</p>
                    {isAdmin && (
                      <p className="mt-2 flex items-start gap-1.5 border-t border-destructive/10 pt-2 font-medium text-foreground">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        관리자 권한으로 좌석을 선택하고 신청할 수 있습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <DateSelector
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                availableDates={availableDates}
                operatingDays={roomOperatingDays}
              />
            )}
          </section>

          {/* 교시 필터 패널 (INDIVIDUAL 교시 열람실 전용) */}
          {isIndividualPeriodRoom && (
            <section className="content-surface rounded-[1.75rem] p-5 sm:p-6">
              <h2 className="mb-1.5 flex items-center text-lg font-bold tracking-[-0.02em] text-foreground">
                <svg
                  className="mr-2 h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                  />
                </svg>
                교시 필터
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                원하는 교시를 선택하면 신청 가능한 좌석만 활성화됩니다.
              </p>
              <PeriodSelector
                mode={isPerDayMode ? 'PER_DAY' : 'UNIFORM'}
                operatingPeriods={selectedRoom?.operating_periods || []}
                operatingDays={operatingDays}
                uniformValue={filterPeriodIds}
                perDayValue={filterDaySelections}
                onUniformChange={setFilterPeriodIds}
                onPerDayChange={setFilterDaySelections}
              />
            </section>
          )}

          {/* 선택 정보 요약 (데스크탑) */}
          <section className="content-surface hidden rounded-[1.75rem] p-5 lg:block sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Your selection
                </p>
                <h2 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-foreground">
                  선택 정보
                </h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <MapPin className="h-5 w-5" />
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/55 p-4">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">열람실</div>
                <div className="font-semibold leading-snug text-foreground">
                  {selectedRoom?.name || '-'}
                </div>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  selectedSeat ? 'border-primary/20 bg-accent/70' : 'border-border/70'
                }`}
              >
                <div className="mb-1 text-xs font-semibold text-muted-foreground">선택 좌석</div>
                <div className="font-semibold text-foreground">
                  {selectedSeat ? (
                    <span className="text-xl font-bold tracking-[-0.03em] text-primary">
                      {selectedSeat}번
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">좌석을 선택해 주세요</span>
                  )}
                </div>
              </div>
              {myPoolReservations.length > 0 && (
                <div className="rounded-2xl border border-success/15 bg-success/10 p-4">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    현재 내 자리
                  </div>
                  <div className="font-semibold text-success">
                    {myPoolReservations[0].room_id !== selectedRoom?.id && (
                      <span className="block text-xs font-medium text-muted-foreground">
                        {studyRooms.find(r => r.id === myPoolReservations[0].room_id)?.name ||
                          '다른 열람실'}
                      </span>
                    )}
                    {myPoolReservations[0].seat_number}번 사용 중
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleReservationConfirm}
                disabled={!selectedSeat || isLoading || !canReserveFinal}
                isLoading={isLoading}
              >
                {myPoolReservations.length > 0 ? '자리 변경하기' : '신청하기'}
              </Button>
              {myPoolReservations.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={handleCancelConfirm}
                  disabled={isLoading || !canReserveFinal}
                >
                  예약 취소
                </Button>
              )}
            </div>
          </section>
        </div>

        {/* 오른쪽 패널 (좌석 지도) */}
        <div className="min-w-0">
          {selectedRoom ? (
            <div
              className="content-surface relative touch-pan-y overflow-hidden rounded-[2rem]"
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
                  total={studyRooms.length}
                />
              )}
              <div className="flex flex-col gap-5 border-b border-border/70 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Step 2
                    </p>
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      좌석을 선택하세요
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span className="truncate">{selectedRoom.name}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        빈 자리{' '}
                        <strong className="font-semibold text-foreground">
                          {availableSeatCount}
                        </strong>
                        개
                      </span>
                    </p>
                  </div>
                </div>

                {/* 열람실 선택 탭 (2개 이상일 때만 표시) */}
                {studyRooms.length > 1 && (
                  <div className="w-full lg:w-auto lg:min-w-[18rem]">
                    <Select
                      aria-label="열람실 선택"
                      options={[...studyRooms]
                        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                        .map(room => {
                          const stats = roomStats[room.id];
                          const totalSeats =
                            room.total_seats - (room.seat_layout?.unavailableSeats?.length || 0);

                          // roomStats에서 고유 좌석 수 가져오기 (경량 API 사용)
                          const uniqueReservedSeats = stats?.uniqueSeats || 0;
                          const displayCount = `(${uniqueReservedSeats}/${totalSeats})`;

                          return {
                            value: room.id,
                            label: `${room.name} ${displayCount}`,
                          };
                        })}
                      value={selectedRoom?.id || ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const room = studyRooms.find(r => r.id === e.target.value);
                        if (room) {
                          setSelectedRoom(room);
                          setSelectedSeat(null);
                        }
                      }}
                      className="w-full"
                      fullWidth={true}
                    />
                  </div>
                )}
              </div>

              {/* 열람실 이용 규칙 표시 */}
              {selectedRoom.rules && (
                <div className="px-5 pt-5 sm:px-6 sm:pt-6">
                  <div className="rounded-2xl border border-primary/10 bg-accent/55 p-4">
                    <h3 className="mb-1 flex items-center text-sm font-semibold text-accent-foreground">
                      <svg
                        className="mr-1.5 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      이용 규칙
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                      {selectedRoom.rules}
                    </p>
                  </div>
                </div>
              )}
              <div className="p-4 sm:p-6">
                {isLoading ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="flex justify-center gap-4">
                      <div className="h-4 w-16 rounded bg-muted"></div>
                      <div className="h-4 w-16 rounded bg-muted"></div>
                      <div className="h-4 w-16 rounded bg-muted"></div>
                    </div>
                    <div className="h-64 rounded-2xl bg-muted"></div>
                  </div>
                ) : (
                  <SeatMap
                    layout={displayLayout}
                    occupiedSeats={filteredOccupiedSeats}
                    selectedSeat={selectedSeat}
                    onSeatSelect={handleSeatSelect}
                    mySeat={
                      myPoolReservations.length > 0 &&
                      myPoolReservations[0].room_id === selectedRoom.id
                        ? myPoolReservations[0].seat_number
                        : undefined
                    }
                    disabled={!canReserveFinal}
                  />
                )}
              </div>
            </div>
          ) : studyRooms.length === 0 ? (
            <div className="content-surface rounded-[2rem] p-8 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                <Armchair className="h-6 w-6" />
              </span>
              <p className="font-semibold text-foreground">{grade}학년 열람실 정보가 없습니다.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                이용 가능한 열람실이 등록되면 이곳에 표시됩니다.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 모바일 하단 고정 액션 바 */}
      <div className="floating-surface fixed inset-x-3 bottom-3 z-30 rounded-[1.4rem] p-3 shadow-overlay safe-area-bottom lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <div className="truncate text-[11px] font-medium text-muted-foreground">
              {selectedRoom?.name || '열람실'}
            </div>
            <div className="truncate text-sm font-bold text-foreground">
              {selectedSeat ? `${selectedSeat}번 좌석` : '좌석을 선택해 주세요'}
            </div>
          </div>
          {myPoolReservations.length > 0 && (
            <Button
              variant="outline"
              onClick={handleCancelConfirm}
              disabled={isLoading || !canReserveFinal}
              size="sm"
              className="shrink-0"
            >
              취소
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleReservationConfirm}
            disabled={!selectedSeat || isLoading || !canReserveFinal}
            isLoading={isLoading}
            className="w-[8.5rem] shrink-0"
          >
            {myPoolReservations.length > 0 ? '변경하기' : '신청하기'}
          </Button>
        </div>
      </div>

      {/* 교시 선택 모달 */}
      <ConfirmModal
        isOpen={showPeriodModal}
        onClose={() => {
          setShowPeriodModal(false);
          setSelectedSeat(null);
          setPeriodModalError(null);
        }}
        onConfirm={() => {
          setPeriodModalError(null);
          setShowPeriodModal(false);
          setShowConfirmModal(true);
        }}
        title="교시 선택"
        message={
          !isIndividualMode
            ? '예약할 교시를 확인해주세요. (모든 교시 일괄 선택)'
            : isPerDayMode
              ? '요일별로 예약할 교시를 선택해주세요.'
              : '예약할 교시를 선택해주세요.'
        }
        confirmText="선택 완료"
        isLoading={false}
      >
        {periodModalError && (
          <div className="mt-3 p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-red-600 dark:text-red-400">
            {periodModalError}
          </div>
        )}
        {isIndividualMode ? (
          /* INDIVIDUAL 모드: PER_DAY 매트릭스 또는 UNIFORM 그리드 (공통 PeriodSelector 사용) */
          <div className="mt-4">
            <PeriodSelector
              mode={isPerDayMode ? 'PER_DAY' : 'UNIFORM'}
              operatingPeriods={selectedRoom?.operating_periods || []}
              operatingDays={operatingDays}
              uniformValue={selectedPeriodIds}
              perDayValue={dayPeriodSelections}
              onUniformChange={setSelectedPeriodIds}
              onPerDayChange={setDayPeriodSelections}
              showBulkActions={isPerDayMode}
              isPeriodOccupied={(periodId, dayOfWeek) =>
                reservations.some(
                  r =>
                    r.seat_number === selectedSeat &&
                    (r.period_id === periodId || r.period_id === 0) &&
                    (dayOfWeek === undefined ||
                      new Date(r.reservation_date + 'T00:00:00').getDay() === dayOfWeek)
                )
              }
            />
          </div>
        ) : (
          /* ALL_AT_ONCE 모드: 전체/종일 일괄 (기존 동작 유지) */
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              disabled={true}
              className="p-3 rounded-lg border text-sm font-medium transition-colors bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-300 opacity-100 cursor-not-allowed"
            >
              <div className="flex flex-col items-center">
                <span>전체/종일</span>
                <span className="text-xs opacity-70 mt-1">하루 종일 사용</span>
              </div>
            </button>

            {selectedRoom?.operating_periods?.map(period => {
              const isOccupied = reservations.some(
                r =>
                  r.seat_number === selectedSeat && (r.period_id === period.id || r.period_id === 0)
              );

              return (
                <button
                  key={period.id}
                  type="button"
                  disabled={true}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors
 ${
   isOccupied
     ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
     : 'bg-card border-border text-foreground cursor-not-allowed'
 }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{period.name}</span>
                    <span className="text-xs opacity-70 mt-1">
                      {period.start_time} ~ {period.end_time}
                    </span>
                    {isOccupied && <span className="text-xs text-red-500 mt-1">(예약됨)</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ConfirmModal>

      {/* 신청 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleReservation}
        title={myPoolReservations.length > 0 ? '자리 변경 확인' : '자리 신청 확인'}
        message={(() => {
          if (myPoolReservations.length > 0) {
            const oldRoomName =
              myPoolReservations[0].room_id !== selectedRoom?.id
                ? studyRooms.find(r => r.id === myPoolReservations[0].room_id)?.name ||
                  '다른 열람실'
                : selectedRoom?.name;
            const fromLabel = `${oldRoomName} ${myPoolReservations[0].seat_number}번`;
            const toLabel = `${selectedRoom?.name} ${selectedSeat}번`;
            if (isFixedMode) {
              return `${fromLabel}에서 ${toLabel}으로 자리를 변경하시겠습니까? (기간 전체 변경)`;
            }
            return `${fromLabel}에서 ${toLabel}으로 자리를 변경하시겠습니까?`;
          }
          if (isFixedMode) {
            return `${selectedRoom?.name} ${selectedSeat}번 좌석을 신청하시겠습니까?\n운영 기간: ${selectedRoom?.fixed_start_date} ~ ${selectedRoom?.fixed_end_date}`;
          }
          return `${selectedRoom?.name} ${selectedSeat}번 좌석을 신청하시겠습니까?`;
        })()}
        confirmText={myPoolReservations.length > 0 ? '변경' : '신청'}
        isLoading={isLoading}
      />

      {/* 취소 확인 모달 */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="신청 취소 확인"
        message={(() => {
          if (myPoolReservations.length === 0) return '취소할 예약이 없습니다.';
          const roomName =
            myPoolReservations[0].room_id !== selectedRoom?.id
              ? studyRooms.find(r => r.id === myPoolReservations[0].room_id)?.name || '다른 열람실'
              : selectedRoom?.name;
          return `${roomName} ${myPoolReservations[0].seat_number}번 좌석 신청을 취소하시겠습니까?`;
        })()}
        confirmText="취소"
        cancelText="닫기"
        variant="danger"
        isLoading={isLoading}
      />
    </Layout>
  );
};
