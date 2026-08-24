import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DetailPageContainerProps {
  children: ReactNode;
  /** Override/extend the outer <main>'s padding — e.g. Journey keeps extra mobile
   *  bottom clearance for JourneyBookingSidebar's fixed bottom bar. */
  mainClassName?: string;
  className?: string;
}

/**
 * The one shared top-level shell for every internal detail page (Destination, Region,
 * Journey, Stay, Experience, Expert) — <main> owns the top spacing below the (untouched)
 * global Navbar, <section> owns the max-width/horizontal padding that back-link, hero,
 * tabs and main content all align to. Deliberately dumb — no grid/tabs/sidebar opinions
 * — so it wraps each page's very different content shape without fighting it.
 */
export default function DetailPageContainer({ children, mainClassName, className }: DetailPageContainerProps) {
  return (
    <main className={cn('min-h-screen px-6 py-14 sm:px-10 lg:px-16', mainClassName)}>
      <section className={cn('mx-auto max-w-[1440px] space-y-6', className)}>{children}</section>
    </main>
  );
}
