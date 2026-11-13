import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getReservationsByDateAndRoom,
  getMyReservationByDate,
  getReservationsByRoomAndDateRange,
  getMyReservationsByDateRange,
  createReservation,
  cancelReservation,
  moveReservation,
} from '@services/reservation.service';
import type { StudyRoom, SeatReservation, DayPeriodSelection } from '../types/reservation.types';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import { getOperatingDays, getNearestOperatingDay, formatDate } from '@utils/dateHelpers';
import { mergeRoomSlots, SEAT_TAKEN_MESSAGE, type SeatOccupancy } from '@utils/seatOccupancy';

/**
 * 자리 예약 관리 훅
 * @param profileId - 사용자의 profiles.id (auth.uid())
 * @param grade - 학생의 학년
 */
export const useReservation = (profileId: string, grade: number, isAdmin = false) => {
  const { studyRooms: allRooms } = useStudyRooms();
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // 남의 좌석 점유(RPC — 학생 id 없음). 내 예약은 myReservations 에서 합친다.
  const [occupancy, setOccupancy] = useState<SeatOccupancy[]>([]);
  const [myReservations, setMyReservations] = useState<SeatReservation[]>([]);
  // 신청·이동이 «방금 다른 학생이 신청» 으로 실패하면 좌석 지도를 다시 읽는다
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열람실 목록 필터링 및 초기 선택
  useEffect(() => {
    // admin: 모든 활성 열람실, student: 해당 학년만
    const rooms = isAdmin
      ? allRooms
      : allRooms.filter(r => r.grades?.includes(grade) || r.grade === grade);
    setStudyRooms(rooms);

    if (rooms.length > 0 && !selectedRoom) {
      // 초기 로딩 시 첫 번째 방 선택 및 날짜 설정
      const firstRoom = rooms[0];
      setSelectedRoom(firstRoom);
      if (firstRoom.reservation_mode === 'FIXED' && firstRoom.fixed_start_date) {
        setSelectedDate(new Date(firstRoom.fixed_start_date));
      } else {
        // 오늘이 운영일이 아니면 가장 가까운 운영일로 이동
        const opDays = getOperatingDays(firstRoom);
        setSelectedDate(getNearestOperatingDay(new Date(), opDays));
      }
    }
  }, [allRooms, grade, isAdmin, selectedRoom]);

  // 방 선택 핸들러 (날짜 자동 설정 포함)
  const selectRoom = useCallback((room: StudyRoom) => {
    setSelectedRoom(room);

    if (room.reservation_mode === 'FIXED' && room.fixed_start_date) {
      setSelectedDate(new Date(room.fixed_start_date));
    } else if (room.reservation_mode === 'WEEKLY') {
      // 오늘이 운영일이 아니면 가장 가까운 운영일로 이동
      const opDays = getOperatingDays(room);
      setSelectedDate(getNearestOperatingDay(new Date(), opDays));
    }
  }, []);

  // 선택된 날짜/열람실의 예약 현황 로드
  useEffect(() => {
    if (!selectedRoom) {
      return;
    }

    const loadReservations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // FIXED 모드: 운영 기간 전체 조회 / WEEKLY 모드: 선택된 날짜만 조회
        const isFixed =
          selectedRoom.reservation_mode === 'FIXED' &&
          selectedRoom.fixed_start_date &&
          selectedRoom.fixed_end_date;

        const [roomReservations, myRes] = isFixed
          ? await Promise.all([
              getReservationsByRoomAndDateRange(
                selectedRoom.id,
                selectedRoom.fixed_start_date!,
                selectedRoom.fixed_end_date!
              ),
              getMyReservationsByDateRange(
                profileId,
                selectedRoom.fixed_start_date!,
                selectedRoom.fixed_end_date!
              ),
            ])
          : await Promise.all([
              getReservationsByDateAndRoom(selectedRoom.id, selectedDate),
              getMyReservationByDate(profileId, selectedDate),
            ]);

        setOccupancy(roomReservations);
        setMyReservations(myRes);
      } catch (err) {
        console.error('Error loading reservations:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadReservations();
  }, [selectedDate, selectedRoom, profileId, reloadKey]);

  // 좌석 지도가 그리는 칸 = 남의 점유 + 이 열람실의 내 예약 (조회 범위 안)
  const reservations = useMemo(() => {
    if (!selectedRoom) return [];
    const isFixed =
      selectedRoom.reservation_mode === 'FIXED' &&
      selectedRoom.fixed_start_date &&
      selectedRoom.fixed_end_date;
    const selectedKey = formatDate(selectedDate);
    const inRange = isFixed
      ? (d: string) => d >= selectedRoom.fixed_start_date! && d <= selectedRoom.fixed_end_date!
      : (d: string) => d === selectedKey;
    return mergeRoomSlots(occupancy, myReservations, selectedRoom.id, inRange);
  }, [occupancy, myReservations, selectedRoom, selectedDate]);

  // 예약된 좌석 목록 (메모이제이션)
  // FIXED 모드 + 교시 사용 열람실: 모든 (요일, 교시) 슬롯이 예약된 좌석만 occupied 처리
  // 하나라도 예약 가능한 슬롯이 있으면 available로 표시
  const occupiedSeats = useMemo(() => {
    if (!selectedRoom) return new Set<string>();

    const isFixed =
      selectedRoom.reservation_mode === 'FIXED' &&
      selectedRoom.fixed_start_date &&
      selectedRoom.fixed_end_date;
    const hasPeriods =
      selectedRoom.use_periods &&
      selectedRoom.operating_periods &&
      selectedRoom.operating_periods.length > 0;

    if (!isFixed || !hasPeriods) {
      // WEEKLY 모드 또는 교시 미사용: 기존 로직 유지
      return new Set(reservations.map(r => r.seat_number));
    }

    const periods = selectedRoom.operating_periods!;
    const opDays = getOperatingDays(selectedRoom);
    const isPerDay =
      selectedRoom.period_booking_mode === 'INDIVIDUAL' &&
      selectedRoom.day_period_mode === 'PER_DAY';

    if (!isPerDay) {
      // ALL_AT_ONCE / UNIFORM: 교시만 기준으로 판단 (요일 무관, 같은 교시 일괄 적용)
      const totalPeriods = periods.length;
      const seatPeriods = new Map<string, Set<number>>();

      for (const r of reservations) {
        if (!seatPeriods.has(r.seat_number)) {
          seatPeriods.set(r.seat_number, new Set());
        }
        seatPeriods.get(r.seat_number)!.add(r.period_id ?? 0);
      }

      const result = new Set<string>();
      for (const [seat, periodSet] of seatPeriods) {
        // period_id=0 (종일)이면 모든 교시 차지
        if (periodSet.has(0) || periodSet.size >= totalPeriods) {
          result.add(seat);
        }
      }
      return result;
    }

    // PER_DAY 모드: (요일, 교시) 조합별로 판단
    const totalSlots = opDays.length * periods.length;
    const seatSlots = new Map<string, Set<string>>();

    for (const r of reservations) {
      const date = new Date(r.reservation_date + 'T00:00:00');
      const dayOfWeek = date.getDay();
      if (!opDays.includes(dayOfWeek)) continue;

      if (!seatSlots.has(r.seat_number)) {
        seatSlots.set(r.seat_number, new Set());
      }
      const slots = seatSlots.get(r.seat_number)!;

      const periodId = r.period_id ?? 0;
      if (periodId === 0) {
        // 종일 예약: 해당 요일의 모든 교시 슬롯 차지
        for (const p of periods) {
          slots.add(`${dayOfWeek}-${p.id}`);
        }
      } else {
        slots.add(`${dayOfWeek}-${periodId}`);
      }
    }

    const result = new Set<string>();
    for (const [seat, slotSet] of seatSlots) {
      if (slotSet.size >= totalSlots) {
        result.add(seat);
      }
    }
    return result;
  }, [reservations, selectedRoom]);

  // 중복 허용 열람실 ID 집합 (풀 분리용)
  const dupRoomIdSet = useMemo(
    () => new Set(allRooms.filter(r => r.allow_duplicate_reservation).map(r => r.id)),
    [allRooms]
  );

  // 현재 선택된 열람실과 같은 풀의 내 예약
  // 중복 허용 열람실: 현재 열람실의 예약만 / 일반 열람실: 다른 일반 열람실 예약도 포함
  const myPoolReservations = useMemo(() => {
    if (!selectedRoom) return [];
    if (selectedRoom.allow_duplicate_reservation) {
      // 중복 허용: 현재 열람실의 예약만
      return myReservations.filter(r => r.room_id === selectedRoom.id);
    }
    // 일반: 중복 허용 열람실 예약 제외
    return myReservations.filter(r => !dupRoomIdSet.has(r.room_id));
  }, [myReservations, selectedRoom, dupRoomIdSet]);

  // 자리 신청
  const makeReservation = useCallback(
    async (
      seatNumber: string,
      periodIds?: number[],
      dayPeriodSelections?: DayPeriodSelection,
      skipPoolCheck?: boolean
    ): Promise<void> => {
      if (!selectedRoom) {
        throw new Error('열람실을 선택해주세요.');
      }

      try {
        setIsLoading(true);
        setError(null);
        const newReservations = await createReservation(
          profileId,
          selectedRoom.id,
          seatNumber,
          selectedDate,
          periodIds,
          dayPeriodSelections,
          isAdmin,
          skipPoolCheck
        );

        // Optimistic Update: 서버에서 반환된 새 예약을 내 예약에 추가
        // (좌석 지도는 내 예약을 합쳐 그리므로 occupancy 는 건드리지 않는다)
        if (newReservations.length > 0) {
          setMyReservations(prev => {
            const newIds = new Set(newReservations.map(r => r.id));
            return [...prev.filter(r => !newIds.has(r.id)), ...newReservations];
          });
        }
      } catch (err) {
        console.error('makeReservation error:', err);
        const errorMessage = err instanceof Error ? err.message : '자리 신청에 실패했습니다.';
        if (errorMessage === SEAT_TAKEN_MESSAGE) setReloadKey(k => k + 1);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [profileId, selectedRoom, selectedDate]
  );

  // 자리 이동 (예약 변경) - 현재 열람실 내 예약만 대상
  const changeSeat = useCallback(
    async (newSeatNumber: string): Promise<void> => {
      const roomReservations = selectedRoom
        ? myReservations.filter(r => r.room_id === selectedRoom.id)
        : [];
      if (roomReservations.length === 0) {
        throw new Error('변경할 예약이 없습니다.');
      }
      if (!selectedRoom) {
        throw new Error('열람실을 선택해주세요.');
      }

      try {
        setIsLoading(true);
        setError(null);

        // 현재 열람실의 예약만 순회하며 이동
        const updatedReservations = await Promise.all(
          roomReservations.map(res =>
            moveReservation(res.id, selectedRoom.id, newSeatNumber, selectedDate)
          )
        );

        // Optimistic Update: 기존 예약 제거 및 업데이트된 예약 추가
        setMyReservations(prev => {
          const updatedIds = new Set(updatedReservations.map(r => r.id));
          const unchanged = prev.filter(r => !updatedIds.has(r.id));
          return [...unchanged, ...updatedReservations];
        });
        // FIXED 이동은 기간 안의 내 예약을 한꺼번에 옮기지만 대표 1건만 돌려준다 → 다시 읽어 맞춘다
        if (selectedRoom.reservation_mode === 'FIXED') setReloadKey(k => k + 1);
      } catch (err) {
        console.error('changeSeat error:', err);
        const errorMessage = err instanceof Error ? err.message : '자리 이동에 실패했습니다.';
        if (errorMessage === SEAT_TAKEN_MESSAGE) setReloadKey(k => k + 1);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [myReservations, selectedRoom, selectedDate]
  );

  // 자리 신청 취소 - 같은 풀의 예약 취소
  const cancelMyReservation = useCallback(async (): Promise<void> => {
    if (!selectedRoom) throw new Error('열람실을 선택해주세요.');
    const poolReservations = selectedRoom.allow_duplicate_reservation
      ? myReservations.filter(r => r.room_id === selectedRoom.id)
      : myReservations.filter(r => !dupRoomIdSet.has(r.room_id));
    if (poolReservations.length === 0) {
      throw new Error('취소할 예약이 없습니다.');
    }

    try {
      setIsLoading(true);
      setError(null);

      // 같은 풀의 예약 취소
      await Promise.all(poolReservations.map(res => cancelReservation(res.id)));

      // Optimistic Update: 취소된 예약 제거
      const cancelledIds = new Set(poolReservations.map(r => r.id));
      setMyReservations(prev => prev.filter(r => !cancelledIds.has(r.id)));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '예약 취소에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [myReservations, selectedRoom, dupRoomIdSet]);

  return {
    studyRooms,
    selectedRoom,
    selectRoom,
    selectedDate,
    setSelectedDate,
    reservations,
    occupiedSeats,
    myReservations,
    myPoolReservations,
    isLoading,
    error,
    makeReservation,
    cancelMyReservation,
    changeSeat,
  };
};
