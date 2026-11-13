interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) => {
  const baseClasses = 'bg-muted';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton 조합 컴포넌트들
export const CardSkeleton = () => (
  <div className="bg-card border border-border/70 rounded-xl shadow-card p-6 space-y-4 animate-pulse">
    <Skeleton variant="text" height="1.5rem" width="60%" />
    <Skeleton variant="text" height="1rem" />
    <Skeleton variant="text" height="1rem" width="80%" />
    <Skeleton variant="rectangular" height="200px" />
  </div>
);

export const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <Skeleton variant="text" height="1rem" />
    </td>
    <td className="px-6 py-4">
      <Skeleton variant="text" height="1rem" />
    </td>
    <td className="px-6 py-4">
      <Skeleton variant="text" height="1rem" />
    </td>
    <td className="px-6 py-4">
      <Skeleton variant="text" height="1rem" />
    </td>
  </tr>
);

export const StatCardSkeleton = () => (
  <div className="bg-card border border-border/70 rounded-xl shadow-card p-4 animate-pulse">
    <Skeleton variant="text" height="0.875rem" width="60%" className="mb-2" />
    <Skeleton variant="text" height="2rem" width="40%" />
  </div>
);

export const SeatMapSkeleton = () => (
  <div className="space-y-4">
    <Skeleton variant="text" height="1.5rem" width="40%" />
    <div className="grid grid-cols-8 gap-4">
      {Array.from({ length: 32 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height="4rem" width="4rem" />
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-card border border-border/70 rounded-xl shadow-card p-6 animate-pulse">
    <Skeleton variant="text" height="1.5rem" width="50%" className="mb-4" />
    <Skeleton variant="rectangular" height="300px" />
  </div>
);
