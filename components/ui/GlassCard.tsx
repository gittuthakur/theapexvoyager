import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export function glassCardClass(hoverLift = false, className?: string) {
  return cn(
    'rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-glow backdrop-blur-xl',
    hoverLift && 'transition hover:-translate-y-1 hover:bg-slate-900/90',
    className
  );
}

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
  hoverLift?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, as = 'div', hoverLift = false, children, ...props }, ref) => {
    const Component = as as 'div';
    return (
      <Component ref={ref} className={glassCardClass(hoverLift, className)} {...props}>
        {children}
      </Component>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
