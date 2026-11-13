import { Fragment } from 'react';
import { Coins } from 'lucide-react';
import { Card } from '@components/common/Card';
import {
  STUDY_REWARD_STATUS_LABEL,
  formatStudyDay,
  formatStudyWeekRange,
  studyRewardRows,
  summarizeStudyRewards,
  type StudyRewardRow,
  type StudyRewardStatus,
  type StudyWeek,
} from '@utils/studyRewards';

interface WeeklyStudyRewardsProps {
  /** null = 아직 못 읽음 · 읽기 실패 */
  week: StudyWeek | null;
  isLoading: boolean;
}

const STATUS_TONE: Record<StudyRewardStatus, string> = {
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  capped: 'bg-muted text-muted-foreground',
  claimable: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  excused: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
  supplement: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  waiting: 'bg-muted text-muted-foreground',
  missed: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  upcoming: 'bg-muted/60 text-muted-foreground',
};

/** 상태만으로는 이유가 안 읽히는 경우의 한 줄 설명 */
const STATUS_NOTE: Partial<Record<StudyRewardStatus, string>> = {
  capped: '이날 이미 2회(10코인)를 받았어요',
  claimable: '별빛 아카데미의 자습 기록에서 받을 수 있어요',
};

/** 서버(study_rows)가 교시 없는 열람실(아침 자습)에 붙이는 이름 — 방 이름만으로 충분해 감춘다 */
const NO_PERIOD = '교시 구분 없음';

const timeRange = (row: StudyRewardRow) =>
  row.startTime && row.endTime ? `${row.startTime}–${row.endTime}` : null;

export const WeeklyStudyRewards = ({ week, isLoading }: WeeklyStudyRewardsProps) => {
  const rows = week ? studyRewardRows(week) : [];
  const summary = summarizeStudyRewards(rows, week?.claimedCoins);
  const days = Array.from(new Set(rows.map(row => row.day))).sort();

  return (
    <Card
      padding="none"
      className="overflow-hidden"
      role="region"
      aria-labelledby="weekly-study-rewards-title"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Coins className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="weekly-study-rewards-title"
              className="font-semibold tracking-[-0.015em] text-foreground"
            >
              이번 주 출석 코인
            </h2>
            <p className="text-sm text-muted-foreground">
              {week
                ? // 좁은 칸에서도 «10/18 (일)» 한 덩이는 끊기지 않게
                  formatStudyWeekRange(week.week)
                    .split(' ~ ')
                    .map((part, i) => (
                      <Fragment key={part}>
                        {i > 0 && ' ~ '}
                        <span className="whitespace-nowrap">{part}</span>
                      </Fragment>
                    ))
                : '출석이 확인되면 자동으로 들어와요'}
            </p>
          </div>
        </div>
        {week && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold tracking-[-0.035em] text-foreground">
              +{summary.coins}
              <span className="ml-0.5 text-sm font-semibold text-muted-foreground">코인</span>
            </p>
            <p className="text-xs text-muted-foreground">출석 {summary.paid}회</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5 sm:p-6" aria-busy="true">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      ) : !week ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
          출석 코인 기록을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.
        </p>
      ) : rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
          이번 주에 신청한 자리가 없어요.
        </p>
      ) : (
        <ol className="divide-y divide-border/60">
          {days.map(day => (
            <li key={day} className="px-5 py-3 sm:px-6">
              <p className="text-xs font-semibold text-muted-foreground">
                {formatStudyDay(day)}
                {day === week.today && <span className="ml-1.5 text-primary">오늘</span>}
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {rows
                  .filter(row => row.day === day)
                  .map(row => (
                    <li key={row.id} className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground" title={row.room}>
                          {row.room}
                          {row.period && row.period !== NO_PERIOD && (
                            <span className="text-muted-foreground"> · {row.period}</span>
                          )}
                        </p>
                        {(timeRange(row) || STATUS_NOTE[row.status]) && (
                          <p className="text-xs text-muted-foreground">
                            {STATUS_NOTE[row.status] ?? timeRange(row)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[row.status]}`}
                      >
                        {STUDY_REWARD_STATUS_LABEL[row.status]}
                      </span>
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      <p className="border-t border-border/70 bg-muted/20 px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">
        출석이 확인되면 1회 <strong className="text-foreground">+5코인</strong>이 자동으로 들어와요
        (하루 최대 10코인). 인정출석·보완은 코인이 없고, 출석이 취소되면 다시 빠져요.
      </p>
    </Card>
  );
};
