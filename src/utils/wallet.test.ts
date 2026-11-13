import { describe, expect, it } from 'vitest';
import {
  estimatePuzzleQuote,
  focusRewardMessage,
  formatPuzzleCost,
  mergeRewardHistory,
  parsePuzzleQuote,
  parseWallet,
  puzzleCoinCost,
} from './wallet';

describe('puzzleCoinCost (2P = 1코인, 올림)', () => {
  it('서버 식과 같다', () => {
    expect(puzzleCoinCost(0)).toBe(0);
    expect(puzzleCoinCost(1)).toBe(1);
    expect(puzzleCoinCost(5)).toBe(3);
    expect(puzzleCoinCost(10)).toBe(5);
    expect(puzzleCoinCost(-3)).toBe(0);
  });
});

describe('formatPuzzleCost', () => {
  it('포인트만 · 섞어서 · 코인만 · 무료', () => {
    expect(formatPuzzleCost({ payPoints: 10, payCoins: 0, free: false })).toBe('10P');
    expect(formatPuzzleCost({ payPoints: 5, payCoins: 3, free: false })).toBe('5P + 3코인');
    expect(formatPuzzleCost({ payPoints: 0, payCoins: 5, free: false })).toBe('5코인');
    expect(formatPuzzleCost({ payPoints: 0, payCoins: 0, free: true })).toBe('무료');
  });
});

describe('estimatePuzzleQuote', () => {
  it('이전 포인트를 먼저 쓰고 모자란 만큼 코인으로', () => {
    const q = estimatePuzzleQuote(10, 5, 2);
    expect([q.payPoints, q.payCoins, q.affordable]).toEqual([5, 3, false]);
    expect(estimatePuzzleQuote(10, 5, 3).affordable).toBe(true);
    expect(estimatePuzzleQuote(10, 30, 0).payCoins).toBe(0);
    expect(estimatePuzzleQuote(10, -4, 5).payPoints).toBe(0);
  });
  it('교사·관리자는 무료', () => {
    const q = estimatePuzzleQuote(10, 0, 0, true);
    expect([q.payPoints, q.payCoins, q.affordable, q.free]).toEqual([0, 0, true, true]);
  });
});

describe('parseWallet / parsePuzzleQuote', () => {
  it('RPC jsonb 를 화면 모델로', () => {
    const w = parseWallet({
      coins: 120,
      legacy_points: 37,
      review_left: 1,
      focus_left: 2,
      recent: [
        {
          delta: 5,
          kind: 'seaton_attendance',
          note: null,
          at: '2026-10-09T01:00:00Z',
          balance: 120,
        },
      ],
      server_now: 1,
    });
    expect([w.coins, w.legacyPoints, w.reviewLeft, w.focusLeft, w.recent.length]).toEqual([
      120, 37, 1, 2, 1,
    ]);
    const q = parsePuzzleQuote({
      cost_points: 10,
      points: 4,
      coins: 9,
      pay_points: 4,
      pay_coins: 3,
      affordable: true,
      free: false,
    });
    expect([q.payPoints, q.payCoins, q.affordable]).toEqual([4, 3, true]);
  });
});

describe('mergeRewardHistory', () => {
  it('이전 포인트와 코인 이력을 시간 역순으로 합친다', () => {
    const items = mergeRewardHistory(
      [
        {
          id: 'p1',
          amount: 10,
          type: 'attendance',
          description: '',
          created_at: '2026-10-01T00:00:00Z',
        },
      ],
      [
        {
          delta: 5,
          kind: 'seaton_attendance',
          note: null,
          at: '2026-10-09T00:00:00Z',
          balance: 105,
        },
      ]
    );
    expect(items.map(i => [i.unit, i.title])).toEqual([
      ['코인', '자습실 출석'],
      ['P', '이전 포인트 · 출석'],
    ]);
  });
});

describe('focusRewardMessage', () => {
  it('결과별 문구', () => {
    expect(focusRewardMessage({ outcome: 'completed', credit: 2 })).toBe('+2코인을 받았어요');
    expect(focusRewardMessage({ outcome: 'completed', credit: 0 })).toBe(
      '오늘 받을 수 있는 집중 코인은 다 받았어요'
    );
    expect(focusRewardMessage({ outcome: 'expired', credit: 0 })).toBe(
      '끝난 뒤 15분이 지나 코인을 받지 못했어요'
    );
    expect(focusRewardMessage({ outcome: 'running', credit: 0, remaining: 30 })).toBeNull();
  });
});
