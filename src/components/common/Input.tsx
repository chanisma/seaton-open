import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    const baseClasses =
      'h-10 px-3.5 border rounded-lg bg-card text-foreground placeholder:text-muted-foreground shadow-card transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent hover:border-ring/40 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed';

    const errorClasses = error
      ? 'border-destructive focus-visible:ring-destructive'
      : 'border-input';

    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthClasses} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
        )}

        <input
          ref={ref}
          aria-invalid={!!error}
          className={`${baseClasses} ${errorClasses} ${widthClasses}`}
          {...props}
        />

        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
