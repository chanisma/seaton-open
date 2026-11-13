import { supabase } from '@/lib/supabase';

import type { StudyRoom, SeatReservation, DayPeriodSelection } from '../types/reservation.types';
import type { Profile } from '../types/user.types';
import { formatDate } from '@utils/dateHelpers';
import {
  enrichWithResourceMeta,
  getStudentGradeByEmail,
  searchStudentByNumber,
} from '@utils/resourceEnrichment';

import { withTimeout } from '@utils/promiseHelpers';
import {
  findSeatConflict,
  isSeatTakenError,
  SEAT_TAKEN_MESSAGE,
  type SeatOccupancy,
} from '@utils/seatOccupancy';
import { isBefore, isAfter, eachDayOfInterval, parseISO } from 'date-fns';

// 생성된 Database 타입에 아직 없는 RPC(seaton_*)를 부르기 위한 느슨한 핸들
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Supabase 기본 1000행 제한을 우회하기 위한 페이징 조회 헬퍼
 * queryFactory: 매 페이지마다 새 쿼리 빌더를 생성하는 팩토리 함수
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchAllPaginated = async <T = any>(
  queryFactory: () => any,
  pageSize = 1000
): Promise<T[]> => {
  let allData: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allData;
};

/**
 * 중복 신청 허용 열람실 ID 목록 조회
 */
const getDuplicateAllowedRoomIds = async (): Promise<string[]> => {
  const { data } = await supabase
    .from('study_rooms')
    .select('id')
    .eq('allow_duplicate_reservation', true);
  return (data || []).map((r: any) => r.id);
};

/**
 * 풀 기반 쿼리 필터 적용
 * - 중복 허용 열람실: 현재 열람실 내에서만 충돌 체크 (다른 열람실 예약과 무관)
 * - 일반 열람실: 다른 중복 허용 열람실 예약은 제외하고 충돌 체크
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyPoolFilter = <T extends Record<string, any>>(
  query: T,
  isAllowDuplicate: boolean,
  dupRoomIds: string[],
  currentRoomId?: string
): T => {
  if (isAllowDuplicate && currentRoomId) {
    // 중복 허용: 현재 열람실 내에서만 중복 체크
    return (query as any).eq('room_id', currentRoomId);
  }
  if (dupRoomIds.length === 0) return query;
  // 일반 열람실: 중복 허용 열람실 예약은 충돌 대상에서 제외
  return (query as any).not('room_id', 'in', `(${dupRoomIds.join(',')})`);
};

/**
 * 학년별 열람실 목록 조회 (config 기반)
 * 각 학년마다 하나의 열람실만 존재
 */
export const getStudyRoomsByGrade = async (grade: number): Promise<StudyRoom[]> => {
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .contains('grades', [grade])
    .eq('is_active', true)
    .order('name')
    .returns<any[]>();

  if (error) {
    console.error('Error fetching study rooms:', error);
    return [];
  }

  return data || [];
};

/**
 * 열람실 단건 조회
 */
export const getStudyRoom = async (roomId: string): Promise<StudyRoom | null> => {
  const { data, error } = await supabase.from('study_rooms').select('*').eq('id', roomId).single();

  if (error) {
    console.error('Error fetching study room:', error);
    return null;
  }

  return data as unknown as StudyRoom;
};

/**
 * 좌석 점유 조회 (RPC seaton_seat_occupancy)
 * 학생은 다른 학생의 예약 행을 읽을 수 없으므로(2026-10-09 공유 DB 계약) 좌석이 찼는지만 받는다.
 * PostgREST 1000행 제한이 RPC 결과에도 걸리므로 .range() 로 나눠 받는다.
 */
const fetchSeatOccupancy = async (
  roomId: string,
  startDate: string,
  endDate: string,
  seatNumber?: string
): Promise<SeatOccupancy[]> => {
  const rows = await fetchAllPaginated<SeatOccupancy>(() =>
    db.rpc('seaton_seat_occupancy', {
      p_room: roomId,
      p_start: startDate,
      p_end: endDate,
      p_seat: seatNumber ?? null,
    })
  );
  return rows.map(r => ({ ...r, period_id: r.period_id ?? 0, is_mine: !!r.is_mine }));
};

/**
 * 특정 날짜, 열람실의 좌석 점유 현황 조회 (WEEKLY)
 */
export const getReservationsByDateAndRoom = async (
  roomId: string,
  date: Date
): Promise<SeatOccupancy[]> => {
  const dateStr = formatDate(date);

  try {
    return (await withTimeout(
      fetchSeatOccupancy(roomId, dateStr, dateStr),
      10000,
      'Query timeout after 10 seconds'
    )) as SeatOccupancy[];
  } catch (err) {
    console.error('getReservationsByDateAndRoom exception:', err);
    throw new Error('예약 정보를 불러오는데 실패했습니다.');
  }
};

/**
 * 학생의 특정 날짜 예약 조회
 * @param profileId - 사용자의 profiles.id (auth.uid())
 */
export const getMyReservationByDate = async (
  profileId: string,
  date: Date
): Promise<SeatReservation[]> => {
  const dateStr = formatDate(date);

  try {
    const queryPromise = supabase
      .from('seat_reservations')
      .select('*')
      .eq('student_id', profileId)
      .eq('reservation_date', dateStr);

    const { data, error } = (await withTimeout(
      queryPromise,
      10000,
      'Query timeout after 10 seconds'
    )) as any;

    if (error) {
      console.error('Error fetching my reservation:', error);
      throw new Error('내 예약 정보를 불러오는데 실패했습니다.');
    }

    return data || [];
  } catch (err) {
    console.error('getMyReservationByDate exception:', err);
    throw err;
  }
};

/**
 * 열람실의 운영 기간 내 좌석 점유 현황 조회 (FIXED 모드용)
 */
export const getReservationsByRoomAndDateRange = async (
  roomId: string,
  startDate: string,
  endDate: string
): Promise<SeatOccupancy[]> => {
  try {
    return await fetchSeatOccupancy(roomId, startDate, endDate);
  } catch (err) {
    console.error('getReservationsByRoomAndDateRange exception:', err);
    throw new Error('예약 정보를 불러오는데 실패했습니다.');
  }
};

/**
 * 학생의 운영 기간 내 예약 조회 (FIXED 모드용)
 */
export const getMyReservationsByDateRange = async (
  profileId: string,
  startDate: string,
  endDate: string
): Promise<SeatReservation[]> => {
  try {
    const data = await fetchAllPaginated<SeatReservation>(() =>
      supabase
        .from('seat_reservations')
        .select('*')
        .eq('student_id', profileId)
        .gte('reservation_date', startDate)
        .lte('reservation_date', endDate)
    );
    return data;
  } catch (err) {
    console.error('getMyReservationsByDateRange exception:', err);
    throw err;
  }
};

/**
 * 자리 신청
 * @param profileId - 사용자의 profiles.id (auth.uid())
 * @param periodIds - 신청할 교시 ID 목록 (없으면 [0]으로 처리)
 */
