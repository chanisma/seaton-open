import { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** 우측 액션 영역 (버튼 등) */
  actions?: ReactNode;
  /** 제목 왼쪽 아이콘 */
  icon?: ReactNode;
}

/**
 * 페이지 상단 제목 블록.
 * 화면마다 h1/h2 크기와 여백이 제각각이던 것을 하나로 맞춥니다.
 */
export const PageHeader = ({ title, description, actions, icon }: PageHeaderProps) => (
  <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 items-start gap-3.5">
      {icon && (
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-accent text-accent-foreground shadow-card">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground text-balance [word-break:keep-all] sm:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
