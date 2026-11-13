import { describe, expect, it } from 'vitest';
import {
  formatStudyDay,
  formatStudyWeekRange,
  parseStudyWeek,
  studyRewardRows,
  summarizeStudyRewards,
  type StudyEntry,
} from './studyRewards';

const entry = (over: Partial<StudyEntry>): StudyEntry => ({
  id: 'a',
  day: '2026-10-13',
  room: '열람실',
  period: '1교시',
  startTime: null,
  endTime: null,
  attendance: 'pending',
  eligible: false,
  claimed: false,
  ...over,
});

describe('parseStudyWeek (RPC academy_study_read)', () => {
  it('서버 jsonb 를 읽고 모르는 값은 안전하게', () => {
    const w = parseStudyWeek({
      week: '2026-10-12',
      today: '2026-10-15',
      claimed_coins: 15,
      entries: [
        {
          id: 'x',
          day: '2026-10-13',
          room: '',
          period: '2교시',
          start_time: '18:00',
          end_time: null,
          attendance: 'weird',
          eligible: true,
          claimed: true,
        },
      ],
    });
    expect(w.claimedCoins).toBe(15);
    expect(w.entries[0]).toMatchObject({
      room: '자습실',
      startTime: '18:00',
      endTime: null,
      attendance: 'pending',
      eligible: true,
      claimed: true,
    });
    expect(parseStudyWeek(null).entries).toEqual([]);
  });
});

describe('studyRewardRows', () => {
  const today = '2026-10-15';

  it('받음 · 출석 확인 전 · 기록 없음 · 예정 · 인정출석 · 보완', () => {
    const rows = studyRewardRows({
      today,
      entries: [
        entry({
          id: '1',
          day: '2026-10-13',
          attendance: 'attended',
          eligible: true,
          claimed: true,
        }),
        entry({ id: '2', day: '2026-10-15' }),
        entry({ id: '3', day: '2026-10-14' }),
        entry({ id: '4', day: '2026-10-16' }),
        entry({ id: '5', day: '2026-10-14', attendance: 'excused' }),
        entry({ id: '6', day: '2026-10-14', attendance: 'supplement' }),
      ],
    });
    expect(rows.map(r => r.status)).toEqual([
      'paid',
      'waiting',
      'missed',
      'upcoming',
      'excused',
      'supplement',
    ]);
    expect(rows.map(r => r.coins)).toEqual([5, 0, 0, 0, 0, 0]);
  });

  it('하루 셋째 출석은 «하루 최대» — 서버처럼 예약 id 순서', () => {
    const rows = studyRewardRows({
      today,
      entries: [
        entry({ id: 'c', attendance: 'attended', eligible: true, claimed: true }),
        entry({ id: 'a', attendance: 'attended', eligible: true, claimed: true }),
        entry({ id: 'b', attendance: 'attended', eligible: true, claimed: false }),
      ],
    });
    expect(rows.find(r => r.id === 'b')?.status).toBe('capped');
  });

  it('그날 자리가 남았는데 안 들어온 출석은 «받을 수 있음», 넘치는 것만 «하루 최대»', () => {
    const rows = studyRewardRows({
      today,
      entries: [
        entry({ id: 'b', attendance: 'attended', eligible: true }),
        entry({ id: 'a', attendance: 'attended', eligible: true, claimed: true }),
        entry({ id: 'c', attendance: 'attended', eligible: true }),
        entry({ id: 'd', day: '2026-10-14', attendance: 'attended', eligible: true }),
      ],
    });
    const status = Object.fromEntries(rows.map(r => [r.id, r.status]));
    expect(status).toEqual({ a: 'paid', b: 'claimable', c: 'capped', d: 'claimable' });
  });
});

describe('summarizeStudyRewards', () => {
  const rows = studyRewardRows({
    today: '2026-10-15',
    entries: [
      entry({ id: 'a', attendance: 'attended', eligible: true, claimed: true }),
      entry({ id: 'b', attendance: 'attended', eligible: true, claimed: true }),
      entry({ id: 'c', attendance: 'attended', eligible: true }),
    ],
  });
  it('서버 합계가 있으면 그것을, 없으면 회차 × 5', () => {
    expect(summarizeStudyRewards(rows, 10)).toEqual({
      coins: 10,
      paid: 2,
      capped: 1,
      claimable: 0,
    });
    expect(summarizeStudyRewards(rows).coins).toBe(10);
  });
});

describe('날짜 표기 (시간대 무관)', () => {
  it('요일과 주 범위', () => {
    expect(formatStudyDay('2026-10-12')).toBe('10/12 (월)');
    expect(formatStudyDay('2026-10-18')).toBe('10/18 (일)');
    expect(formatStudyWeekRange('2026-10-12')).toBe('10/12 (월) ~ 10/18 (일)');
    expect(formatStudyWeekRange('2026-12-28')).toBe('12/28 (월) ~ 1/3 (일)');
  });
});
