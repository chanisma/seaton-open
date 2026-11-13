import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, fullWidth = false, options, placeholder, className = '', ...props },
    ref
  ) => {
    const baseClasses =
      'min-h-11 appearance-none rounded-xl border bg-card/90 px-3.5 pr-10 text-sm font-medium text-foreground shadow-card outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-card focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground';

    const errorClasses = error ? 'border-destructive focus:ring-destructive' : 'border-input';

    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthClasses} ${className}`}>
        {label && (
          <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
        )}

        <div className="relative">
          <select
            ref={ref}
            aria-invalid={!!error}
            className={`${baseClasses} ${errorClasses} ${widthClasses}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
