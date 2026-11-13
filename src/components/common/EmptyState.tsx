import { ReactNode } from 'react';

interface EmptyStateProps {
  /** 상단 아이콘 (lucide-react 아이콘 권장) */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** 표 안에 들어갈 때는 'compact' */
  size?: 'default' | 'compact';
}

/**
 * 데이터가 없을 때 보여주는 공통 상태.
 * 이전에는 "데이터가 없습니다." 한 줄만 회색으로 띄우는 코드가 화면마다 복사돼 있었습니다.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  size = 'default',
}: EmptyStateProps) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      size === 'compact' ? 'py-8 px-4' : 'py-16 px-6'
    }`}
  >
    {icon && (
      <div
        className={`mb-4 flex items-center justify-center rounded-2xl bg-muted text-muted-foreground ${
          size === 'compact' ? 'h-10 w-10' : 'h-14 w-14'
        }`}
      >
        {icon}
      </div>
    )}
    <p
      className={`font-semibold text-foreground ${size === 'compact' ? 'text-sm' : 'text-base sm:text-lg'}`}
    >
      {title}
    </p>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-balance">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