export const createReservation = async (
  profileId: string,
  roomId: string,
  seatNumber: string,
  date: Date,
  periodIds?: number[],
  dayPeriodSelections?: DayPeriodSelection,
  skipBookingCheck?: boolean,
  skipPoolCheck?: boolean
): Promise<SeatReservation[]> => {
  const dateStr = formatDate(date);

  // 0. 열람실 정보 조회 (모드 확인)
  const room = await getStudyRoom(roomId);
  if (!room) {
    throw new Error('열람실 정보를 찾을 수 없습니다.');
  }

  // 열람실이 실제로 운영하는 교시 목록 (교시 미운영이면 빈 배열)
  // 호출부(UI)에 이전 열람실의 교시 선택이 남아 있을 수 있으므로 항상 서버 기준으로 보정한다.
  const roomPeriodIds =
    room.use_periods && room.operating_periods && room.operating_periods.length > 0
      ? room.operating_periods.map(p => p.id)
      : [];

  /** 요청된 교시를 해당 열람실이 실제 운영하는 교시로 클램프 (0=종일은 항상 허용) */
  const clampPeriodIds = (ids?: number[]): number[] => {
    if (roomPeriodIds.length === 0) return [0]; // 교시 미운영 열람실 → 항상 종일 1건
    const requested = ids && ids.length > 0 ? [...new Set(ids)] : [0];
    const valid = requested.filter(id => id === 0 || roomPeriodIds.includes(id));
    return valid.length > 0 ? valid : [0];
  };

  const targetPeriodIds = clampPeriodIds(periodIds);

  // 교시 미운영 열람실에는 요일별 교시 선택을 적용하지 않는다.
  const effectiveDayPeriodSelections: DayPeriodSelection | undefined =
    roomPeriodIds.length === 0 || !dayPeriodSelections
      ? undefined
      : (Object.fromEntries(
          Object.entries(dayPeriodSelections).map(([day, ids]) => [
            Number(day),
            [...new Set(ids ?? [])].filter(id => id === 0 || roomPeriodIds.includes(id)),
          ])
        ) as DayPeriodSelection);

  // FIXED 모드 처리 (교시 미지원 가정 - 기간제)
  if (room.reservation_mode === 'FIXED') {
    const now = new Date();

    // 예약 가능 기간 체크 (admin은 스킵 가능)
    if (!skipBookingCheck) {
      const windows =
        room.booking_windows && room.booking_windows.length > 0
          ? room.booking_windows
          : room.booking_start_date || room.booking_end_date
            ? [{ id: 0, start: room.booking_start_date || '', end: room.booking_end_date || '' }]
            : [];

      if (windows.length > 0) {
        const isWithinAnyWindow = windows.some(w => {
          const afterStart = !w.start || !isBefore(now, parseISO(w.start));
          const beforeEnd = !w.end || !isAfter(now, parseISO(w.end));
          return afterStart && beforeEnd;
        });

        if (!isWithinAnyWindow) {
          // 다음 접수 기간이 있으면 안내
          const nextWindow = windows
            .filter(w => w.start && isBefore(now, parseISO(w.start)))
            .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())[0];

          if (nextWindow) {
            const nextDate = new Date(nextWindow.start).toLocaleString('ko-KR');
            throw new Error(
              `현재 예약 접수 기간이 아닙니다. 다음 접수: ${nextWindow.label || ''} ${nextDate}`
            );
          }
          throw new Error('예약 접수 기간이 지났습니다.');
        }
      }
    }

    if (!room.fixed_start_date || !room.fixed_end_date) {
      throw new Error('운영 기간이 설정되지 않았습니다.');
    }

    const startDate = parseISO(room.fixed_start_date);
    const endDate = parseISO(room.fixed_end_date);

    // 운영 기간 내 모든 날짜 생성 (운영하지 않는 요일 제외)
    const roomOpDays =
      room.operating_days && room.operating_days.length > 0
        ? room.operating_days
        : (() => {
            const d = [1, 2, 3, 4, 5];
            if (room.is_saturday_open) d.push(6);
            if (room.is_sunday_open) d.push(0);
            return d;
          })();
    const dates = eachDayOfInterval({ start: startDate, end: endDate }).filter(d => {
      return roomOpDays.includes(d.getDay());
    });

    if (dates.length === 0) {
      throw new Error('예약 가능한 날짜가 없습니다 (주말 운영 설정 확인 필요).');
    }

    const dateStrings = dates.map(d => formatDate(d));

    // 요일별 교시 매핑 생성: dayPeriodSelections가 있으면 요일별 다른 교시, 없으면 모든 날짜에 동일 교시
    const getPeriodsForDate = (dStr: string): number[] => {
      if (effectiveDayPeriodSelections) {
        const dayOfWeek = new Date(dStr).getDay();
        return effectiveDayPeriodSelections[dayOfWeek] ?? targetPeriodIds;
      }
      return targetPeriodIds;
    };

    // 모든 날짜에 대해 적용될 교시 ID 전체 집합 (중복 체크용)
    const allRequestedPeriodIds = effectiveDayPeriodSelections
      ? [...new Set(Object.values(effectiveDayPeriodSelections).flat())]
      : targetPeriodIds;

    // 1. 중복 신청 체크 (해당 기간 내에 이미 내 예약이 있는지)
    if (!skipPoolCheck) {
      let myExistingQuery = supabase
        .from('seat_reservations')
        .select('reservation_date, period_id')
        .eq('student_id', profileId)
        .in('reservation_date', dateStrings);

      const dupRoomIds = await getDuplicateAllowedRoomIds();
      myExistingQuery = applyPoolFilter(
        myExistingQuery,
        !!room.allow_duplicate_reservation,
        dupRoomIds,
        roomId
      );

      const { data: myExisting } = await myExistingQuery;

      if (myExisting && myExisting.length > 0) {
        if (myExisting.some((r: any) => r.period_id === 0)) {
          throw new Error('해당 기간에 이미 종일 예약된 내역이 있습니다.');
        }
        if (allRequestedPeriodIds.includes(0)) {
          throw new Error('해당 기간에 이미 교시 예약이 있어 종일 예약을 할 수 없습니다.');
        }
        for (const existing of myExisting as any[]) {
          const periodsForDay = getPeriodsForDate(existing.reservation_date);
          if (periodsForDay.includes(existing.period_id)) {
            throw new Error('해당 기간에 이미 예약된 교시가 있습니다.');
          }
        }
      }
    }

    // 2. 좌석 중복 체크 (해당 기간 내에 해당 좌석이 하루라도 점유되었는지)
    //    남의 예약 행은 읽을 수 없으므로 점유 RPC 로 확인한다. 종일(0) ↔ 교시 충돌도 여기서 잡는다.
    let seatCheck: SeatOccupancy[];
    try {
      const requestedDates = new Set(dateStrings);
      seatCheck = (
        await fetchSeatOccupancy(
          roomId,
          dateStrings[0],
          dateStrings[dateStrings.length - 1],
          seatNumber
        )
      ).filter(r => requestedDates.has(r.reservation_date));
    } catch (seatCheckError) {
      console.error('Error checking seat availability:', seatCheckError);
      throw new Error('좌석 확인 중 오류가 발생했습니다.');
    }

    const fixedConflict = findSeatConflict(seatCheck, getPeriodsForDate);
    if (fixedConflict) {
      if (fixedConflict.kind === 'existing_all_day') {
        throw new Error('해당 기간에 이미 종일 예약된 좌석입니다.');
      }
      if (fixedConflict.kind === 'requested_all_day') {
        throw new Error('해당 기간에 이미 교시 예약이 있어 종일 예약을 할 수 없습니다.');
      }
      throw new Error('해당 기간에 이미 예약된 좌석입니다.');
    }

    // 3. 일괄 신청 (요일별 교시 적용)
    const reservationsToInsert = [];
    for (const dStr of dateStrings) {
      const periodsForDay = getPeriodsForDate(dStr);
      for (const pid of periodsForDay) {
        reservationsToInsert.push({
          student_id: profileId,
          room_id: roomId,
          seat_number: seatNumber,
          reservation_date: dStr,
          period_id: pid,
        });
      }
    }

    const { data, error } = await supabase
      .from('seat_reservations')
      .insert(reservationsToInsert as any)
      .select();

    if (error) {
      console.error('Error creating fixed reservations:', error);
      if (isSeatTakenError(error)) throw new Error(SEAT_TAKEN_MESSAGE);
      throw new Error(`자리 신청에 실패했습니다: ${error.message} `);
    }

    return data as SeatReservation[];
  }

  // WEEKLY (기존) 모드 처리
  // 0.5 운영 요일 확인
  const weeklyOpDays =
    room.operating_days && room.operating_days.length > 0
      ? room.operating_days
      : (() => {
          const d = [1, 2, 3, 4, 5];
          if (room.is_saturday_open) d.push(6);
          if (room.is_sunday_open) d.push(0);
          return d;
        })();
  const dayOfWeek = date.getDay();
  if (!weeklyOpDays.includes(dayOfWeek)) {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    throw new Error(`해당 열람실은 ${dayNames[dayOfWeek]}요일에 운영하지 않습니다.`);
  }

  // const targetPeriodIds = periodIds && periodIds.length > 0 ? periodIds : [0]; // Already defined above

  // 1. 중복 신청 체크
  if (!skipPoolCheck) {
    let myExistingWeeklyQuery = supabase
      .from('seat_reservations')
      .select('id, period_id')
      .eq('student_id', profileId)
      .eq('reservation_date', dateStr);

    const dupRoomIds = await getDuplicateAllowedRoomIds();
    myExistingWeeklyQuery = applyPoolFilter(
      myExistingWeeklyQuery,
      !!room.allow_duplicate_reservation,
      dupRoomIds,
      roomId
    );

    const { data: myExisting, error: myCheckError } = await myExistingWeeklyQuery.returns<any[]>();

    if (myCheckError) {
      throw new Error('예약 확인 중 오류가 발생했습니다.');
    }

    if (myExisting && myExisting.length > 0) {
      if (myExisting.some((r: any) => r.period_id === 0)) {
        throw new Error('이미 해당 날짜에 종일 예약이 있습니다.');
      }
      if (targetPeriodIds.includes(0)) {
        throw new Error('이미 해당 날짜에 교시 예약이 있어 종일 예약을 할 수 없습니다.');
      }
      for (const pid of targetPeriodIds) {
        if (myExisting.some((r: any) => r.period_id === pid)) {
          throw new Error('이미 해당 교시에 예약이 있습니다.');
        }
      }
    }
  }

  // 2. 좌석 중복 체크 (점유 RPC — 종일(0) ↔ 교시 충돌 포함)
  let seatCheck: SeatOccupancy[];
  try {
    seatCheck = await fetchSeatOccupancy(roomId, dateStr, dateStr, seatNumber);
  } catch (seatCheckError) {
    console.error('Error checking seat availability:', seatCheckError);
    throw new Error('좌석 확인 중 오류가 발생했습니다.');
  }

  const weeklyConflict = findSeatConflict(seatCheck, () => targetPeriodIds);
  if (weeklyConflict) {
    if (weeklyConflict.kind === 'existing_all_day') {
      throw new Error('이미 종일 예약된 좌석입니다.');
    }
    if (weeklyConflict.kind === 'requested_all_day') {
      throw new Error('해당 좌석에 이미 교시 예약이 있어 종일 예약을 할 수 없습니다.');
    }
    throw new Error('이미 해당 교시에 예약된 좌석입니다.');
  }

  // 3. 신청 (일괄 insert)
  const reservationsToInsert = targetPeriodIds.map(pid => ({
    student_id: profileId,
    room_id: roomId,
    seat_number: seatNumber,
    reservation_date: dateStr,
    period_id: pid,
  }));

  const { data, error } = await supabase
    .from('seat_reservations')
    .insert(reservationsToInsert as any)
    .select();

  if (error) {
    console.error('Error creating reservation:', error);
    if (isSeatTakenError(error)) throw new Error(SEAT_TAKEN_MESSAGE);
    throw new Error(`자리 신청에 실패했습니다: ${error.message || '알 수 없는 오류'} `);
  }

  return data as SeatReservation[];
};

