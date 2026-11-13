import { describe, expect, it } from 'vitest';
import {
  findSeatConflict,
  isSeatTakenError,
  mergeRoomSlots,
  periodsConflict,
  type SeatOccupancy,
} from './seatOccupancy';

const row = (date: string, period: number | null, is_mine = false): SeatOccupancy => ({
  seat_number: 'A1',
  reservation_date: date,
  period_id: period,
  is_mine,
});

describe('periodsConflict', () => {
  it('종일(0/null)은 어떤 교시와도 겹친다', () => {
    expect(periodsConflict(0, 2)).toBe(true);
    expect(periodsConflict(3, 0)).toBe(true);
    expect(periodsConflict(null, 1)).toBe(true);
    expect(periodsConflict(0, 0)).toBe(true);
  });
  it('서로 다른 교시는 겹치지 않고 같은 교시는 겹친다', () => {
    expect(periodsConflict(1, 2)).toBe(false);
    expect(periodsConflict(2, 2)).toBe(true);
  });
});

describe('findSeatConflict', () => {
  it('비어 있으면 충돌 없음', () => {
    expect(findSeatConflict([], () => [1])).toBeNull();
  });
  it('이미 종일 예약된 좌석에 교시 신청 → existing_all_day', () => {
    expect(findSeatConflict([row('2026-10-12', 0)], () => [2])?.kind).toBe('existing_all_day');
  });
  it('교시 예약이 있는 좌석에 종일 신청 → requested_all_day (DB 유니크 키가 못 잡는 경우)', () => {
    expect(findSeatConflict([row('2026-10-12', 3)], () => [0])?.kind).toBe('requested_all_day');
  });
  it('같은 교시 → same_period, 다른 교시 → 없음', () => {
    expect(findSeatConflict([row('2026-10-12', 2)], () => [1, 2])?.kind).toBe('same_period');
    expect(findSeatConflict([row('2026-10-12', 2)], () => [1, 3])).toBeNull();
  });
  it('날짜별 교시가 다르면 그날 신청한 교시로만 판정한다', () => {
    const requested = (d: string) => (d === '2026-10-12' ? [1] : d === '2026-10-13' ? [2] : []);
    expect(findSeatConflict([row('2026-10-12', 2), row('2026-10-14', 0)], requested)).toBeNull();
    expect(findSeatConflict([row('2026-10-13', 2)], requested)?.reservation_date).toBe(
      '2026-10-13'
    );
  });
});

describe('mergeRoomSlots', () => {
  it('RPC 의 내 칸은 버리고 이 열람실·범위 안의 내 예약으로 바꾼다', () => {
    const slots = mergeRoomSlots(
      [row('2026-10-12', 0, false), { ...row('2026-10-12', 0, true), seat_number: 'B2' }],
      [
        { seat_number: 'B3', reservation_date: '2026-10-12', period_id: 1, room_id: 'r1' },
        { seat_number: 'C1', reservation_date: '2026-10-12', period_id: 0, room_id: 'r2' },
        { seat_number: 'B4', reservation_date: '2026-10-13', period_id: 0, room_id: 'r1' },
      ],
      'r1',
      d => d === '2026-10-12'
    );
    expect(slots.map(s => [s.seat_number, s.is_mine])).toEqual([
      ['A1', false],
      ['B3', true],
    ]);
  });
});

describe('isSeatTakenError', () => {
  it('좌석 유니크 위반만 «방금 다른 학생이 신청»으로 본다', () => {
    expect(
      isSeatTakenError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "unique_seat_reservation"',
      })
    ).toBe(true);
    expect(
      isSeatTakenError({
        code: '23505',
        message: 'duplicate key value violates unique constraint "unique_student_reservation"',
      })
    ).toBe(false);
    expect(isSeatTakenError({ code: '42501', message: 'x' })).toBe(false);
    expect(isSeatTakenError(null)).toBe(false);
  });
});
