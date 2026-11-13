import { describe, expect, it } from 'vitest';
import { formatRoomSessions, isMorningRoom } from './roomSession';

describe('isMorningRoom', () => {
  it('이름에 "아침"이 포함되면 아침 자습실로 본다', () => {
    expect(isMorningRoom('아침 자습실')).toBe(true);
    expect(isMorningRoom('1학년 아침열람실')).toBe(true);
  });

  it('그 외는 야간으로 본다', () => {
    expect(isMorningRoom('1학년 열람실')).toBe(false);
  });
});

describe('formatRoomSessions', () => {
  it('신청이 없으면 -를 반환한다', () => {
    expect(formatRoomSessions([])).toBe('-');
    expect(formatRoomSessions(undefined)).toBe('-');
    expect(formatRoomSessions(null)).toBe('-');
  });

  it('아침만 신청한 경우', () => {
    expect(formatRoomSessions(['아침 자습실'])).toBe('아침');
  });

  it('야간만 신청한 경우', () => {
    expect(formatRoomSessions(['2학년 열람실'])).toBe('야간');
  });

  it('둘 다 신청한 경우', () => {
    expect(formatRoomSessions(['아침 자습실', '2학년 열람실'])).toBe('아침, 야간');
  });
});