/**
 * FIXED 열람실의 운영 기간(fixed_start_date ~ fixed_end_date).
 * 이동/취소는 이 범위 밖의 예약(진행 중인 이전 기간, 아직 오지 않은 다음 기간)을 건드리면 안 된다.
 * 기간이 비어 있는 레거시 열람실은 범위를 걸지 않는다.
 */
const getFixedPeriodRange = (
  room: { fixed_start_date?: string | null; fixed_end_date?: string | null } | null | undefined
): { periodStart?: string; periodEnd?: string } => ({
  periodStart: room?.fixed_start_date || undefined,
  periodEnd: room?.fixed_end_date || undefined,
});

/**
 * 자리 이동 (예약 변경)
 */
export const moveReservation = async (
  reservationId: string,
  roomId: string,
  newSeatNumber: string,
  date: Date
): Promise<SeatReservation> => {
  const dateStr = formatDate(date);

  // 1. 기존 예약 정보 조회
  const { data: reservation, error: fetchError } = await supabase
    .from('seat_reservations')
    .select('*, study_rooms!inner(reservation_mode, fixed_start_date, fixed_end_date)')
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    console.error('Error fetching reservation for move:', fetchError);
    throw new Error('예약 정보를 찾을 수 없습니다.');
  }

  const reservationData = reservation as any;
  const roomInfo = reservationData.study_rooms;
  const isFixedMode = roomInfo?.reservation_mode === 'FIXED';

  if (isFixedMode) {
    // FIXED 모드: 현재 접수 중인 운영 기간(fixed_start_date ~ fixed_end_date) 안에서만 좌석을 옮긴다.
    // 하한/상한을 모두 걸지 않으면 아직 진행 중인 이전 기간이나 다음 기간 예약까지 함께 바뀐다.
    const todayStr = formatDate(new Date());
    const { periodStart, periodEnd } = getFixedPeriodRange(roomInfo);

    // 지난 날짜는 출석 기록이 이미 확정되어 있으므로 좌석을 바꾸지 않는다.
    const fromDate = periodStart && periodStart > todayStr ? periodStart : todayStr;

    if (periodEnd && fromDate > periodEnd) {
      throw new Error('운영 기간이 종료되어 자리를 옮길 수 없습니다.');
    }

    const withPeriodRange = <T extends { gte: any; lte: any }>(query: T): T => {
      let q = query.gte('reservation_date', fromDate);
      if (periodEnd) q = q.lte('reservation_date', periodEnd);
      return q;
    };

    // 1-1. 대상 예약 조회 (운영 기간 내 내 예약)
    const { data: myFutureReservations, error: myFutureError } = await withPeriodRange(
      supabase
        .from('seat_reservations')
        .select('reservation_date, id, period_id')
        .eq('room_id', roomId)
        .eq('student_id', reservationData.student_id)
    );

    if (myFutureError || !myFutureReservations || myFutureReservations.length === 0) {
      throw new Error('변경할 예약 내역을 찾을 수 없습니다.');
    }

    // 날짜별로 옮길 내 교시
    const myPeriodsByDate = new Map<string, number[]>();
    for (const r of myFutureReservations as any[]) {
      const list = myPeriodsByDate.get(r.reservation_date) ?? [];
      list.push(r.period_id ?? 0);
      myPeriodsByDate.set(r.reservation_date, list);
    }
    const targetDates = [...myPeriodsByDate.keys()].sort();

    // 1-2. 이동할 좌석이 해당 날짜들에 비어있는지 확인 (점유 RPC)
    // (내 예약은 전부 함께 옮겨지므로 충돌 대상에서 제외 — 제외하지 않으면 재시도 시 자기 자신과 충돌한다)
    let conflictRows: SeatOccupancy[];
    try {
      conflictRows = (
        await fetchSeatOccupancy(
          roomId,
          targetDates[0],
          targetDates[targetDates.length - 1],
          newSeatNumber
        )
      ).filter(r => !r.is_mine);
    } catch (conflictError) {
      console.error('Error checking seat conflicts:', conflictError);
      throw new Error('좌석 확인 중 오류가 발생했습니다.');
    }

    const moveConflict = findSeatConflict(conflictRows, date => myPeriodsByDate.get(date) ?? []);
    if (moveConflict) {
      // 어떤 날짜에 차 있는지 알려줌
      throw new Error(`해당 좌석은 이미 예약되어 있습니다. (${moveConflict.reservation_date} 등)`);
    }

    // 1-3. 일괄 업데이트
    const { data, error } = await withPeriodRange(
      supabase
        .from('seat_reservations')
        // @ts-ignore
        .update({
          seat_number: newSeatNumber,
        } as any)
        .eq('room_id', roomId)
        .eq('student_id', reservationData.student_id)
    )
      .select()
      .order('reservation_date');

    if (error) {
      console.error('Error moving fixed reservations:', error);
      if (isSeatTakenError(error)) throw new Error(SEAT_TAKEN_MESSAGE);
      throw new Error(`자리 이동에 실패했습니다: ${error.message} `);
    }

    // 배열의 첫 번째 항목 반환 (또는 적절한 로직)
    return data && data.length > 0
      ? (data[0] as SeatReservation)
      : (reservation as unknown as SeatReservation);
  } else {
    // WEEKLY 모드: 기존 로직 (단건 이동)
    // 1. 이동할 좌석이 비어있는지 확인 (점유 RPC)
    //    이 예약의 교시와 겹치는 «남의» 칸만 충돌이다. 종일(0)은 모든 교시와 겹친다.
    //    (예전 maybeSingle 은 교시가 여러 줄이면 오류가 났고, 함께 옮기는 내 다른 교시와도 충돌했다)
    const movingDate = reservationData.reservation_date || dateStr;
    const movingPeriod: number = reservationData.period_id ?? 0;
    let seatCheck: SeatOccupancy[];
    try {
      seatCheck = (await fetchSeatOccupancy(roomId, movingDate, movingDate, newSeatNumber)).filter(
        r => !r.is_mine
      );
    } catch (seatCheckError) {
      console.error('Error checking target seat availability:', seatCheckError);
      throw new Error('이동할 좌석 확인 중 오류가 발생했습니다.');
    }

    if (findSeatConflict(seatCheck, () => [movingPeriod])) {
      throw new Error('이미 다른 학생이 예약한 좌석입니다.');
    }

    // 2. 예약 업데이트
    const updatePromise = supabase
      .from('seat_reservations')
      // @ts-ignore
      .update({
        seat_number: newSeatNumber,
      } as any)
      .eq('id', reservationId)
      .select()
      .maybeSingle();

    const { data, error } = (await withTimeout(
      updatePromise,
      10000,
      'Update timeout after 10 seconds'
    )) as any;

    if (error) {
      console.error('Error moving reservation:', error);
      if (isSeatTakenError(error)) throw new Error(SEAT_TAKEN_MESSAGE);
      throw new Error(`자리 이동에 실패했습니다: ${error.message || '알 수 없는 오류'} `);
    }

    if (!data) {
      throw new Error('자리 이동에 실패했습니다. 예약 정보를 찾을 수 없거나 권한이 없습니다.');
    }

    return data;
  }
};

/**
 * 자리 신청 취소
 */
export const cancelReservation = async (reservationId: string): Promise<void> => {
  // 1. 예약 정보 조회 (room_id, student_id 확인)
  const { data: reservation, error: fetchError } = await supabase
    .from('seat_reservations')
    .select('*, study_rooms!inner(reservation_mode, fixed_start_date, fixed_end_date)')
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    console.error('Error fetching reservation for cancellation:', fetchError);
    throw new Error('예약 정보를 찾을 수 없습니다.');
  }

  const reservationData = reservation as any;
  const roomInfo = reservationData.study_rooms;
  const isFixedMode = roomInfo?.reservation_mode === 'FIXED';

  // 당일 예약 취소 시간 제한 (18:30) - 서버사이드 검증
  const now = new Date();
  const todayStr = formatDate(now);
  const cutoff = new Date(now);
  cutoff.setHours(18, 30, 0, 0);
  const isPastCutoff = now > cutoff;

  if (isFixedMode) {
    // FIXED 모드: 18:30 이후면 내일부터 삭제 (오늘 예약은 보존)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const deleteFromDate = isPastCutoff ? formatDate(tomorrow) : todayStr;

    // 이동과 동일하게, 취소도 현재 운영 기간 안에서만 이뤄져야 한다.
    // (기간 상한이 없으면 아직 진행 중인 이전 기간 예약까지 함께 삭제된다)
    const { periodStart, periodEnd } = getFixedPeriodRange(roomInfo);
    const fromDate = periodStart && periodStart > deleteFromDate ? periodStart : deleteFromDate;

    let deleteQuery = supabase
      .from('seat_reservations')
      .delete()
      .eq('room_id', reservationData.room_id)
      .eq('student_id', reservationData.student_id)
      .gte('reservation_date', fromDate);

    if (periodEnd) {
      deleteQuery = deleteQuery.lte('reservation_date', periodEnd);
    }

    const { error } = await deleteQuery;

    if (error) {
      console.error('Error canceling fixed reservation:', error);
      throw new Error('자리 신청 취소에 실패했습니다.');
    }
  } else {
    // WEEKLY 모드: 당일 예약은 18:30 이후 취소 불가
    if (reservationData.reservation_date === todayStr && isPastCutoff) {
      throw new Error('당일 예약 취소는 18:30까지만 가능합니다.');
    }

    const { error } = await supabase.from('seat_reservations').delete().eq('id', reservationId);

    if (error) {
      console.error('Error canceling reservation:', error);
      throw new Error('자리 신청 취소에 실패했습니다.');
    }
  }
};

