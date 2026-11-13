import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { SeatMap } from '@components/student/SeatMap';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import {
  getOccupiedSeatsForDateRange,
  adminCreateReservations,
  adminChangeSeat,
  getReservationDatesWithFeedback,
} from '@services/reservation.service';
import { format } from 'date-fns';
import type { SeatReservation, StudyRoom } from '@/types/reservation.types';

interface AdminReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { id: string; name: string; grade: number | null };
  mode: 'add' | 'change';
  existingReservation?: SeatReservation;
  allReservations?: SeatReservation[];
  onSuccess: () => void;
}

export const AdminReservationModal = ({
  isOpen,
  onClose,
  student,
  mode,
  existingReservation,
  allReservations = [],
  onSuccess,
}: AdminReservationModalProps) => {
  const { studyRooms, getStudyRoomById } = useStudyRooms();

  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [rawReservations, setRawReservations] = useState<
    { seat_number: string; period_id: number | null; reservation_date: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<number[]>([]);
  const [dayPeriodSelections, setDayPeriodSelections] = useState<Record<number, number[]>>({});
  const [feedbackWarningDates, setFeedbackWarningDates] = useState<string[]>([]);

  const selectedRoom: StudyRoom | undefined = selectedRoomId
    ? getStudyRoomById(selectedRoomId)
    : undefined;

  // 선택된 열람실에서 학생의 현재 좌석 찾기 (중복 열람실 대응)
  const currentSeatInRoom = useMemo(() => {
    if (mode !== 'change' || !selectedRoomId || allReservations.length === 0) return null;
    const reservation = allReservations.find(r => r.room_id === selectedRoomId);
    return reservation ?? null;
  }, [mode, selectedRoomId, allReservations]);

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setIsLoading(false);
    setSelectedSeat(null);
    setRawReservations([]);

    setSelectedDays([]);
    setSelectedPeriodIds([]);
    setDayPeriodSelections({});

    if (mode === 'change' && existingReservation) {
      // 변경 기간 기본값: 오늘 ~ 현재 좌석이 있는 열람실의 운영 종료일
      const roomId = existingReservation.room_id;
      const today = format(new Date(), 'yyyy-MM-dd');
      // 운영 종료일이 없는(주간 예약) 열람실은 이 열람실의 마지막 예약일까지
      const lastReservationDate = [existingReservation, ...allReservations]
        .filter(r => r.room_id === roomId)
        .reduce((max, r) => (r.reservation_date > max ? r.reservation_date : max), '');
      const roomEndDate = getStudyRoomById(roomId)?.fixed_end_date || lastReservationDate;
      setSelectedRoomId(roomId);
      setStartDate(today);
      // 운영 기간이 이미 끝났으면 오늘 하루로 둔다 (종료일이 시작일보다 앞서지 않게)
      setEndDate(roomEndDate && roomEndDate >= today ? roomEndDate : today);
    } else {
      setSelectedRoomId('');
      setStartDate('');
      setEndDate('');
    }
    // 모달을 열 때 한 번만 초기화한다. 열려 있는 동안 예약 목록이 갱신돼도 입력값을 덮어쓰지 않도록
    // allReservations / getStudyRoomById 는 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, existingReservation]);

  // Auto-set dates for FIXED mode rooms
  useEffect(() => {
    if (mode !== 'add' || !selectedRoom) return;
    if (
      selectedRoom.reservation_mode === 'FIXED' &&
      selectedRoom.fixed_start_date &&
      selectedRoom.fixed_end_date
    ) {
      setStartDate(selectedRoom.fixed_start_date);
      setEndDate(selectedRoom.fixed_end_date);
    } else {
      setStartDate('');
      setEndDate('');
    }
    setSelectedSeat(null);
    setRawReservations([]);
    setSelectedDays([]);
    setSelectedPeriodIds([]);
    setDayPeriodSelections({});
  }, [selectedRoomId, mode, selectedRoom]);

  // Load occupied seats when room + date range change
  const loadOccupiedSeats = useCallback(async () => {
    if (!selectedRoomId || !startDate || !endDate) {
      setRawReservations([]);
      return;
    }
    try {
      setIsLoadingSeats(true);
      const excludeId = mode === 'change' ? student.id : undefined;
      const data = await getOccupiedSeatsForDateRange(
        selectedRoomId,
        startDate,
        endDate,
        excludeId
      );
      setRawReservations(data);
    } catch {
      setRawReservations([]);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [selectedRoomId, startDate, endDate, mode, student.id]);

  // 관리자가 선택한 요일/교시를 반영하여 occupied 계산
  // (날짜, 교시) 쌍 단위로 정확하게 체크하여, 모든 대상 슬롯이 차있는 좌석만 occupied
  const occupiedSeats = useMemo(() => {
    if (!selectedRoom || rawReservations.length === 0) return new Set<string>();
    const hasPeriods =
      selectedRoom.use_periods &&
      selectedRoom.operating_periods &&
      selectedRoom.operating_periods.length > 0;

    if (!hasPeriods) {
      // 교시 미사용: 기간 내 모든 운영일에 예약이 있어야 occupied
      const opDays =
        selectedRoom.operating_days && selectedRoom.operating_days.length > 0
          ? selectedRoom.operating_days
          : (() => {
              const d = [1, 2, 3, 4, 5];
              if (selectedRoom.is_saturday_open) d.push(6);
              if (selectedRoom.is_sunday_open) d.push(0);
              return d;
            })();
      const effectiveDays =
        selectedDays.length > 0 ? selectedDays.filter(d => opDays.includes(d)) : opDays;

      // 기간 내 운영일 수 계산
      let totalDates = 0;
      if (startDate && endDate) {
        const cur = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate + 'T00:00:00');
        while (cur <= e) {
          if (effectiveDays.includes(cur.getDay())) totalDates++;
          cur.setDate(cur.getDate() + 1);
        }
      }
      if (totalDates === 0) {
        const seats = new Set<string>();
        rawReservations.forEach(r => seats.add(r.seat_number));
        return seats;
      }

      const seatDates = new Map<string, Set<string>>();
      for (const r of rawReservations) {
        const dow = new Date(r.reservation_date + 'T00:00:00').getDay();
        if (!effectiveDays.includes(dow)) continue;
        if (!seatDates.has(r.seat_number)) seatDates.set(r.seat_number, new Set());
        seatDates.get(r.seat_number)!.add(r.reservation_date);
      }
      const seats = new Set<string>();
      for (const [seat, dates] of seatDates) {
        if (dates.size >= totalDates) seats.add(seat);
      }
      return seats;
    }

    const allPeriods = selectedRoom.operating_periods!;
    const opDays =
      selectedRoom.operating_days && selectedRoom.operating_days.length > 0
        ? selectedRoom.operating_days
        : (() => {
            const d = [1, 2, 3, 4, 5];
            if (selectedRoom.is_saturday_open) d.push(6);
            if (selectedRoom.is_sunday_open) d.push(0);
            return d;
          })();
    const isPerDay =
      selectedRoom.period_booking_mode === 'INDIVIDUAL' &&
      selectedRoom.day_period_mode === 'PER_DAY';

    if (!isPerDay) {
      // UNIFORM: (실제 날짜, 교시) 쌍 단위
      const effectiveDays =
        selectedDays.length > 0 ? selectedDays.filter(d => opDays.includes(d)) : opDays;
      const effectivePeriods =
        selectedPeriodIds.length > 0
          ? allPeriods.filter(p => selectedPeriodIds.includes(p.id))
          : allPeriods;
      if (effectivePeriods.length === 0) return new Set<string>();

      // 기간 내 대상 슬롯 총 수 = 운영일 수 × 교시 수
      let effectiveDateCount = 0;
      if (startDate && endDate) {
        const cur = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate + 'T00:00:00');
        while (cur <= e) {
          if (effectiveDays.includes(cur.getDay())) effectiveDateCount++;
          cur.setDate(cur.getDate() + 1);
        }
      }
      const totalSlots = effectiveDateCount * effectivePeriods.length;
      if (totalSlots === 0) return new Set<string>();

      const seatSlots = new Map<string, Set<string>>();
      for (const r of rawReservations) {
        const dow = new Date(r.reservation_date + 'T00:00:00').getDay();
        if (!effectiveDays.includes(dow)) continue;
        if (!seatSlots.has(r.seat_number)) seatSlots.set(r.seat_number, new Set());
        const slots = seatSlots.get(r.seat_number)!;
        const periodId = r.period_id ?? 0;
        if (periodId === 0) {
          effectivePeriods.forEach(p => slots.add(`${r.reservation_date}-${p.id}`));
        } else if (effectivePeriods.some(p => p.id === periodId)) {
          slots.add(`${r.reservation_date}-${periodId}`);
        }
      }
      const seats = new Set<string>();
      for (const [seat, slotSet] of seatSlots) {
        if (slotSet.size > 0) seats.add(seat);
      }
      return seats;
    } else {
      // PER_DAY: (실제 날짜, 교시) 쌍 기준 — 선택된 요일별 교시 반영
      const hasDaySelections = Object.values(dayPeriodSelections).some(v => v.length > 0);

      // 기간 내 대상 슬롯 총 수 (각 날짜마다 해당 요일의 선택 교시 수)
      let totalSlots = 0;
      if (startDate && endDate) {
        const cur = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate + 'T00:00:00');
        while (cur <= e) {
          const dow = cur.getDay();
          if (opDays.includes(dow)) {
            const sel = dayPeriodSelections[dow];
            const perDay = hasDaySelections
              ? sel && sel.length > 0
                ? allPeriods.filter(p => sel.includes(p.id))
                : []
              : allPeriods;
            totalSlots += perDay.length;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
      if (totalSlots === 0) return new Set<string>();

      const seatSlots = new Map<string, Set<string>>();
      for (const r of rawReservations) {
        const date = r.reservation_date;
        const dayOfWeek = new Date(date + 'T00:00:00').getDay();
        if (!opDays.includes(dayOfWeek)) continue;
        const sel = dayPeriodSelections[dayOfWeek];
        const effectivePeriodsForDay = hasDaySelections
          ? sel && sel.length > 0
            ? allPeriods.filter(p => sel.includes(p.id))
            : []
          : allPeriods;
        if (effectivePeriodsForDay.length === 0) continue;
        if (!seatSlots.has(r.seat_number)) seatSlots.set(r.seat_number, new Set());
        const slots = seatSlots.get(r.seat_number)!;
        const periodId = r.period_id ?? 0;
        if (periodId === 0) {
          effectivePeriodsForDay.forEach(p => slots.add(`${date}-${p.id}`));
        } else if (effectivePeriodsForDay.some(p => p.id === periodId)) {
          slots.add(`${date}-${periodId}`);
        }
      }
      const seats = new Set<string>();
      for (const [seat, slotSet] of seatSlots) {
        if (slotSet.size > 0) seats.add(seat);
      }
      return seats;
    }
  }, [
    rawReservations,
    selectedRoom,
    selectedDays,
    selectedPeriodIds,
    dayPeriodSelections,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    loadOccupiedSeats();
  }, [loadOccupiedSeats]);

  // 변경 모드: 피드백이 기록된 예약이 있는지 확인
  useEffect(() => {
    if (mode !== 'change' || !selectedRoomId || !startDate || !endDate) {
      setFeedbackWarningDates([]);
      return;
    }
    getReservationDatesWithFeedback(student.id, selectedRoomId, startDate, endDate)
      .then(dates => setFeedbackWarningDates(dates))
      .catch(() => setFeedbackWarningDates([]));
  }, [mode, selectedRoomId, startDate, endDate, student.id]);

  const handleSubmit = async () => {
    if (!selectedSeat) {
      setErrorMsg('좌석을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'add') {
        if (!selectedRoomId || !startDate || !endDate) {
          setErrorMsg('열람실과 날짜를 모두 입력해주세요.');
          setIsLoading(false);
          return;
        }
        const room = getStudyRoomById(selectedRoomId);
        const isPerDay =
          room?.period_booking_mode === 'INDIVIDUAL' && room?.day_period_mode === 'PER_DAY';
        const hasDayPeriods =
          isPerDay && Object.values(dayPeriodSelections).some(v => v.length > 0);
        await adminCreateReservations(
          student.id,
          selectedRoomId,
          selectedSeat,
          startDate,
          endDate,
          room?.is_saturday_open ?? false,
          room?.is_sunday_open ?? false,
          room?.use_periods,
          room?.operating_periods,
          room?.operating_days,
          selectedDays.length > 0 ? selectedDays : undefined,
          !isPerDay && selectedPeriodIds.length > 0 ? selectedPeriodIds : undefined,
          hasDayPeriods ? dayPeriodSelections : undefined
        );
      } else if (mode === 'change' && existingReservation) {
        if (!selectedRoomId) {
          setErrorMsg('열람실을 선택해주세요.');
          setIsLoading(false);
          return;
        }
        const sourceReservation = currentSeatInRoom ?? existingReservation;
        const room = getStudyRoomById(selectedRoomId);
        const isPerDay =
          room?.period_booking_mode === 'INDIVIDUAL' && room?.day_period_mode === 'PER_DAY';
        const hasDayPeriods =
          isPerDay && Object.values(dayPeriodSelections).some(v => v.length > 0);
        await adminChangeSeat(
          student.id,
          sourceReservation.room_id,
          sourceReservation.seat_number,
          selectedSeat,
          startDate || undefined,
          endDate || undefined,
          selectedRoomId !== sourceReservation.room_id ? selectedRoomId : undefined,
          room?.use_periods,
          room?.operating_periods,
          room?.operating_days,
          room?.is_saturday_open ?? false,
          room?.is_sunday_open ?? false,
          !isPerDay && selectedPeriodIds.length > 0 ? selectedPeriodIds : undefined,
          hasDayPeriods ? dayPeriodSelections : undefined
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '작업에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Count operating days for add mode
  const getDayCount = (): number => {
    if (!startDate || !endDate || !selectedRoom) return 0;
    const opDays =
      selectedRoom.operating_days && selectedRoom.operating_days.length > 0
        ? selectedRoom.operating_days
        : (() => {
            const d = [1, 2, 3, 4, 5];
            if (selectedRoom.is_saturday_open) d.push(6);
            if (selectedRoom.is_sunday_open) d.push(0);
            return d;
          })();
    const effectiveDays =
      selectedDays.length > 0 ? selectedDays.filter(d => opDays.includes(d)) : opDays;
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (effectiveDays.includes(current.getDay())) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const getPeriodCount = (): number => {
    if (!selectedRoom?.use_periods || !selectedRoom.operating_periods?.length) return 1;
    return selectedPeriodIds.length > 0
      ? selectedPeriodIds.length
      : selectedRoom.operating_periods.length;
  };

  const getTotalReservationCount = (): number => {
    if (!startDate || !endDate || !selectedRoom) return 0;
    const isPerDay =
      selectedRoom.period_booking_mode === 'INDIVIDUAL' &&
      selectedRoom.day_period_mode === 'PER_DAY';
    const hasDayPeriods = isPerDay && Object.values(dayPeriodSelections).some(v => v.length > 0);

    if (!hasDayPeriods) {
      return getDayCount() * getPeriodCount();
    }

    // PER_DAY mode: sum periods per actual date
    const opDays =
      selectedRoom.operating_days && selectedRoom.operating_days.length > 0
        ? selectedRoom.operating_days
        : (() => {
            const d = [1, 2, 3, 4, 5];
            if (selectedRoom.is_saturday_open) d.push(6);
            if (selectedRoom.is_sunday_open) d.push(0);
            return d;
          })();
    const effectiveDays =
      selectedDays.length > 0 ? selectedDays.filter(d => opDays.includes(d)) : opDays;
    const allPeriodIds = selectedRoom.operating_periods?.map(p => p.id) || [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    let total = 0;
    const current = new Date(start);
    while (current <= end) {
      const dow = current.getDay();
      if (effectiveDays.includes(dow)) {
        const pids = dayPeriodSelections[dow]?.length > 0 ? dayPeriodSelections[dow] : allPeriodIds;
        total += pids.length;
      }
      current.setDate(current.getDate() + 1);
    }
    return total;
  };

  const title = mode === 'add' ? `예약 추가 - ${student.name}` : `좌석 변경 - ${student.name}`;
  const submitText = mode === 'add' ? '예약 추가' : '좌석 변경';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isLoading || !selectedSeat}
          >
            {submitText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {mode === 'add' && (
          <>
            {/* Room select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">열람실</label>
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">열람실 선택</option>
                {studyRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                    {room.reservation_mode === 'FIXED' ? ' (기간제)' : ' (주간)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        )}

        {mode === 'change' && existingReservation && (
          <>
            <div className="p-3 bg-muted/50 rounded-lg text-sm text-foreground">
              현재:{' '}
              <span className="font-bold">
                {currentSeatInRoom?.study_rooms?.name ?? selectedRoom?.name ?? '열람실'}
              </span>{' '}
              <span className="font-bold">{currentSeatInRoom?.seat_number ?? '없음'}</span> 좌석
            </div>

            {/* Room select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">열람실</label>
              <select
                value={selectedRoomId}
                onChange={e => {
                  setSelectedRoomId(e.target.value);
                  setSelectedSeat(null);
                }}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">열람실 선택</option>
                {studyRooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range for change scope */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">변경 시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">변경 종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* 피드백 기록 경고 */}
            {feedbackWarningDates.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                <span className="font-semibold">⚠ 피드백 기록 있음:</span>{' '}
                {feedbackWarningDates.slice(0, 5).join(', ')}
                {feedbackWarningDates.length > 5 && ` 외 ${feedbackWarningDates.length - 5}건`}
                <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                  좌석 변경 시 해당 날짜의 기존 예약(피드백 포함)이 삭제되고 새로 생성됩니다.
                </p>
              </div>
            )}
          </>
        )}

        {/* 요일 선택 (add 모드, non-PER_DAY만 - PER_DAY는 매트릭스에서 요일 포함) */}
        {mode === 'add' &&
          selectedRoom &&
          (() => {
            const isPerDay =
              selectedRoom.period_booking_mode === 'INDIVIDUAL' &&
              selectedRoom.day_period_mode === 'PER_DAY';
            if (isPerDay) return null;
            const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
            const opDays =
              selectedRoom.operating_days && selectedRoom.operating_days.length > 0
                ? selectedRoom.operating_days
                : (() => {
                    const d = [1, 2, 3, 4, 5];
                    if (selectedRoom.is_saturday_open) d.push(6);
                    if (selectedRoom.is_sunday_open) d.push(0);
                    return d;
                  })();
            return (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  요일 선택 <span className="text-xs text-gray-400">(미선택 시 전체)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {opDays
                    .sort((a, b) => a - b)
                    .map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setSelectedDays(prev =>
                            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                          )
                        }
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          selectedDays.includes(day)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-card text-foreground border-input hover:border-primary-300'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    ))}
                </div>
              </div>
            );
          })()}

        {/* 교시 선택 (공통 - add/change 모두 사용) */}
        {selectedRoom?.use_periods &&
          selectedRoom.operating_periods &&
          selectedRoom.operating_periods.length > 0 &&
          (() => {
            const isPerDay =
              selectedRoom.period_booking_mode === 'INDIVIDUAL' &&
              selectedRoom.day_period_mode === 'PER_DAY';
            const DAY_LABELS: Record<number, string> = {
              0: '일',
              1: '월',
              2: '화',
              3: '수',
              4: '목',
              5: '금',
              6: '토',
            };
            const roomOpDays =
              selectedRoom.operating_days && selectedRoom.operating_days.length > 0
                ? selectedRoom.operating_days
                : (() => {
                    const d = [1, 2, 3, 4, 5];
                    if (selectedRoom.is_saturday_open) d.push(6);
                    if (selectedRoom.is_sunday_open) d.push(0);
                    return d;
                  })();
            const effectiveOpDays = (
              selectedDays.length > 0
                ? selectedDays.filter(d => roomOpDays.includes(d))
                : roomOpDays
            ).sort((a, b) => a - b);

            if (isPerDay) {
              const allPeriodIds = selectedRoom.operating_periods!.map(p => p.id);
              return (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    요일별 교시 선택 <span className="text-xs text-gray-400">(미선택 시 전체)</span>
                  </label>
                  {/* 전체 선택/해제 */}
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Record<number, number[]> = {};
                        effectiveOpDays.forEach(d => {
                          // occupied가 아닌 교시만 선택
                          updated[d] = selectedSeat
                            ? allPeriodIds.filter(
                                pid =>
                                  !rawReservations.some(
                                    r =>
                                      r.seat_number === selectedSeat &&
                                      (r.period_id === pid || r.period_id === 0) &&
                                      new Date(r.reservation_date + 'T00:00:00').getDay() === d
                                  )
                              )
                            : [...allPeriodIds];
                        });
                        setDayPeriodSelections(updated);
                      }}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      전체 선택
                    </button>
                    <span className="text-xs text-muted-foreground/70">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated: Record<number, number[]> = {};
                        effectiveOpDays.forEach(d => {
                          updated[d] = [];
                        });
                        setDayPeriodSelections(updated);
                      }}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      전체 해제
                    </button>
                  </div>
                  {/* 매트릭스: 행 = 교시, 열 = 요일 */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-1.5 text-xs font-medium text-muted-foreground text-left w-20" />
                          {effectiveOpDays.map(day => (
                            <th key={day} className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const availableIds = selectedSeat
                                    ? allPeriodIds.filter(
                                        pid =>
                                          !rawReservations.some(
                                            r =>
                                              r.seat_number === selectedSeat &&
                                              (r.period_id === pid || r.period_id === 0) &&
                                              new Date(
                                                r.reservation_date + 'T00:00:00'
                                              ).getDay() === day
                                          )
                                      )
                                    : allPeriodIds;
                                  const current = dayPeriodSelections[day] || [];
                                  const allSelected =
                                    availableIds.length > 0 &&
                                    availableIds.every(id => current.includes(id));
                                  setDayPeriodSelections(prev => ({
                                    ...prev,
                                    [day]: allSelected ? [] : [...availableIds],
                                  }));
                                }}
                                className="text-xs font-semibold text-foreground hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {DAY_LABELS[day]}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRoom.operating_periods!.map(period => (
                          <tr key={period.id}>
                            {/* 교시 행 헤더 (클릭 시 해당 교시 전체 요일 토글, occupied 제외) */}
                            <td className="p-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const toggleableDays = selectedSeat
                                    ? effectiveOpDays.filter(
                                        d =>
                                          !rawReservations.some(
                                            r =>
                                              r.seat_number === selectedSeat &&
                                              (r.period_id === period.id || r.period_id === 0) &&
                                              new Date(
                                                r.reservation_date + 'T00:00:00'
                                              ).getDay() === d
                                          )
                                      )
                                    : effectiveOpDays;
                                  const allSelected =
                                    toggleableDays.length > 0 &&
                                    toggleableDays.every(d =>
                                      (dayPeriodSelections[d] || []).includes(period.id)
                                    );
                                  const updated = { ...dayPeriodSelections };
                                  toggleableDays.forEach(d => {
                                    const current = updated[d] || [];
                                    if (allSelected) {
                                      updated[d] = current.filter(id => id !== period.id);
                                    } else if (!current.includes(period.id)) {
                                      updated[d] = [...current, period.id];
                                    }
                                  });
                                  setDayPeriodSelections(updated);
                                }}
                                className="text-left w-full"
                              >
                                <div className="text-xs font-medium text-foreground hover:text-primary-600 dark:hover:text-primary-400 leading-tight">
                                  {period.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground leading-tight">
                                  {period.start_time}~{period.end_time}
                                </div>
                              </button>
                            </td>
                            {/* 각 요일 셀 */}
                            {effectiveOpDays.map(day => {
                              const dayPeriods = dayPeriodSelections[day] || [];
                              const isSelected = dayPeriods.includes(period.id);
                              const isOccupied = selectedSeat
                                ? rawReservations.some(
                                    r =>
                                      r.seat_number === selectedSeat &&
                                      (r.period_id === period.id || r.period_id === 0) &&
                                      new Date(r.reservation_date + 'T00:00:00').getDay() === day
                                  )
                                : false;
                              return (
                                <td key={day} className="p-1">
                                  <button
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => {
                                      const updated = { ...dayPeriodSelections };
                                      const current = updated[day] || [];
                                      updated[day] = isSelected
                                        ? current.filter(id => id !== period.id)
                                        : [...current, period.id];
                                      setDayPeriodSelections(updated);
                                    }}
                                    className={`w-full aspect-square rounded-lg border text-sm font-medium transition-colors min-w-[36px]
 ${
   isSelected
     ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900/40 dark:border-primary-500 dark:text-primary-300'
     : isOccupied
       ? 'bg-muted border-border text-muted-foreground/70 cursor-not-allowed'
       : 'bg-card border-border text-muted-foreground hover:border-primary-300 hover:bg-primary-50 dark:hover:border-primary-500 cursor-pointer'
 }`}
                                  >
                                    {isOccupied ? '—' : isSelected ? '✓' : ''}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // UNIFORM 모드
            return (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  교시 선택 <span className="text-xs text-gray-400">(미선택 시 전체)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.operating_periods!.map(period => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() =>
                        setSelectedPeriodIds(prev =>
                          prev.includes(period.id)
                            ? prev.filter(id => id !== period.id)
                            : [...prev, period.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                        selectedPeriodIds.includes(period.id)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-card text-foreground border-input hover:border-primary-300'
                      }`}
                    >
                      {period.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

        {/* Seat Map */}
        {selectedRoom?.seat_layout && startDate && endDate ? (
          <div className="border border-border rounded-lg p-3">
            {isLoadingSeats ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <SeatMap
                layout={selectedRoom.seat_layout}
                occupiedSeats={occupiedSeats}
                selectedSeat={selectedSeat}
                onSeatSelect={s => setSelectedSeat(prev => (prev === s ? null : s))}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {mode === 'add'
              ? '열람실과 날짜를 선택하면 좌석 배치도가 표시됩니다.'
              : '열람실과 날짜를 선택하면 좌석 배치도가 표시됩니다.'}
          </div>
        )}

        {/* Selection summary */}
        {selectedSeat && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg text-sm">
            {mode === 'add' ? (
              <p className="text-primary-700 dark:text-primary-300">
                선택: {selectedRoom?.name} <span className="font-bold">{selectedSeat}</span> 좌석
                {startDate && endDate && (
                  <span className="ml-2">| {getTotalReservationCount()}건 예약 예정</span>
                )}
              </p>
            ) : (
              <p className="text-primary-700 dark:text-primary-300">
                {currentSeatInRoom?.study_rooms?.name ?? existingReservation?.study_rooms?.name}{' '}
                {currentSeatInRoom?.seat_number ?? existingReservation?.seat_number} →{' '}
                {selectedRoom?.name} <span className="font-bold">{selectedSeat}</span> 으로 변경
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
