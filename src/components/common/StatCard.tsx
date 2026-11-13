import { ReactNode } from 'react';
import { Card } from './Card';

export type StatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONE_VALUE: Record<StatTone, string> = {
  neutral: 'text-foreground',
  primary: 'text-primary',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const TONE_ICON: Record<StatTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** 값 아래 보조 설명 */
  hint?: ReactNode;
  tone?: StatTone;
  icon?: ReactNode;
  /** 전월/전주 대비 등 증감 (양수면 초록, 음수면 빨강) */
  delta?: number;
  deltaSuffix?: string;
}

/**
 * 숫자 하나를 강조하는 요약 카드.
 * 대시보드마다 조금씩 다르게 만들어 쓰던 것을 통일합니다.
 */
export const StatCard = ({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
  delta,
  deltaSuffix = '',
}: StatCardProps) => (
  <Card padding="sm" variant="interactive" className="rounded-[1.5rem] sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-muted-foreground sm:text-sm">{label}</p>
        <p
          className={`mt-2 text-2xl font-bold tabular-nums tracking-[-0.035em] sm:text-3xl ${TONE_VALUE[tone]}`}
        >
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>

      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${TONE_ICON[tone]}`}
        >
          {icon}
        </span>
      )}
    </div>

    {delta !== undefined && delta !== 0 && (
      <p
        className={`mt-2 text-xs font-medium tabular-nums ${
          delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
        {deltaSuffix}
      </p>
    )}
  </Card>
);