/**
 * 학생의 전체 예약 히스토리 조회
 * @param profileId - 사용자의 profiles.id (auth.uid())
 */
export const getMyReservationHistory = async (
  profileId: string,
  limit = 200
): Promise<SeatReservation[]> => {
  const { data, error } = await supabase
    .from('seat_reservations')
    .select('*, study_rooms!room_id(id, name)')
    .eq('student_id', profileId)
    .order('reservation_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reservation history:', error);
    throw new Error('예약 내역을 불러오는데 실패했습니다.');
  }

  return (data || []) as unknown as SeatReservation[];
};

/**
 * 학생의 주간 예약 목록 조회
 * @param profileId - 사용자의 profiles.id (auth.uid())
 */
export const getMyWeekReservations = async (
  profileId: string,
  weekDates: Date[]
): Promise<SeatReservation[]> => {
  const dateStrs = weekDates.map(formatDate);

  const { data, error } = await supabase
    .from('seat_reservations')
    .select('*')
    .eq('student_id', profileId)
    .in('reservation_date', dateStrs)
    .order('reservation_date');

  if (error) {
    console.error('Error fetching week reservations:', error);
    throw new Error('주간 예약 정보를 불러오는데 실패했습니다.');
  }

  // is_attended / created_at은 DB에서 nullable이라 도메인 타입 기본값으로 보정합니다.
  // attendance_status는 DB가 TEXT라 유니온으로 좁혀지지 않으므로 위 함수와 같이 캐스팅합니다.
  return (data || []).map(row => ({
    ...row,
    is_attended: row.is_attended ?? false,
    created_at: row.created_at ?? '',
  })) as unknown as SeatReservation[];
};

/**
 * 신청 설정 조회
 */
export const getReservationSettings = async () => {
  const { data, error } = await supabase.from('reservation_settings').select('*').single();

  if (error) {
    console.error('Error fetching reservation settings:', error);
    // 기본값 반환
    return {
      reservation_open_day: 0, // 일요일
      reservation_open_time: '20:00',
      max_days_ahead: 5,
      terms_and_conditions: '',
    };
  }

  return data;
};

/**
 * 출석 체크 (교사용)
 * @param teacherProfileId - 교사의 profiles.id (auth.uid())
 */
