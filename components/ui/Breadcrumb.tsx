import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  /** Omit only on the current page's own final item — it never links to itself. */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// Small, reusable visible breadcrumb trail — pairs with a page's own real
// BreadcrumbList JSON-LD (see lib/schema.ts's buildBreadcrumbListSchema) so structured
// data always reflects something actually shown on the page, never an invisible-only
// claim. Styled for the image-led DetailHero overlay (light text over a dark gradient)
// since that's its first real use (Journey detail pages) — pass `className` to adapt it
// elsewhere. The current page's own item never renders as a link (no useless self-link)
// and carries `aria-current="page"` for assistive tech.
export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-white/70 sm:text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight size={14} className="shrink-0 text-white/40" aria-hidden="true" /> : null}
              {isLast || !item.href ? (
                <span aria-current={isLast ? 'page' : undefined} className="text-white">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="cursor-hover transition-colors duration-300 ease-in-out hover:text-white">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
