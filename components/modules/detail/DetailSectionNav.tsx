'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DetailSection {
  id: string;
  label: string;
}

export interface DetailSectionNavProps {
  sections: DetailSection[];
}

// Shared sticky scroll-spy tabs for the internal detail pages that use anchor-section
// navigation (Region, Destination) — lifted from Region's original implementation.
// Deliberately has NO negative-margin "bleed to viewport edge" trick: that combination
// (used by Destination's now-retired inline nav) measurably leaked past the viewport at
// 320-375px, since this nav sits one level deep inside a plain, unpadded
// DetailPageContainer section rather than main's own padded box.
export default function DetailSectionNav({ sections }: DetailSectionNavProps) {
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-0 z-20 min-w-0 overflow-x-auto border-y border-slate-200 bg-white/95 px-2 py-3 backdrop-blur"
    >
      <div className="flex w-max min-w-full gap-6 text-sm font-semibold text-slate-600">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              'whitespace-nowrap py-1 transition-colors duration-300 ease-in-out hover:text-apex-600',
              activeId === section.id ? 'text-apex-600' : undefined
            )}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