export const checkAttendance = async (
  reservationId: string,
  teacherProfileId: string
): Promise<SeatReservation> => {
  const { data, error } = await supabase
    .from('seat_reservations')
    .update({
      is_attended: true,
      attended_at: new Date().toISOString(),
      checked_by: teacherProfileId,
      attendance_status: 'attended',
    } as unknown as never)
    .eq('id', reservationId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error checking attendance:', error);
    throw new Error(`출석 체크에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
  }

  if (!data) {
    throw new Error('해당 예약을 찾을 수 없습니다.');
  }

  return data as SeatReservation;
};

/**
 * 출석 체크 취소 (교사용)
 */
export const uncheckAttendance = async (reservationId: string): Promise<SeatReservation> => {
  const { data, error } = await supabase
    .from('seat_reservations')
    .update({
      is_attended: false,
      attended_at: null,
      checked_by: null,
      attendance_status: null,
    } as unknown as never)
    .eq('id', reservationId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error unchecking attendance:', error);
    throw new Error(`출석 체크 취소에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
  }

  if (!data) {
    throw new Error('해당 예약을 찾을 수 없습니다.');
  }

  return data as SeatReservation;
};

/**
 * 인정출석 체크 (교사용)
 * @param teacherProfileId - 교사의 profiles.id (auth.uid())
 */
export const checkExcusedAttendance = async (
  reservationId: string,
  teacherProfileId: string
): Promise<SeatReservation> => {
  const { data, error } = await supabase
    .from('seat_reservations')
    .update({
      is_attended: true,
      attended_at: new Date().toISOString(),
      checked_by: teacherProfileId,
      attendance_status: 'excused',
    } as unknown as never)
    .eq('id', reservationId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error checking excused attendance:', error);
    throw new Error(`인정출석 처리에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
  }

  if (!data) {
    throw new Error('해당 예약을 찾을 수 없습니다.');
  }

  return data as SeatReservation;
};

/**
 * 보완 출석 체크 (순공 열람실 전용)
 * 약점 과목 보완 학습으로 참여한 교시 처리. 출석부에는 과목명으로 표기됨.
 * @param teacherProfileId - 교사의 profiles.id (auth.uid())
 */
export const checkSupplementAttendance = async (
  reservationId: string,
  teacherProfileId: string
): Promise<SeatReservation> => {
  const { data, error } = await supabase
    .from('seat_reservations')
    .update({
      is_attended: true,
      attended_at: new Date().toISOString(),
      checked_by: teacherProfileId,
      attendance_status: 'supplement',
    } as unknown as never)
    .eq('id', reservationId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error checking supplement attendance:', error);
    throw new Error(`보완 처리에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
  }

  if (!data) {
    throw new Error('해당 예약을 찾을 수 없습니다.');
  }

  return data as SeatReservation;
};

/**
 * 특정 날짜의 모든 열람실 예약 조회 (교사용)
 * profiles 정보 포함
 */
export const getAllReservationsByDate = async (date: Date): Promise<SeatReservation[]> => {
  const dateStr = formatDate(date);

  try {
    // student_id 관계를 명시적으로 지정 (checked_by와 구분하기 위해)
    const queryPromise = supabase
      .from('seat_reservations')
      .select('*, profiles!student_id(id, email, name), checker:profiles!checked_by(id, name)')
      .eq('reservation_date', dateStr)
      .order('room_id')
      .order('seat_number');

    const { data, error } = (await withTimeout(
      queryPromise,
      10000,
      'Query timeout after 10 seconds'
    )) as any;

    if (error) {
      console.error('Error fetching all reservations:', error);
      throw new Error('예약 정보를 불러오는데 실패했습니다.');
    }

    return await enrichWithResourceMeta(data || []);
  } catch (err) {
    console.error('getAllReservationsByDate exception:', err);
    throw err;
  }
};

/**
 * 학생의 현재 온도 조회 (전체 기록 기반)
 */
export const getStudentTemperature = async (profileId: string): Promise<number> => {
  const { data, error } = await supabase.rpc('calculate_student_temperature', {
    student_uuid: profileId,
  } as any);

  if (error) {
    console.error('Error fetching student temperature:', error);
    return 28.0;
  }

  return data || 28.0;
};

/**
 * 여러 학생의 온도 일괄 조회
 */
export const getTemperaturesForStudents = async (
  studentIds: string[]
): Promise<Record<string, number>> => {
  if (studentIds.length === 0) return {};

  // Batch RPC 호출로 최적화
  try {
    const { data, error } = await supabase.rpc('calculate_student_temperatures_batch', {
      student_uuids: studentIds,
    });

    if (error) {
      console.error('Error fetching student temperatures batch:', error);
      // 에러 시 기본값 반환
      return studentIds.reduce((acc, id) => ({ ...acc, [id]: 28.0 }), {});
    }

    const resultMap: Record<string, number> = {};
    // 기본값 초기화 (혹시 결과가 없는 경우 대비)
    studentIds.forEach(id => {
      resultMap[id] = 28.0;
    });

    // 결과 매핑
    (data as { student_id: string; temperature: number }[] | null)?.forEach(item => {
      resultMap[item.student_id] = item.temperature;
    });

    return resultMap;
  } catch (err) {
    console.error('getTemperaturesForStudents exception:', err);
    return studentIds.reduce((acc, id) => ({ ...acc, [id]: 28.0 }), {});
  }
};

/**
 * 관리자용 예약 목록 조회
 */
export const getAdminReservations = async (
  startDate: Date,
  endDate: Date,
  roomId?: string | null,
  searchQuery?: string
): Promise<SeatReservation[]> => {
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // 숫자 검색어인 경우 resource.meta에서 학번 검색하여 student_id 목록 확보
  let studentIdsByNumber: string[] = [];
  if (searchQuery && /^\d+$/.test(searchQuery)) {
    studentIdsByNumber = await searchStudentByNumber(searchQuery);
  }

  // 기본 쿼리: 기간 및 정렬
  let query = supabase
    .from('seat_reservations')
    .select(
      searchQuery
        ? '*, profiles!student_id!inner(id, email, name), study_rooms!room_id(id, name)'
        : '*, profiles!student_id(id, email, name), study_rooms!room_id(id, name)'
    )
    .gte('reservation_date', startStr)
    .lte('reservation_date', endStr)
    .order('reservation_date', { ascending: false });

  // 열람실 필터
  if (roomId) {
    query = query.eq('room_id', roomId);
  }

  // 검색어 필터 (Server-side)
  if (searchQuery) {
    const isNumeric = /^\d+$/.test(searchQuery);

    if (isNumeric && studentIdsByNumber.length > 0) {
      // 숫자 검색: 이름/이메일 OR resource 학번 매칭 student_id
      const orString = `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`;
      query = query.or(orString, { foreignTable: 'profiles' });
      // student_id로도 필터 (profiles or 조건과 합산)
      // Note: inner join + or on profiles는 이미 이름/이메일 매칭을 포함
      // 학번 매칭은 별도로 처리가 필요 - 아래에서 병합
    } else {
      const orString = `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`;
      query = query.or(orString, { foreignTable: 'profiles' });
    }
  }

  const { data, error } = (await withTimeout(
    query,
    10000,
    'Query timeout after 10 seconds'
  )) as any;

  if (error) {
    console.error('Error fetching admin reservations:', error);
    throw new Error('예약 목록을 불러오는데 실패했습니다.');
  }

  let result = data as SeatReservation[];

  // 숫자 검색이고 학번 매칭 결과가 있으면 별도 쿼리로 추가 조회 후 병합
  if (searchQuery && /^\d+$/.test(searchQuery) && studentIdsByNumber.length > 0) {
    const existingIds = new Set((result || []).map((r: any) => r.id));

    const { data: extraData } = (await withTimeout(
      supabase
        .from('seat_reservations')
        .select('*, profiles!student_id(id, email, name), study_rooms!room_id(id, name)')
        .gte('reservation_date', startStr)
        .lte('reservation_date', endStr)
        .in('student_id', studentIdsByNumber)
        .order('reservation_date', { ascending: false }),
      10000,
      'Query timeout after 10 seconds'
    )) as any;

    if (extraData) {
      // 중복 제거 후 병합
      extraData.forEach((item: any) => {
        if (!existingIds.has(item.id)) {
          result.push(item);
        }
      });
    }
  }

  // roomId 필터가 추가 쿼리에도 필요
  if (roomId && searchQuery && /^\d+$/.test(searchQuery) && studentIdsByNumber.length > 0) {
    result = result.filter((r: any) => r.room_id === roomId);
  }

  return await enrichWithResourceMeta(result || []);
};

/**
 * 예약 일괄 삭제 (관리자용)
 */
export const deleteReservations = async (reservationIds: string[]): Promise<void> => {
  if (reservationIds.length === 0) return;

  const { error } = await supabase.from('seat_reservations').delete().in('id', reservationIds);

  if (error) {
    console.error('Error deleting reservations:', error);
    throw new Error('예약 삭제에 실패했습니다.');
  }
};

/**
 * 날짜별 일괄 삭제 대상 필터
 * - dates: 삭제 대상 날짜 목록 (여러 날짜 동시 선택 지원).
 * - roomIds: 비어 있으면 전체 열람실.
 * - grades: 비어 있으면 전체 학년. 주어지면 해당 학년 학생의 예약만 대상
 *   (여러 학년이 함께 쓰는 열람실에서 한 학년만 지우는 용도).
 *   학년은 resource.meta.grade 기준이며, 학년을 알 수 없는 예약(교사 등)은 제외된다.
 */
export interface DateBulkDeleteFilter {
  dates: string[];
  roomIds?: string[];
  grades?: number[];
}

/**
 * 학년 필터가 걸려 있으면 예약 행의 profiles.email로 학년을 판정해 걸러낸다.
 * 학년 목록이 많아도 student_id 목록을 .in()으로 넘기지 않도록 클라이언트에서 거른다.
 */
const filterRowsByGrades = async <T extends { profiles?: { email?: string | null } | null }>(
  rows: T[],
  grades?: number[],
  gradeByEmail?: Map<string, number>
): Promise<T[]> => {
  if (!grades || grades.length === 0) return rows;
  const map = gradeByEmail ?? (await getStudentGradeByEmail());
  return rows.filter(r => {
    const grade = r.profiles?.email ? map.get(r.profiles.email) : undefined;
    return grade !== undefined && grades.includes(grade);
  });
};

/**
 * 날짜별 일괄 삭제용 미리보기 통계
 * - 삭제하기 전에 "몇 건이 지워지는지 / 그 중 이미 출석 처리된 건은 몇 건인지 /
 *   날짜별·열람실별·학년별 분포"를 관리자가 확인할 수 있도록 집계만 반환한다 (실제 삭제 X).
 */
export interface DateReservationStats {
  total: number;
  attended: number;
  byRoom: { roomId: string; roomName: string; count: number; attended: number }[];
  byDate: { date: string; count: number; attended: number }[];
  /** grade=null 은 학년을 알 수 없는 예약 (교사, resource 미등록 계정 등) */
  byGrade: { grade: number | null; count: number; attended: number }[];
}

export const getReservationStatsByDates = async ({
  dates,
  roomIds,
  grades,
}: DateBulkDeleteFilter): Promise<DateReservationStats> => {
  if (dates.length === 0) {
    return { total: 0, attended: 0, byRoom: [], byDate: [], byGrade: [] };
  }

  // 1000행 제한을 넘는 날짜(공휴일 전 대량 예약)도 정확히 집계하기 위해 페이징 조회
  const [allRows, gradeByEmail] = await Promise.all([
    fetchAllPaginated<any>(() => {
      let q = supabase
        .from('seat_reservations')
        .select(
          'id, room_id, reservation_date, is_attended, study_rooms!room_id(name), profiles!student_id(email)'
        )
        .in('reservation_date', dates)
        .order('id');
      if (roomIds && roomIds.length > 0) q = q.in('room_id', roomIds);
      return q;
    }),
    getStudentGradeByEmail(),
  ]);
  const rows = await filterRowsByGrades(allRows, grades, gradeByEmail);

  const byRoomMap = new Map<string, { roomName: string; count: number; attended: number }>();
  const byDateMap = new Map<string, { count: number; attended: number }>();
  const byGradeMap = new Map<number | null, { count: number; attended: number }>();
  let attended = 0;

  for (const r of rows) {
    if (r.is_attended) attended += 1;

    const roomEntry = byRoomMap.get(r.room_id) ?? {
      roomName: r.study_rooms?.name ?? '(알 수 없는 열람실)',
      count: 0,
      attended: 0,
    };
    roomEntry.count += 1;
    if (r.is_attended) roomEntry.attended += 1;
    byRoomMap.set(r.room_id, roomEntry);

    const dateEntry = byDateMap.get(r.reservation_date) ?? { count: 0, attended: 0 };
    dateEntry.count += 1;
    if (r.is_attended) dateEntry.attended += 1;
    byDateMap.set(r.reservation_date, dateEntry);

    const grade = (r.profiles?.email && gradeByEmail.get(r.profiles.email)) || null;
    const gradeEntry = byGradeMap.get(grade) ?? { count: 0, attended: 0 };
    gradeEntry.count += 1;
    if (r.is_attended) gradeEntry.attended += 1;
    byGradeMap.set(grade, gradeEntry);
  }

  const byRoom = Array.from(byRoomMap.entries())
    .map(([rid, v]) => ({
      roomId: rid,
      roomName: v.roomName,
      count: v.count,
      attended: v.attended,
    }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName, 'ko'));

  const byDate = Array.from(byDateMap.entries())
    .map(([date, v]) => ({ date, count: v.count, attended: v.attended }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 학년 오름차순, 학년 미확인(null)은 맨 뒤
  const byGrade = Array.from(byGradeMap.entries())
    .map(([grade, v]) => ({ grade, count: v.count, attended: v.attended }))
    .sort((a, b) => (a.grade ?? 99) - (b.grade ?? 99));

  return { total: rows.length, attended, byRoom, byDate, byGrade };
};

/**
 * 달력 표시용: 기간 내 날짜별 예약 건수 집계 (yyyy-MM-dd -> 건수)
 * 일괄 삭제 모달의 달력에서 "어느 날에 예약이 있는지"를 미리 보여주는 용도.
 */
export const getReservationCountsByDateRange = async (
  startDate: string,
  endDate: string,
  roomIds?: string[],
  grades?: number[]
): Promise<Record<string, number>> => {
  const useGrades = !!grades && grades.length > 0;
  const allRows = await fetchAllPaginated<any>(() => {
    let q = supabase
      .from('seat_reservations')
      .select(
        useGrades ? 'id, reservation_date, profiles!student_id(email)' : 'id, reservation_date'
      )
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .order('id');
    if (roomIds && roomIds.length > 0) q = q.in('room_id', roomIds);
    return q;
  });
  const rows = await filterRowsByGrades(allRows, grades);

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.reservation_date] = (counts[r.reservation_date] ?? 0) + 1;
  }
  return counts;
};

/**
 * 선택한 날짜들의 예약을 일괄 삭제 (공휴일/시험일 등 특별일 처리용).
 * - roomIds가 비어 있으면 해당 날짜들의 모든 열람실 예약을 삭제.
 * - grades가 주어지면 해당 학년 학생의 예약만 삭제 (대상 id를 먼저 추려 id 기준으로 삭제).
 * - 실제 삭제된 행 수를 반환한다 (count: 'exact').
 */
export const deleteReservationsByDates = async ({
  dates,
  roomIds,
  grades,
}: DateBulkDeleteFilter): Promise<number> => {
  if (dates.length === 0) return 0;

  // 학년 필터 없음: 날짜·열람실 조건으로 한 번에 삭제
  if (!grades || grades.length === 0) {
    let query = supabase
      .from('seat_reservations')
      .delete({ count: 'exact' })
      .in('reservation_date', dates);
    if (roomIds && roomIds.length > 0) query = query.in('room_id', roomIds);

    const { error, count } = await query;

    if (error) {
      console.error('Error deleting reservations by dates:', error);
      throw new Error('선택한 날짜의 예약 삭제에 실패했습니다.');
    }

    return count ?? 0;
  }

  // 학년 필터 있음: 대상 예약 id를 추린 뒤 청크 단위로 삭제 (URL 길이 제한 대비)
  const allRows = await fetchAllPaginated<any>(() => {
    let q = supabase
      .from('seat_reservations')
      .select('id, profiles!student_id(email)')
      .in('reservation_date', dates)
      .order('id');
    if (roomIds && roomIds.length > 0) q = q.in('room_id', roomIds);
    return q;
  });
  const targetIds = (await filterRowsByGrades(allRows, grades)).map(r => r.id as string);

  const DELETE_CHUNK = 200;
  let deleted = 0;
  for (let i = 0; i < targetIds.length; i += DELETE_CHUNK) {
    const chunk = targetIds.slice(i, i + DELETE_CHUNK);
    const { error, count } = await supabase
      .from('seat_reservations')
      .delete({ count: 'exact' })
      .in('id', chunk);

    if (error) {
      console.error('Error deleting reservations by dates/grades:', error);
      throw new Error(
        deleted > 0
          ? `예약 삭제 중 오류가 발생했습니다. (${deleted}건은 이미 삭제됨)`
          : '선택한 날짜의 예약 삭제에 실패했습니다.'
      );
    }
    deleted += count ?? 0;
  }

  return deleted;
};

/**
 * 특정 열람실의 예약 조회 (profiles 포함) - 교사용 출석체크에 최적화
 * getAllReservationsByDate의 room별 버전으로, 선택된 열람실의 예약만 조회
 */
export const getReservationsByDateAndRoomWithProfiles = async (
  roomId: string,
  date: Date
): Promise<SeatReservation[]> => {
  const dateStr = formatDate(date);

  try {
    const queryPromise = supabase
      .from('seat_reservations')
      .select('*, profiles!student_id(id, email, name), checker:profiles!checked_by(id, name)')
      .eq('room_id', roomId)
      .eq('reservation_date', dateStr)
      .order('seat_number');

    const { data, error } = (await withTimeout(
      queryPromise,
      10000,
      'Query timeout after 10 seconds'
    )) as any;

    if (error) {
      console.error('Error fetching room reservations:', error);
      throw new Error('예약 정보를 불러오는데 실패했습니다.');
    }

    return await enrichWithResourceMeta(data || []);
  } catch (err) {
    console.error('getReservationsByDateAndRoomWithProfiles exception:', err);
    throw err;
  }
};

/**
 * 열람실별 «사용 중인 좌석 수» (학생 신청 화면 드롭다운용, RPC seaton_room_seat_counts)
 * 학생은 남의 예약 행을 읽을 수 없으므로 서버가 센 고유 좌석 수만 받는다.
 * FIXED: 운영 기간 범위 / WEEKLY: 그날 하루.
 */
export const getRoomSeatCounts = async (
  date: Date,
  dateRange?: { startDate: string; endDate: string }
): Promise<Record<string, { uniqueSeats: number }>> => {
  const start = dateRange?.startDate ?? formatDate(date);
  const end = dateRange?.endDate ?? formatDate(date);
  const { data, error } = await db.rpc('seaton_room_seat_counts', {
    p_start: start,
    p_end: end,
  });
  if (error) {
    console.error('Error fetching room seat counts:', error);
    throw new Error('열람실 좌석 현황을 불러오는데 실패했습니다.');
  }
  const result: Record<string, { uniqueSeats: number }> = {};
  for (const row of (data ?? []) as { room_id: string; unique_seats: number }[]) {
    result[row.room_id] = { uniqueSeats: Number(row.unique_seats) || 0 };
  }
  return result;
};

/**
 * 모든 열람실의 예약 통계만 조회 (교사용 출석 체크 화면 — 예약 행을 직접 읽는다)
 * 학생 화면은 getRoomSeatCounts 를 쓸 것 (학생은 남의 예약 행을 읽을 수 없다)
 */
export const getRoomReservationCounts = async (
  date: Date,
  dateRange?: { startDate: string; endDate: string }
): Promise<
  Record<
    string,
    {
      total: number;
      attended: number;
      uniqueSeats: number;
      byPeriod: Record<number, { total: number; attended: number }>;
    }
  >
> => {
  try {
    // FIXED 모드: 기간 범위 조회 (페이징) / WEEKLY: 단일 날짜 조회
    let data: any[];
    if (dateRange) {
      data = await fetchAllPaginated(() =>
        supabase
          .from('seat_reservations')
          .select('room_id, seat_number, is_attended, period_id')
          .gte('reservation_date', dateRange.startDate)
          .lte('reservation_date', dateRange.endDate)
      );
    } else {
      const result = await supabase
        .from('seat_reservations')
        .select('room_id, seat_number, is_attended, period_id')
        .eq('reservation_date', formatDate(date));
      if (result.error) {
        console.error('Error fetching room reservation counts:', result.error);
        throw new Error('예약 통계를 불러오는데 실패했습니다.');
      }
      data = result.data || [];
    }

    // 클라이언트에서 집계
    const result: Record<
      string,
      {
        total: number;
        attended: number;
        uniqueSeats: number;
        byPeriod: Record<number, { total: number; attended: number }>;
      }
    > = {};

    const seatsByRoom: Record<string, Set<string>> = {};

    (data || []).forEach((r: any) => {
      if (!result[r.room_id]) {
        result[r.room_id] = { total: 0, attended: 0, uniqueSeats: 0, byPeriod: {} };
        seatsByRoom[r.room_id] = new Set();
      }

      result[r.room_id].total += 1;
      if (r.is_attended) {
        result[r.room_id].attended += 1;
      }
      seatsByRoom[r.room_id].add(r.seat_number);

      // 교시별 통계
      const periodId = r.period_id || 0;
      if (!result[r.room_id].byPeriod[periodId]) {
        result[r.room_id].byPeriod[periodId] = { total: 0, attended: 0 };
      }
      result[r.room_id].byPeriod[periodId].total += 1;
      if (r.is_attended) {
        result[r.room_id].byPeriod[periodId].attended += 1;
      }
    });

    // 고유 좌석 수 계산
    Object.keys(seatsByRoom).forEach(roomId => {
      result[roomId].uniqueSeats = seatsByRoom[roomId].size;
    });

    return result;
  } catch (err) {
    console.error('getRoomReservationCounts exception:', err);
    throw err;
  }
};

/**
 * 학생 목록 조회 (예약 관리 페이지용)
 * profiles에서 role='student'인 사용자 조회 후 resource.meta enrichment 적용
 */
export const getStudentList = async (
  gradeFilter?: number | null
): Promise<(Profile & { grade?: number; class?: number; student_number?: string })[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('role', 'student')
    .order('name');

  if (error || !profiles) {
    console.error('Error fetching student list:', error);
    throw new Error('학생 목록을 불러오는데 실패했습니다.');
  }

  // enrichWithResourceMeta는 profiles 키를 가진 객체 배열을 기대하므로 래핑
  const wrapped = profiles.map((p: any) => ({ profiles: p }));
  const enriched = await enrichWithResourceMeta(wrapped);

  // 언래핑하여 flat 학생 목록으로 변환
  let students = enriched.map((item: any) => ({
    id: item.profiles.id,
    email: item.profiles.email,
    name: item.profiles.name,
    role: item.profiles.role,
    grade: item.profiles.grade ?? null,
    class: item.profiles.class ?? null,
    student_number: item.profiles.student_number ?? null,
  }));

  // 학년 필터 적용 (meta.grade가 JSONB에서 string으로 저장될 수 있으므로 Number 변환)
  if (gradeFilter) {
    students = students.filter((s: any) => Number(s.grade) === gradeFilter);
  }

  return students as any;
};

/**
 * 특정 학생의 예약 목록 조회 (예약 관리 페이지용)
 * student_id로 필터링하고 profiles/study_rooms JOIN + enrichment 적용
 */
export const getStudentReservations = async (
  studentId: string,
  startDate?: Date | null,
  endDate?: Date | null
): Promise<SeatReservation[]> => {
  let query = supabase
    .from('seat_reservations')
    .select(
      '*, profiles!student_id(id, email, name), study_rooms!room_id(id, name, operating_periods)'
    )
    .eq('student_id', studentId)
    .order('reservation_date', { ascending: false });

  if (startDate) {
    query = query.gte('reservation_date', formatDate(startDate));
  }
  if (endDate) {
    query = query.lte('reservation_date', formatDate(endDate));
  }

  const { data, error } = (await withTimeout(
    query,
    10000,
    'Query timeout after 10 seconds'
  )) as any;

  if (error) {
    console.error('Error fetching student reservations:', error);
    throw new Error('학생 예약 목록을 불러오는데 실패했습니다.');
  }

  return await enrichWithResourceMeta(data || []);
};

/**
 * 날짜 범위 내 해당 열람실의 점유 좌석 조회 (관리자용)
 * 모든 날짜에서 하나라도 점유된 좌석을 Set<string>으로 반환
 * excludeStudentId 전달 시 해당 학생의 예약은 제외 (변경 모드용)
 */
export const getOccupiedSeatsForDateRange = async (
  roomId: string,
  startDate: string,
  endDate: string,
  excludeStudentId?: string
): Promise<{ seat_number: string; period_id: number | null; reservation_date: string }[]> => {
  const data = await fetchAllPaginated<{
    seat_number: string;
    period_id: number | null;
    reservation_date: string;
  }>(() => {
    let q = supabase
      .from('seat_reservations')
      .select('seat_number, period_id, reservation_date')
      .eq('room_id', roomId)
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate);
    if (excludeStudentId) {
      q = q.neq('student_id', excludeStudentId);
    }
    return q;
  });
  return data;
};

/**
 * 관리자용 예약 일괄 생성 (booking 기간 체크 스킵)
 * 날짜 범위 내 운영일만 필터하여 INSERT
 */
export const adminCreateReservations = async (
  studentId: string,
  roomId: string,
  seatNumber: string,
  startDate: string,
  endDate: string,
  isSaturdayOpen: boolean,
  isSundayOpen: boolean,
  usePeriods?: boolean,
  operatingPeriods?: { id: number; name: string; start_time: string; end_time: string }[],
  operatingDaysParam?: number[],
  /** 관리자가 선택한 요일 필터 (미지정 시 운영 요일 전체) */
  selectedDaysOverride?: number[],
  /** 관리자가 선택한 교시 필터 (미지정 시 전체 교시, UNIFORM 모드) */
  selectedPeriodIdsOverride?: number[],
  /** 요일별 교시 선택 (PER_DAY 모드, key: 요일 0~6, value: 교시 ID 배열) */
  dayPeriodSelectionsOverride?: Record<number, number[]>
): Promise<SeatReservation[]> => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  // operating_days 우선, 없으면 레거시 필드에서 유추
  const opDays =
    operatingDaysParam && operatingDaysParam.length > 0
      ? operatingDaysParam
      : (() => {
          const d = [1, 2, 3, 4, 5];
          if (isSaturdayOpen) d.push(6);
          if (isSundayOpen) d.push(0);
          return d;
        })();

  // 관리자가 요일을 선택한 경우 해당 요일만, 아니면 운영 요일 전체
  const effectiveDays =
    selectedDaysOverride && selectedDaysOverride.length > 0
      ? selectedDaysOverride.filter(d => opDays.includes(d))
      : opDays;

  const dates = eachDayOfInterval({ start, end }).filter(d => {
    return effectiveDays.includes(d.getDay());
  });

  if (dates.length === 0) {
    throw new Error('예약 가능한 날짜가 없습니다.');
  }

  const dateStrings = dates.map(d => formatDate(d));

  // 교시 목록 결정: use_periods이고 operating_periods가 있으면 각 교시별, 아니면 종일(0)
  const roomPeriodIds =
    usePeriods && operatingPeriods && operatingPeriods.length > 0
      ? operatingPeriods.map(p => p.id)
      : [];
  const allPeriodIds = roomPeriodIds.length > 0 ? roomPeriodIds : [0];

  // 관리자가 교시를 선택한 경우 해당 교시만, 아니면 전체
  const selectedPeriodIds =
    selectedPeriodIdsOverride && selectedPeriodIdsOverride.length > 0
      ? selectedPeriodIdsOverride.filter(id => allPeriodIds.includes(id))
      : [];
  const periodIds = selectedPeriodIds.length > 0 ? selectedPeriodIds : allPeriodIds;

  // 교시 미운영 열람실에는 요일별 교시 선택을 적용하지 않는다 (종일 1건으로 처리)
  const effectiveDaySelections = roomPeriodIds.length > 0 ? dayPeriodSelectionsOverride : undefined;

  // 원하는 (날짜, 교시) 쌍 먼저 생성

  const desiredPairs: { reservation_date: string; period_id: number }[] = [];
  for (const dStr of dateStrings) {
    const dateDay = new Date(dStr).getDay();
    let pidsForDate: number[];
    if (effectiveDaySelections) {
      pidsForDate = (effectiveDaySelections[dateDay] || []).filter(id => allPeriodIds.includes(id));
      if (pidsForDate.length === 0) continue;
    } else {
      pidsForDate = periodIds;
    }
    for (const pid of pidsForDate) {
      desiredPairs.push({ reservation_date: dStr, period_id: pid });
    }
  }

  if (desiredPairs.length === 0) {
    throw new Error('예약 가능한 날짜/교시 조합이 없습니다.');
  }

  // 열람실 정보 조회 (중복 신청 허용 여부 확인)
  const adminRoom = await getStudyRoom(roomId);
  const adminDupRoomIds = await getDuplicateAllowedRoomIds();
  const isAdminAllowDup = !!adminRoom?.allow_duplicate_reservation;

  // 학생 기존 예약 조회 (교시 필터 없이 전체 — 슬롯 단위 필터링을 위해)
  let studentQuery = supabase
    .from('seat_reservations')
    .select('reservation_date, period_id')
    .eq('student_id', studentId)
    .in('reservation_date', dateStrings);
  studentQuery = applyPoolFilter(studentQuery, isAdminAllowDup, adminDupRoomIds, roomId);
  const { data: studentExisting } = await studentQuery;

  // 학생 충돌 룩업 (날짜 → 교시 Set)
  const studentByDate = new Map<string, Set<number>>();
  for (const r of (studentExisting || []) as { reservation_date: string; period_id: number }[]) {
    if (!studentByDate.has(r.reservation_date)) studentByDate.set(r.reservation_date, new Set());
    studentByDate.get(r.reservation_date)!.add(r.period_id ?? 0);
  }

  // 좌석 기존 예약 조회
  const { data: seatExisting } = await supabase
    .from('seat_reservations')
    .select('reservation_date, period_id')
    .eq('room_id', roomId)
    .eq('seat_number', seatNumber)
    .in('reservation_date', dateStrings);

  // 좌석 충돌 룩업 (날짜 → 교시 Set)
  const seatByDate = new Map<string, Set<number>>();
  for (const r of (seatExisting || []) as { reservation_date: string; period_id: number }[]) {
    if (!seatByDate.has(r.reservation_date)) seatByDate.set(r.reservation_date, new Set());
    seatByDate.get(r.reservation_date)!.add(r.period_id ?? 0);
  }

  // 개별 슬롯 충돌 체크 헬퍼
  const hasConflict = (date: string, period: number, byDate: Map<string, Set<number>>): boolean => {
    const periods = byDate.get(date);
    if (!periods) return false;
    if (periods.has(0)) return true; // 기존 종일 예약 → 모든 교시 충돌
    if (period === 0) return periods.size > 0; // 종일 예약 시도 → 기존 어떤 예약이든 충돌
    return periods.has(period); // 같은 교시 충돌
  };

  // 충돌 없는 슬롯만 필터
  const filtered = desiredPairs.filter(
    ({ reservation_date, period_id }) =>
      !hasConflict(reservation_date, period_id, studentByDate) &&
      !hasConflict(reservation_date, period_id, seatByDate)
  );

  const skippedCount = desiredPairs.length - filtered.length;

  if (filtered.length === 0) {
    throw new Error('모든 날짜/교시에 이미 예약이 존재합니다. 요일이나 교시를 변경해 주세요.');
  }

  // 일괄 INSERT (충돌 없는 슬롯만)
  const reservationsToInsert = filtered.map(({ reservation_date, period_id }) => ({
    student_id: studentId,
    room_id: roomId,
    seat_number: seatNumber,
    reservation_date,
    period_id,
  }));

  const { data, error } = await supabase
    .from('seat_reservations')
    .insert(reservationsToInsert as any)
    .select();

  if (error) {
    console.error('Error creating admin reservations:', error);
    throw new Error(`예약 생성에 실패했습니다: ${error.message}`);
  }

  if (skippedCount > 0) {
    console.info(`관리자 예약: ${filtered.length}건 생성, ${skippedCount}건 충돌로 건너뜀`);
  }

  return data as SeatReservation[];
};

