/**
 * 좌석 점유 판정 (순수 함수)
 *
 * 2026-10-09 부터 학생은 다른 학생의 예약 행을 직접 읽지 못한다.
 * 좌석 지도·자리 확인은 RPC `seaton_seat_occupancy` 가 돌려주는 «점유 칸»만 본다
 * (학생 id·이름 없음, 내 것인지만 is_mine 으로 알려 준다).
 *
 * period_id 규약: 0(또는 null) = 종일. 종일은 같은 좌석·같은 날의 어떤 교시와도 겹친다.
 * DB 의 unique_seat_reservation 은 (좌석, 날짜, 교시)가 같을 때만 막으므로
 * «종일 vs 교시» 충돌은 클라이언트가 직접 확인해야 한다.
 */

/** RPC seaton_seat_occupancy 의 한 줄 */
export interface SeatOccupancy {
  seat_number: string;
  reservation_date: string; // YYYY-MM-DD
  period_id: number | null;
  is_mine: boolean;
}

/** 좌석 지도가 그리는 한 칸 (남의 점유 + 내 예약을 합친 것) */
export interface RoomSeatSlot {
  seat_number: string;
  reservation_date: string;
  period_id?: number | null;
  is_mine: boolean;
  room_id?: string;
}

/** 두 교시가 같은 좌석에서 겹치는가 (0/null = 종일) */
export const periodsConflict = (a: number | null | undefined, b: number | null | undefined) => {
  const x = a ?? 0;
  const y = b ?? 0;
  return x === 0 || y === 0 || x === y;
};

export type SeatConflictKind = 'existing_all_day' | 'requested_all_day' | 'same_period';

export interface SeatConflict {
  kind: SeatConflictKind;
  reservation_date: string;
  period_id: number;
}

/**
 * 이미 점유된 칸과 신청하려는 교시가 겹치는 첫 번째 충돌을 찾는다.
 * @param existing 같은 좌석의 점유 칸 (호출부가 내 것을 뺄지 정한다)
 * @param requestedFor 날짜별로 신청하려는 교시 목록 (빈 배열이면 그날은 신청하지 않음)
 */
export const findSeatConflict = (
  existing: Pick<SeatOccupancy, 'reservation_date' | 'period_id'>[],
  requestedFor: (date: string) => number[]
): SeatConflict | null => {
  for (const row of existing) {
    const requested = requestedFor(row.reservation_date);
    if (requested.length === 0) continue;
    const taken = row.period_id ?? 0;
    for (const pid of requested) {
      if (!periodsConflict(taken, pid)) continue;
      const kind: SeatConflictKind =
        taken === 0 ? 'existing_all_day' : (pid ?? 0) === 0 ? 'requested_all_day' : 'same_period';
      return { kind, reservation_date: row.reservation_date, period_id: taken };
    }
  }
  return null;
};

/**
 * 좌석 지도용 칸 = 남의 점유(is_mine=false) + 이 열람실의 내 예약.
 * RPC 의 내 칸은 버리고 myReservations 를 쓴다 — 취소·이동 직후 화면을 고칠 때
 * 내 예약은 id 로 다뤄야 하기 때문이다.
 */
export const mergeRoomSlots = (
  occupancy: SeatOccupancy[],
  myReservations: {
    seat_number: string;
    reservation_date: string;
    period_id?: number | null;
    room_id: string;
  }[],
  roomId: string,
  inRange: (date: string) => boolean
): RoomSeatSlot[] => [
  ...occupancy.filter(o => !o.is_mine).map(o => ({ ...o, is_mine: false })),
  ...myReservations
    .filter(r => r.room_id === roomId && inRange(r.reservation_date))
    .map(r => ({
      seat_number: r.seat_number,
      reservation_date: r.reservation_date,
      period_id: r.period_id ?? 0,
      is_mine: true,
      room_id: r.room_id,
    })),
];

/** 23505 unique_seat_reservation — 거의 같은 순간 다른 학생이 먼저 신청했다 */
export const SEAT_TAKEN_MESSAGE =
  '방금 다른 학생이 이 자리를 신청했습니다. 다른 자리를 골라 주세요.';

export const isSeatTakenError = (error: { code?: string; message?: string } | null | undefined) =>
  !!error &&
  error.code === '23505' &&
  (!error.message || !error.message.includes('unique_student_reservation'));
