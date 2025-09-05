import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, help, leftIcon, rightIcon, fullWidth = true, ...props }, ref) => {
    const inputId = React.useId();
    const errorId = React.useId();
    const helpId = React.useId();
    
    const isInvalid = error ? true : false;

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">{leftIcon}</span>
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200',
              error && 'border-error-300 focus:ring-error-500 focus:border-error-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            aria-describedby={error ? errorId : help ? helpId : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-sm">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-error-600">
            {error}
          </p>
        )}
        {help && !error && (
          <p id={helpId} className="text-sm text-gray-500">
            {help}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
