import { ComponentProps } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses =
    'pressable relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl font-semibold outline-none disabled:pointer-events-none disabled:opacity-45';

  const variantClasses = {
    primary:
      'border border-primary/90 bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_hsl(var(--primary)/0.8)] hover:bg-primary/92 hover:shadow-[0_12px_24px_-12px_hsl(var(--primary)/0.75)]',
    secondary:
      'border border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/72',
    outline:
      'border border-border/80 bg-card/80 text-foreground shadow-card hover:border-primary/25 hover:bg-accent/65',
    danger:
      'border border-destructive/90 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
    ghost: 'border border-transparent text-foreground hover:bg-muted/75',
  };

  const sizeClasses = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-12 px-6 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};