/**
 * 관리자용 좌석 변경
 * 해당 기간/열람실의 기존 예약을 모두 삭제 후 새 좌석/요일/교시로 재생성
 */
export const adminChangeSeat = async (
  studentId: string,
  roomId: string,
  _oldSeatNumber: string,
  newSeatNumber: string,
  startDate?: string,
  endDate?: string,
  newRoomId?: string,
  usePeriods?: boolean,
  operatingPeriods?: { id: number; name: string; start_time: string; end_time: string }[],
  operatingDaysParam?: number[],
  isSaturdayOpen?: boolean,
  isSundayOpen?: boolean,
  selectedPeriodIdsOverride?: number[],
  dayPeriodSelectionsOverride?: Record<number, number[]>
): Promise<void> => {
  const targetRoomId = newRoomId || roomId;

  if (!startDate || !endDate) {
    throw new Error('시작일과 종료일을 입력해주세요.');
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  const opDays =
    operatingDaysParam && operatingDaysParam.length > 0
      ? operatingDaysParam
      : (() => {
          const d = [1, 2, 3, 4, 5];
          if (isSaturdayOpen) d.push(6);
          if (isSundayOpen) d.push(0);
          return d;
        })();

  const dates = eachDayOfInterval({ start, end }).filter(d => opDays.includes(d.getDay()));

  if (dates.length === 0) {
    throw new Error('예약 가능한 날짜가 없습니다.');
  }

  const dateStrings = dates.map(d => formatDate(d));

  const roomPeriodIds =
    usePeriods && operatingPeriods && operatingPeriods.length > 0
      ? operatingPeriods.map(p => p.id)
      : [];
  const allPeriodIds = roomPeriodIds.length > 0 ? roomPeriodIds : [0];

  const selectedPeriodIds =
    selectedPeriodIdsOverride && selectedPeriodIdsOverride.length > 0
      ? selectedPeriodIdsOverride.filter(id => allPeriodIds.includes(id))
      : [];
  const periodIds = selectedPeriodIds.length > 0 ? selectedPeriodIds : allPeriodIds;

  // 교시 미운영 열람실에는 요일별 교시 선택을 적용하지 않는다 (종일 1건으로 처리)
  const effectiveDaySelections = roomPeriodIds.length > 0 ? dayPeriodSelectionsOverride : undefined;

  // 1. 새 예약 목록 생성 (삭제 전에 미리 계산)
  const reservationsToInsert: {
    student_id: string;
    room_id: string;
    seat_number: string;
    reservation_date: string;
    period_id: number;
  }[] = [];
  for (const dStr of dateStrings) {
    const dateDay = new Date(dStr).getDay();
    let pidsForDate: number[];
    if (effectiveDaySelections) {
      pidsForDate = (effectiveDaySelections[dateDay] || []).filter(id => allPeriodIds.includes(id));
      if (pidsForDate.length === 0) continue;
    } else {
      pidsForDate = periodIds;
    }
    for (const pid of pidsForDate) {
      reservationsToInsert.push({
        student_id: studentId,
        room_id: targetRoomId,
        seat_number: newSeatNumber,
        reservation_date: dStr,
        period_id: pid,
      });
    }
  }

  if (reservationsToInsert.length === 0) {
    throw new Error('생성할 예약이 없습니다. 요일/교시를 선택해주세요.');
  }

  // 2. 새 좌석 충돌 체크 (다른 학생 예약 확인 - 삭제 전에 수행하여 데이터 손실 방지)
  const insertDates = [...new Set(reservationsToInsert.map(r => r.reservation_date))];
  const insertPeriodIds = [...new Set(reservationsToInsert.map(r => r.period_id))];

  let seatCheckQuery = supabase
    .from('seat_reservations')
    .select('reservation_date, period_id')
    .eq('room_id', targetRoomId)
    .eq('seat_number', newSeatNumber)
    .neq('student_id', studentId)
    .in('reservation_date', insertDates);

  if (!insertPeriodIds.includes(0)) {
    seatCheckQuery = seatCheckQuery.in('period_id', [...insertPeriodIds, 0]);
  }

  const { data: seatCheck } = await seatCheckQuery;

  if (seatCheck && seatCheck.length > 0) {
    const conflictDates = [...new Set((seatCheck as any[]).map(r => r.reservation_date))];
    throw new Error(
      `해당 좌석이 이미 예약된 날짜가 있습니다: ${conflictDates.slice(0, 3).join(', ')}${conflictDates.length > 3 ? ' 등' : ''}`
    );
  }

  // 3. 기존 예약 삭제 (해당 학생 + 열람실 + 기간 전체)
  const findQuery = supabase
    .from('seat_reservations')
    .select('id')
    .eq('room_id', roomId)
    .eq('student_id', studentId)
    .gte('reservation_date', startDate)
    .lte('reservation_date', endDate);

  const { data: toDelete, error: findError } = await findQuery;
  if (findError) {
    throw new Error(`삭제 대상 조회 실패: ${findError.message}`);
  }

  if (toDelete && toDelete.length > 0) {
    const ids = toDelete.map(r => r.id);
    const { error: deleteError } = await supabase.from('seat_reservations').delete().in('id', ids);

    if (deleteError) {
      throw new Error(`기존 예약 삭제에 실패했습니다: ${deleteError.message}`);
    }
  }

  // 4. 새 예약 INSERT
  const { error: insertError } = await supabase
    .from('seat_reservations')
    .insert(reservationsToInsert as any)
    .select();

  if (insertError) {
    console.error('Error creating new reservations:', insertError);
    throw new Error(`새 예약 생성에 실패했습니다: ${insertError.message}`);
  }
};

/**
 * 학생들의 학번 정보 조회 (resource table)
 */
/**
 * 특정 학생의 기간/열람실 내 피드백이 기록된 예약 날짜 조회
 */
export const getReservationDatesWithFeedback = async (
  studentId: string,
  roomId: string,
  startDate: string,
  endDate: string
): Promise<string[]> => {
  const { data } = await supabase
    .from('seat_reservations')
    .select('reservation_date')
    .eq('student_id', studentId)
    .eq('room_id', roomId)
    .gte('reservation_date', startDate)
    .lte('reservation_date', endDate)
    .not('feedback_rating', 'is', null);

  if (!data || data.length === 0) return [];
  return [...new Set((data as any[]).map(r => r.reservation_date))];
};

export const getStudentSnums = async (
  students: { id: string; email: string }[]
): Promise<Record<string, string>> => {
  if (students.length === 0) return {};

  const result: Record<string, string> = {};
  // email 유효성 체크 및 ID 추출
  const ids = Array.from(new Set(students.filter(s => s.email).map(s => s.email.split('@')[0])));

  if (ids.length > 0) {
    const { data: resources } = await supabase.from('resource').select('meta').in('meta->>id', ids);

    resources?.forEach((res: any) => {
      if (res.meta && res.meta.id) {
        const matchingId = res.meta.id;

        // meta에서 snum으로 시작하는 키 찾아서 가장 높은 숫자 찾기
        let maxSnumKey = '';
        let maxSuffix = 0;

        Object.keys(res.meta).forEach(key => {
          if (key.startsWith('snum')) {
            const suffix = parseInt(key.replace('snum', ''), 10);
            if (!isNaN(suffix) && suffix > maxSuffix) {
              maxSuffix = suffix;
              maxSnumKey = key;
            }
          }
        });

        if (maxSnumKey) {
          const snum = res.meta[maxSnumKey];
          // 해당 ID를 가진 모든 학생 업데이트 (같은 이메일 ID를 가진 사용자 처리)
          students.forEach(s => {
            if (s.email && s.email.split('@')[0] === matchingId) {
              result[s.id] = snum;
            }
          });
        }
      }
    });
  }

  return result;
};

/**
 * 피드백 작성/수정
 * 출석 처리된 자신의 예약에만 작성 가능
 * 예약일로부터 7일 이내만 작성 가능
 */
export const submitFeedback = async (
  reservationId: string,
  rating: number,
  note?: string
): Promise<SeatReservation> => {
  if (rating < 1 || rating > 5) throw new Error('별점은 1~5 사이여야 합니다.');

  // 클라이언트 사전 확인 (빠른 안내용). 정본은 서버 가드 seaton_guard_feedback:
  //   출석한 예약에만 · 이용일부터 7일 안 · 남긴 피드백은 지울 수 없음 → 위반 시 42501 + 한국어 메시지
  //   처음 남긴 피드백은 +1코인 (하루 1번, 서버 트리거)
  const { data: reservation, error: fetchError } = await supabase
    .from('seat_reservations')
    .select('reservation_date, is_attended')
    .eq('id', reservationId)
    .single();

  if (fetchError || !reservation) {
    throw new Error('예약 정보를 찾을 수 없습니다.');
  }

  if (!(reservation as any).is_attended) {
    throw new Error('출석한 예약에만 피드백을 남길 수 있습니다.');
  }

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 7);
  const reservationDateStr = (reservation as any).reservation_date as string;
  if (reservationDateStr < formatDate(cutoff) || reservationDateStr > formatDate(today)) {
    throw new Error('피드백은 이용한 날부터 7일 안에 남길 수 있습니다.');
  }

  const { data, error } = await supabase
    .from('seat_reservations')
    .update({
      feedback_rating: rating,
      feedback_note: note?.trim() || null,
      feedback_at: new Date().toISOString(),
    } as any)
    .eq('id', reservationId)
    .select()
    .single();

  if (error) {
    console.error('Error submitting feedback:', error);
    // 서버 가드가 거절한 이유(한국어)는 그대로 보여준다
    if (error.code === '42501' && error.message) throw new Error(error.message);
    throw new Error(`피드백 저장에 실패했습니다: ${error.message}`);
  }

  return data as SeatReservation;
};
