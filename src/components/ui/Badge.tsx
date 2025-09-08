import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200',
        secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
        success: 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200',
        warning: 'bg-warning-100 dark:bg-warning-900 text-warning-800 dark:text-warning-200',
        error: 'bg-error-100 dark:bg-error-900 text-error-800 dark:text-error-200',
        info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
        pink: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
        indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full mr-1.5',
              variant === 'primary' && 'bg-primary-400',
              variant === 'secondary' && 'bg-gray-400',
              variant === 'success' && 'bg-success-400',
              variant === 'warning' && 'bg-warning-400',
              variant === 'error' && 'bg-error-400',
              variant === 'info' && 'bg-blue-400',
              variant === 'purple' && 'bg-purple-400',
              variant === 'pink' && 'bg-pink-400',
              variant === 'indigo' && 'bg-indigo-400'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge Component
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>['variant'] => {
      const statusMap: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
        // User statuses
        active: 'success',
        pending: 'warning',
        rejected: 'error',
        suspended: 'secondary',
        
        // Request statuses
        approved: 'success',
        cancelled: 'secondary',
        
        // Copy statuses
        available: 'success',
        borrowed: 'primary',
        reserved: 'warning',
        lost: 'error',
        maintenance: 'secondary',
        
        // Copy conditions
        new: 'success',
        good: 'primary',
        used: 'warning',
        worn: 'error',
        damaged: 'error',
        
        // Roles
        superadmin: 'purple',
        admin: 'primary',
        student: 'success',
        guest: 'secondary',
      };
      
      return statusMap[status] || 'secondary';
    };

    return (
      <Badge
        ref={ref}
        variant={getStatusVariant(status)}
        className={className}
        {...props}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { Badge, StatusBadge, badgeVariants };
