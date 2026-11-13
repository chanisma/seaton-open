/**
 * 이번 주 자습 출석 코인 (2026-10-15) — 순수 함수
 *
 * 자습실 출석 코인은 교사가 출석을 확인하는 순간 자동으로 들어와서, 학생은 «왜 올랐는지»를 볼 곳이 없었다.
 * 그 근거는 서버의 영수증 표(academy_study_rewards)에 예약 단위로 남아 있다 → RPC academy_study_read 가
 * 한 주의 예약을 «출석 상태 · 받을 수 있나 · 받았나»와 함께 돌려준다(별빛 아카데미 자습 기록과 같은 자료).
 *
 * 규칙의 정본은 spacekijun 저장소:
 *   - 출석 1회 +5코인(자동) — supabase/migrations/20261009120000_unified_wallet_seaton_cutover.sql
 *   - 하루 최대 2회(+10코인), 같은 날은 예약 id 순서 — 20261013180000_study_attendance_daily_cap.sql
 * 화면은 규칙을 새로 만들지 않고 서버가 준 eligible · claimed 로만 나눈다.
 */

/** 출석 1회 코인 — 서버 wallet_private.on_attendance 의 5 */
export const STUDY_REWARD_COINS = 5;
/** 하루 최대 회차(= +10코인) — 서버 on_attendance · study_claim 의 2 */
export const STUDY_DAILY_CAP = 2;

export type StudyAttendance = 'attended' | 'excused' | 'supplement' | 'pending';

export interface StudyEntry {
  id: string;
  day: string;
  room: string;
  period: string;
  startTime: string | null;
  endTime: string | null;
  attendance: StudyAttendance;
  /** 서버 판정: 출석이고 오늘까지인가 */
  eligible: boolean;
  /** 영수증이 있는가 (= 코인을 받았다) */
  claimed: boolean;
}

export interface StudyWeek {
  /** 이번 주 월요일 (YYYY-MM-DD, 한국 날짜) */
  week: string;
  /** 서버의 오늘 (한국 날짜) */
  today: string;
  entries: StudyEntry[];
  /** 이번 주 받은 코인 합 (영수증 금액 합) */
  claimedCoins: number;
}

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : null);
const ATTENDANCE = new Set<StudyAttendance>(['attended', 'excused', 'supplement', 'pending']);

/** RPC academy_study_read 의 jsonb → StudyWeek */
export const parseStudyWeek = (raw: unknown): StudyWeek => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const entries = Array.isArray(r.entries) ? (r.entries as Record<string, unknown>[]) : [];
  return {
    week: String(r.week ?? ''),
    today: String(r.today ?? ''),
    claimedCoins: num(r.claimed_coins),
    entries: entries.map(e => {
      const attendance = String(e.attendance ?? 'pending') as StudyAttendance;
      return {
        id: String(e.id ?? ''),
        day: String(e.day ?? ''),
        room: str(e.room) ?? '자습실',
        period: str(e.period) ?? '',
        startTime: str(e.start_time),
        endTime: str(e.end_time),
        attendance: ATTENDANCE.has(attendance) ? attendance : 'pending',
        eligible: e.eligible === true,
        claimed: e.claimed === true,
      };
    }),
  };
};

/**
 * 한 회차가 코인과 어떤 관계인가
 * - paid      출석 확인 → +5 받음
 * - capped    출석했지만 그날 이미 2회 받음 (하루 최대 10코인)
 * - claimable 출석했는데 아직 안 들어옴 → 별빛 아카데미 자습 기록에서 받을 수 있다(자동 지급이 실패했을 때)
 * - excused · supplement  인정출석·보완 — 코인 대상이 아니다
 * - waiting   오늘 회차, 출석 확인 전
 * - missed    지난 회차인데 출석 기록이 없다
 * - upcoming  앞으로의 회차
 */
export type StudyRewardStatus =
  | 'paid'
  | 'capped'
  | 'claimable'
  | 'excused'
  | 'supplement'
  | 'waiting'
  | 'missed'
  | 'upcoming';

export interface StudyRewardRow extends StudyEntry {
  status: StudyRewardStatus;
  /** 이 회차로 받은 코인 */
  coins: number;
}

const byId = (a: StudyEntry, b: StudyEntry) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const studyRewardRows = (week: Pick<StudyWeek, 'today' | 'entries'>): StudyRewardRow[] => {
  // 받지 못한 출석 중 «하루 최대»에 걸린 것 — 서버와 같이 같은 날은 예약 id 순서로 남은 자리를 채운다
  const capped = new Set<string>();
  const days = new Map<string, StudyEntry[]>();
  for (const e of week.entries) {
    if (e.eligible) days.set(e.day, [...(days.get(e.day) ?? []), e]);
  }
  for (const list of days.values()) {
    let room = Math.max(0, STUDY_DAILY_CAP - list.filter(e => e.claimed).length);
    for (const e of list.filter(x => !x.claimed).sort(byId)) {
      if (room > 0) room -= 1;
      else capped.add(e.id);
    }
  }

  return week.entries.map(e => {
    let status: StudyRewardStatus;
    if (e.claimed) status = 'paid';
    else if (e.eligible) status = capped.has(e.id) ? 'capped' : 'claimable';
    else if (e.attendance === 'excused') status = 'excused';
    else if (e.attendance === 'supplement') status = 'supplement';
    else if (e.day > week.today) status = 'upcoming';
    else if (e.day === week.today) status = 'waiting';
    else status = 'missed';
    return { ...e, status, coins: status === 'paid' ? STUDY_REWARD_COINS : 0 };
  });
};

export interface StudyRewardSummary {
  /** 이번 주 출석으로 받은 코인 */
  coins: number;
  /** 코인을 받은 회차 수 */
  paid: number;
  /** 하루 최대에 걸려 못 받은 회차 수 */
  capped: number;
  /** 아직 안 들어온(받을 수 있는) 회차 수 */
  claimable: number;
}

export const summarizeStudyRewards = (
  rows: StudyRewardRow[],
  claimedCoins?: number
): StudyRewardSummary => {
  const count = (s: StudyRewardStatus) => rows.filter(r => r.status === s).length;
  const paid = count('paid');
  return {
    // 서버 영수증 금액 합이 정본 — 없으면 회차 × 5
    coins: claimedCoins ?? paid * STUDY_REWARD_COINS,
    paid,
    capped: count('capped'),
    claimable: count('claimable'),
  };
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '2026-10-13' → '10/13 (화)' — 시간대와 무관하게 날짜 문자열로만 계산 */
export const formatStudyDay = (day: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return day;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${mo}/${d} (${weekday})`;
};

/** 이번 주 범위 '10/13 (월) ~ 10/19 (일)' */
export const formatStudyWeekRange = (week: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(week);
  if (!m) return '';
  const end = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + 6));
  const endKey = end.toISOString().slice(0, 10);
  return `${formatStudyDay(week)} ~ ${formatStudyDay(endKey)}`;
};

/** 회차 상태를 학생에게 짧게 */
export const STUDY_REWARD_STATUS_LABEL: Record<StudyRewardStatus, string> = {
  paid: `+${STUDY_REWARD_COINS}코인`,
  capped: '하루 최대 10코인',
  claimable: '아직 안 들어옴',
  excused: '인정출석 · 코인 없음',
  supplement: '보완 · 코인 없음',
  waiting: '출석 확인 전',
  missed: '출석 기록 없음',
  upcoming: '예정',
};
