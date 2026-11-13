import { ComponentProps, ReactNode } from 'react';

/**
 * 페이지 위에 올라가는 표면(surface).
 *
 * 이전에는 흰 배경 + 회색 다크값 + 반경 + 그림자 조합이 82곳에 흩어져 있었고,
 * 반경(lg/xl/2xl)과 그림자(sm/md/lg)가 화면마다 달랐습니다.
 * 여기서 한 번만 정의합니다.
 */

type CardVariant = 'default' | 'interactive' | 'muted' | 'outline';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends ComponentProps<'div'> {
  variant?: CardVariant;
  padding?: CardPadding;
}

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: 'content-surface text-card-foreground',
  interactive:
    'content-surface text-card-foreground hover:shadow-card-hover hover:border-primary/20 transition-[border-color,box-shadow] duration-200',
  muted: 'bg-muted/45 text-card-foreground border border-border/60',
  outline: 'bg-card/30 text-card-foreground border border-border/80',
};

const PADDING_CLASS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const Card = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) => (
  <div
    className={`rounded-2xl ${VARIANT_CLASS[variant]} ${PADDING_CLASS[padding]} ${className}`}
    {...props}
  >
    {children}
  </div>
);

interface CardHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** 우측 액션 영역 (버튼, 필터 등) */
  actions?: ReactNode;
}

/** 카드 상단 제목 영역. 제목 크기와 간격을 화면 간 통일합니다. */
export const CardHeader = ({
  title,
  description,
  actions,
  className = '',
  ...props
}: CardHeaderProps) => (
  <div
    className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}
    {...props}
  >
    <div className="min-w-0">
      <h2 className="text-base font-semibold tracking-[-0.012em] text-foreground sm:text-lg">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
