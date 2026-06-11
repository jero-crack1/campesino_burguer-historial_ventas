import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent-subtle)] text-[var(--accent-text)]',
        success: 'bg-[var(--success-subtle)] text-[var(--success-text)]',
        warning: 'bg-[var(--warning-subtle)] text-[var(--warning-text)]',
        danger: 'bg-[var(--danger-subtle)] text-[var(--danger-text)]',
        secondary: 'bg-[var(--surface-2)] text-[var(--ink-muted)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
