import { ComponentProps, ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-accent text-accent-foreground',
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-500/12 text-red-700 dark:text-red-300',
  info: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  outline: 'border border-border text-muted-foreground',
};

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone;
  children: ReactNode;
}

/** 상태·수치를 감싸는 작은 알약 라벨. */
export const Badge = ({ tone = 'neutral', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASS[tone]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

/** 출석률(0~100)에 맞는 톤을 돌려줍니다. 화면마다 다르던 기준을 통일합니다. */
export const attendanceRateTone = (rate: number): BadgeTone => {
  if (rate >= 80) return 'success';
  if (rate >= 60) return 'warning';
  return 'danger';
};
