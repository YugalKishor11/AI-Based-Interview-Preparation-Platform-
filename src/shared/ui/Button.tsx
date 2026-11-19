import React from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabledReason?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, disabledReason, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
      icon: 'p-2.5 h-10 w-10',
    };

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success: 'btn-success',
    };

    const isDisabled = disabled || loading || Boolean(disabledReason);

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        title={disabledReason}
        aria-disabled={isDisabled}
        className={cn(
          'btn',
          variantClasses[variant],
          sizeClasses[size],
          loading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" className="mr-1.5" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
