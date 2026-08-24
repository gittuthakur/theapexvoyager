import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DetailMetaItemProps {
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

/** One icon+text (or plain text) entry inside a DetailHero `meta` row — composed
 *  differently per page (Region/Journey use icon+text pairs; Destination/Expert render
 *  their own badge/pill markup directly instead, since DetailHero's `meta` slot is a
 *  plain ReactNode, not a rigid shape). */
export function DetailMetaItem({ icon: Icon, children, className }: DetailMetaItemProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {Icon ? <Icon size={16} className="text-apex-300" /> : null}
      {children}
    </span>
  );
}
