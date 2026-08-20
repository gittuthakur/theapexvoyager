'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Bus, ChevronDown, Info, Menu, Phone, Search, UserCheck, X, type LucideIcon } from 'lucide-react';
import { navRoutes, siteConfig } from '@/config/site.config';
import { ButtonLink } from '@/components/ui/Button';
import { GlobalSearch } from '@/components/modules/GlobalSearch';
import { cn } from '@/lib/utils';

// Routes whose page starts with <HeroSection> — the navbar overlays these transparently
// at scroll = 0 and turns solid on scroll. Every other route stays solid from the top.
const HERO_ROUTES = new Set(['/', '/journeys', '/destinations', '/experiences', '/transport', '/experts', '/stays']);

// Same navRoutes entries (same labels, hrefs, functionality) — these three are just
// relocated into the compact "More" dropdown instead of sitting in the primary row.
// Keyed by label (not array position) so this still holds if navRoutes is reordered.
const MORE_MENU_LABELS = new Set(['Transport', 'Travel Experts', 'About Us']);

const MORE_MENU_META: Record<string, { description: string; icon: LucideIcon }> = {
  Transport: { description: 'Transfers & mobility', icon: Bus },
  'Travel Experts': { description: 'Plan with a local expert', icon: UserCheck },
  'About Us': { description: 'Our story & approach', icon: Info }
};

interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

// The existing /journeys route already supports a real ?category= filter (see
// app/journeys/page.tsx) matched case-insensitively against each package's
// category — these values (Adventure, Family, Honeymoon, Luxury, Offbeat) are
// exactly what's used in config/packages.config.ts, so every href here is a
// real, working filter rather than an invented one.
const JOURNEYS_DROPDOWN_ITEMS: NavDropdownItem[] = [
  { label: 'All Journeys', href: '/journeys' },
  { label: 'Adventure Journeys', href: '/journeys?category=Adventure' },
  { label: 'Family Journeys', href: '/journeys?category=Family' },
  { label: 'Honeymoon Journeys', href: '/journeys?category=Honeymoon' },
  { label: 'Luxury Journeys', href: '/journeys?category=Luxury' },
  { label: 'Offbeat Journeys', href: '/journeys?category=Offbeat' },
  // No "Weekend Escapes" category exists in the journeys data — this points at
  // the existing base route instead of a fabricated filter that would just
  // return an empty result set.
  { label: 'Weekend Escapes', href: '/journeys' }
];

// The existing /homestays route already supports a real ?category= filter (see
// app/homestays/page.tsx) against the HotelCategory union (types/hotel.ts) —
// every href below is one of those real, existing values.
// Hrefs point at the Apex Stays vertical (config/stayTypes.config.ts is the
// single source of truth for these slugs — "Cottages & Cabins" and "Villas"
// intentionally share the same real Villa-category filter, same as before).
const STAYS_DROPDOWN_ITEMS: NavDropdownItem[] = [
  { label: 'All Stays', href: '/stays' },
  { label: 'Hotels', href: '/stays/hotels' },
  { label: 'Resorts', href: '/stays/resorts' },
  { label: 'Homestays', href: '/stays/homestays' },
  { label: 'Cottages & Cabins', href: '/stays/cottages' },
  { label: 'Treehouses', href: '/stays/treehouses' },
  { label: 'Villas', href: '/stays/villas' },
  { label: 'Camps & Retreats', href: '/stays/glamping' }
];

// Shared trigger/panel used by the Journeys, Stays and Travel Services nav
// dropdowns, so all three stay pixel-identical in style and behavior. The
// whole label + chevron is the toggle — same button-only trigger pattern as
// Travel Services — none of these three parent items navigate on their own;
// only the items inside the opened panel do.
function NavDropdown({
  menuKey,
  label,
  items,
  eyebrow,
  active,
  isTransparent,
  isOpen,
  isActiveItem,
  onToggle,
  onSelect,
  registerRef
}: {
  menuKey: string;
  label: string;
  items: NavDropdownItem[];
  eyebrow?: string;
  active: boolean;
  isTransparent: boolean;
  isOpen: boolean;
  isActiveItem: (href: string) => boolean;
  onToggle: (key: string) => void;
  onSelect: () => void;
  registerRef: (key: string, node: HTMLDivElement | null) => void;
}) {
  return (
    <div className="relative" ref={(node) => registerRef(menuKey, node)}>
      <button
        type="button"
        onClick={() => onToggle(menuKey)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'cursor-hover flex items-center gap-1 whitespace-nowrap text-md font-medium transition border-b-2 border-transparent pb-1',
          isTransparent ? 'text-black hover:text-black/80' : 'text-slate-600',
          active
            ? cn(isTransparent ? 'text-black border-black' : 'text-apex-900 border-apex-700')
            : cn(isTransparent ? 'text-black/80 hover:text-black hover:border-apex-700' : 'text-slate-600 hover:text-slate-900 hover:border-apex-700')
        )}
      >
        {label}
        <ChevronDown size={15} className={cn('transition-transform duration-200 ease-in-out', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
        >
          {eyebrow ? (
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
          ) : null}
          {items.map((item) => {
            const Icon = item.icon;
            const itemActive = isActiveItem(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={onSelect}
                aria-current={itemActive ? 'page' : undefined}
                className={cn(
                  'cursor-hover flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 ease-in-out',
                  itemActive ? 'bg-apex-50' : 'hover:bg-slate-50'
                )}
              >
                {Icon ? (
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      itemActive ? 'bg-apex-100 text-apex-700' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Icon size={16} />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className={cn('block text-sm font-semibold', itemActive ? 'text-apex-900' : 'text-slate-900')}>
                    {item.label}
                  </span>
                  {item.description ? <span className="block text-xs text-slate-500">{item.description}</span> : null}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 64" fill="none" className={className}>
    <g clipPath="url(#clip0_204_3)">
    <path d="M36.816 21.7021L31.963 27.1738L33.9703 49.1781L52.0114 60.2731L36.816 21.7021Z" fill="url(#paint0_linear_204_3)"/>
    <path d="M29.8429 3.99167L2.30774 60.5608L2.3176 60.5559H2.32254L14.1741 47.2088L31.9637 27.1733L36.8167 21.7016L29.8429 3.99167Z" fill="url(#paint1_linear_204_3)"/>
    <path d="M33.9701 49.1772L30.7643 47.2083L19.0262 52.7143L34.6211 56.2856L52.0112 60.2721L33.9701 49.1772Z" fill="url(#paint2_linear_204_3)"/>
    <path d="M14.1733 47.2083L2.32181 60.5555L19.0264 52.7143L30.7645 47.2083H14.1733Z" fill="url(#paint3_linear_204_3)"/>
    <path d="M57.3729 15.4626L57.3406 8.04667L55.3006 8.05558L55.2956 6.9036L60.7075 6.87995L60.7126 8.03194L58.7086 8.0407L58.7409 15.4566L57.3729 15.4626ZM61.4396 15.4448L61.4022 6.87692L62.6982 6.87126L62.7104 9.67923L62.7465 9.70307C63.1041 9.14951 63.6667 8.81105 64.3267 8.80816C65.3107 8.80386 65.9366 9.24513 65.9423 10.5531L65.9635 15.4251L64.6675 15.4307L64.6482 11.0028C64.6446 10.1628 64.3912 9.83989 63.7432 9.84272C63.2152 9.84503 62.713 10.2672 62.7167 11.1072L62.7355 15.4392L61.4396 15.4448ZM71.6915 12.34L68.3195 12.3548L68.3211 12.7268C68.3249 13.5907 68.4377 14.6943 69.4097 14.69C70.3337 14.686 70.4371 13.6295 70.4354 13.2455L71.6594 13.2402C71.6656 14.6682 70.8055 15.5719 69.4016 15.5781C68.3456 15.5827 67.0362 15.2764 67.0232 12.2884C67.0158 10.5964 67.368 8.79488 69.396 8.78602C71.1959 8.77815 71.6806 9.85605 71.6885 11.656L71.6915 12.34ZM68.3156 11.4668L70.3916 11.4577L70.3901 11.1097C70.3865 10.2937 70.1198 9.67086 69.3878 9.67406C68.5598 9.67768 68.3114 10.4948 68.3151 11.3348L68.3156 11.4668Z" fill="black"/>
    <path d="M59.6805 36.4841C59.0383 36.9069 58.7294 36.7122 58.9783 35.9831L63.5981 23.0828L67.5181 23.0657L75.7356 45.43L71.5636 45.4482L69.3817 39.4937L66.1617 39.5078C63.2217 39.5206 61.5458 40.4519 60.55 43.2563L59.7477 45.4999L55.5758 45.5181L56.2674 43.583C58.2313 38.0584 61.2191 36.1693 67.099 36.1437L68.135 36.1391L65.5847 29.1782L63.4823 35.0674C62.3629 35.2123 60.8813 35.7508 59.6805 36.4841ZM89.4635 32.8539C91.7315 32.844 92.9863 31.6625 92.9772 29.5625C92.9681 27.4906 91.703 26.3201 89.435 26.33L77.6192 26.3816L77.6045 23.0216L89.4204 22.97C94.1804 22.9492 97.1594 25.4842 97.1771 29.5442C97.1949 33.6322 94.2381 36.1931 89.4781 36.2139L85.5022 36.2313C82.9822 36.2423 81.5883 37.6484 81.5993 40.1683L81.6221 45.4043L77.7021 45.4214L77.6793 40.1855C77.6589 35.5095 80.4476 32.8933 85.4875 32.8713L89.4635 32.8539ZM115.76 31.059L115.775 34.419L107.431 34.4554C104.911 34.4665 103.517 35.8726 103.528 38.3925L103.544 41.9485L116.367 41.8925L116.382 45.2524L99.6382 45.3256L99.6105 38.9697C99.5885 33.9297 102.376 31.1175 107.416 31.0955L115.76 31.059ZM99.5406 22.9258L116.284 22.8527L116.299 26.2126L99.5552 26.2858L99.5406 22.9258ZM132.058 45.184L127.123 37.2815L122.258 45.2268L117.638 45.247L124.811 33.5675L118.1 22.8447L122.692 22.8247L127.373 30.2803L131.988 22.7841L136.58 22.764L129.685 33.9942L136.678 45.1638L132.058 45.184ZM155.439 45.0818L147.221 22.7175L151.393 22.6993L157.372 38.9693L163.209 22.6477L167.381 22.6295L159.359 45.0647L155.439 45.0818ZM178.972 45.427C172.392 45.4558 167.751 40.66 167.722 33.8281C167.692 26.9961 172.291 22.16 178.871 22.1313C185.451 22.1025 190.092 26.8983 190.121 33.7302C190.151 40.5622 185.552 45.3983 178.972 45.427ZM178.958 42.0671C183.074 42.0491 185.943 38.6205 185.922 33.7486C185.9 28.8766 183.001 25.4732 178.885 25.4912C174.77 25.5092 171.9 28.9378 171.922 33.8097C171.943 38.6817 174.842 42.085 178.958 42.0671ZM204.481 22.4674L208.82 22.4484L203.132 34.3174C201.772 37.1234 201.331 38.6653 201.343 41.4373L201.358 44.8812L197.438 44.8984L197.423 41.4544C197.419 40.3904 197.47 39.4382 197.606 38.5136L189.781 22.5316L194.121 22.5126L199.347 33.1579L199.541 32.7371L204.481 22.4674ZM208.536 35.8338C207.894 36.2566 207.585 36.062 207.834 35.3329L212.454 22.4326L216.374 22.4154L224.591 44.7797L220.419 44.798L218.237 38.8434L215.017 38.8575C212.077 38.8704 210.402 39.8017 209.406 42.6061L208.604 44.8496L204.432 44.8678L205.123 42.9328C207.087 37.4081 210.075 35.5191 215.955 35.4934L216.991 35.4889L214.441 28.5559L212.338 34.4172C211.219 34.5621 209.737 35.1005 208.536 35.8338ZM244.687 41.5839C242.709 43.8326 239.803 45.1613 236.359 45.1763C229.779 45.2051 225.138 40.4093 225.108 33.5774C225.078 26.7454 229.677 21.9093 236.257 21.8806C239.253 21.8675 241.861 22.8641 243.801 24.5916L241.209 27.403C239.971 26.0364 238.26 25.2318 236.272 25.2405C232.156 25.2585 229.287 28.6871 229.308 33.559C229.329 38.431 232.228 41.8344 236.344 41.8164C238.08 41.8088 239.561 41.2143 240.761 40.1171L240.739 35.2451L235.139 35.2696L235.125 31.9096L244.645 31.868L244.687 41.5839ZM263.905 30.4119L263.92 33.7718L255.576 33.8083C253.056 33.8193 251.662 35.2254 251.673 37.7454L251.688 41.3013L264.512 41.2453L264.527 44.6053L247.783 44.6784L247.755 38.3225C247.733 33.2825 250.521 30.4703 255.561 30.4483L263.905 30.4119ZM247.685 22.2786L264.429 22.2055L264.444 25.5655L247.7 25.6386L247.685 22.2786ZM278.102 31.4699C280.37 31.46 281.625 30.3905 281.616 28.4585C281.608 26.5545 280.344 25.496 278.076 25.5059L266.82 25.5551L266.805 22.1951L278.061 22.146C283.017 22.1243 285.799 24.3802 285.816 28.4401C285.832 32.0521 283.714 34.2454 279.768 34.7386L286.446 44.5095L281.715 44.5302L275.12 34.8429L274.7 34.8448C272.18 34.8558 270.786 36.2619 270.797 38.7818L270.823 44.5778L266.903 44.5949L266.877 38.799C266.857 34.123 269.646 31.5068 274.686 31.4848L278.102 31.4699Z" fill="black"/>
    <path d="M55.9658 57.5192V50.9738H58.3628C58.8273 50.9738 59.2119 51.0505 59.5166 51.2039C59.8213 51.3552 60.0493 51.5608 60.2005 51.8207C60.3518 52.0785 60.4275 52.3694 60.4275 52.6932C60.4275 52.966 60.3774 53.1961 60.2772 53.3836C60.1771 53.5689 60.0429 53.7181 59.8745 53.831C59.7084 53.9418 59.5251 54.0228 59.3248 54.0739V54.1378C59.5422 54.1485 59.7542 54.2188 59.9608 54.3488C60.1696 54.4766 60.3422 54.6588 60.4786 54.8953C60.615 55.1318 60.6831 55.4194 60.6831 55.7582C60.6831 56.0927 60.6043 56.3932 60.4466 56.6595C60.2911 56.9237 60.0503 57.1336 59.7243 57.2891C59.3983 57.4425 58.9818 57.5192 58.4747 57.5192H55.9658ZM56.9534 56.6723H58.3788C58.8518 56.6723 59.1906 56.5807 59.3951 56.3974C59.5997 56.2142 59.702 55.9851 59.702 55.7103C59.702 55.5036 59.6498 55.314 59.5454 55.1414C59.441 54.9688 59.2918 54.8314 59.0979 54.7291C58.9062 54.6268 58.6782 54.5757 58.414 54.5757H56.9534V56.6723ZM56.9534 53.8054H58.2765C58.4981 53.8054 58.6973 53.7628 58.8742 53.6776C59.0532 53.5924 59.1949 53.4731 59.2993 53.3197C59.4058 53.1641 59.4591 52.9809 59.4591 52.7699C59.4591 52.4993 59.3642 52.2724 59.1746 52.0892C58.985 51.9059 58.6941 51.8143 58.3021 51.8143H56.9534V53.8054ZM63.1145 57.5192V50.9738H67.2182V51.8239H64.1021V53.8182H67.004V54.6652H64.1021V56.6691H67.2565V57.5192H63.1145ZM69.2924 50.9738H70.4142L72.124 53.9493H72.1944L73.9042 50.9738H75.026L72.6514 54.9496V57.5192H71.667V54.9496L69.2924 50.9738ZM82.5702 54.2465C82.5702 54.9454 82.4424 55.5462 82.1867 56.0491C81.931 56.5498 81.5805 56.9354 81.1352 57.206C80.692 57.4745 80.1881 57.6087 79.6235 57.6087C79.0567 57.6087 78.5507 57.4745 78.1054 57.206C77.6622 56.9354 77.3127 56.5487 77.0571 56.0459C76.8014 55.543 76.6735 54.9432 76.6735 54.2465C76.6735 53.5476 76.8014 52.9478 77.0571 52.4471C77.3127 51.9443 77.6622 51.5586 78.1054 51.2902C78.5507 51.0196 79.0567 50.8843 79.6235 50.8843C80.1881 50.8843 80.692 51.0196 81.1352 51.2902C81.5805 51.5586 81.931 51.9443 82.1867 52.4471C82.4424 52.9478 82.5702 53.5476 82.5702 54.2465ZM81.5922 54.2465C81.5922 53.7138 81.5059 53.2653 81.3333 52.901C81.1629 52.5345 80.9285 52.2575 80.6302 52.07C80.3341 51.8804 79.9985 51.7856 79.6235 51.7856C79.2463 51.7856 78.9097 51.8804 78.6135 52.07C78.3174 52.2575 78.083 52.5345 77.9104 52.901C77.74 53.2653 77.6547 53.7138 77.6547 54.2465C77.6547 54.7792 77.74 55.2287 77.9104 55.5952C78.083 55.9596 78.3174 56.2366 78.6135 56.4262C78.9097 56.6137 79.2463 56.7074 79.6235 56.7074C79.9985 56.7074 80.3341 56.6137 80.6302 56.4262C80.9285 56.2366 81.1629 55.9596 81.3333 55.5952C81.5059 55.2287 81.5922 54.7792 81.5922 54.2465ZM90.3445 50.9738V57.5192H89.4368L86.1098 52.7188H86.049V57.5192H85.0615V50.9738H85.9755L89.3058 55.7806H89.3665V50.9738H90.3445ZM95.1641 57.5192H93.0451V50.9738H95.2312C95.8725 50.9738 96.4233 51.1048 96.8835 51.3669C97.3438 51.6268 97.6964 52.0008 97.9414 52.4887C98.1886 52.9745 98.3122 53.5572 98.3122 54.2369C98.3122 54.9187 98.1875 55.5047 97.9382 55.9947C97.6911 56.4848 97.3331 56.8619 96.8644 57.1261C96.3956 57.3882 95.8288 57.5192 95.1641 57.5192ZM94.0327 56.6563H95.1097C95.6083 56.6563 96.0227 56.5625 96.353 56.375C96.6832 56.1854 96.9304 55.9116 97.0945 55.5537C97.2585 55.1936 97.3406 54.7547 97.3406 54.2369C97.3406 53.7234 97.2585 53.2877 97.0945 52.9297C96.9325 52.5718 96.6907 52.3001 96.369 52.1148C96.0472 51.9294 95.6477 51.8367 95.1705 51.8367H94.0327V56.6563ZM106.561 57.5192H104.442V50.9738H106.628C107.269 50.9738 107.82 51.1048 108.28 51.3669C108.741 51.6268 109.093 52.0008 109.338 52.4887C109.586 52.9745 109.709 53.5572 109.709 54.2369C109.709 54.9187 109.584 55.5047 109.335 55.9947C109.088 56.4848 108.73 56.8619 108.261 57.1261C107.793 57.3882 107.226 57.5192 106.561 57.5192ZM105.43 56.6563H106.507C107.005 56.6563 107.42 56.5625 107.75 56.375C108.08 56.1854 108.327 55.9116 108.491 55.5537C108.655 55.1936 108.738 54.7547 108.738 54.2369C108.738 53.7234 108.655 53.2877 108.491 52.9297C108.329 52.5718 108.088 52.3001 107.766 52.1148C107.444 51.9294 107.045 51.8367 106.567 51.8367H105.43V56.6563ZM112.197 57.5192V50.9738H116.301V51.8239H113.185V53.8182H116.087V54.6652H113.185V56.6691H116.339V57.5192H112.197ZM122.45 52.6932C122.416 52.3907 122.275 52.1563 122.028 51.9901C121.781 51.8218 121.47 51.7376 121.095 51.7376C120.826 51.7376 120.594 51.7802 120.398 51.8655C120.202 51.9486 120.05 52.0636 119.941 52.2106C119.835 52.3555 119.781 52.5206 119.781 52.706C119.781 52.8616 119.818 52.9958 119.89 53.1087C119.965 53.2216 120.061 53.3165 120.181 53.3932C120.302 53.4677 120.432 53.5306 120.571 53.5817C120.709 53.6307 120.842 53.6712 120.97 53.7032L121.609 53.8694C121.818 53.9205 122.032 53.9898 122.252 54.0771C122.471 54.1645 122.675 54.2795 122.862 54.4223C123.05 54.565 123.201 54.7419 123.316 54.9528C123.433 55.1638 123.492 55.4162 123.492 55.7103C123.492 56.081 123.396 56.4102 123.204 56.6978C123.015 56.9855 122.739 57.2124 122.376 57.3786C122.016 57.5448 121.581 57.6279 121.069 57.6279C120.579 57.6279 120.155 57.5501 119.797 57.3946C119.439 57.239 119.159 57.0185 118.957 56.733C118.754 56.4454 118.642 56.1045 118.621 55.7103H119.612C119.631 55.9468 119.708 56.1439 119.842 56.3015C119.978 56.4571 120.152 56.5732 120.363 56.6499C120.576 56.7245 120.809 56.7618 121.063 56.7618C121.342 56.7618 121.59 56.7181 121.808 56.6307C122.027 56.5412 122.2 56.4177 122.325 56.26C122.451 56.1002 122.514 55.9138 122.514 55.7007C122.514 55.5068 122.459 55.3481 122.348 55.2245C122.239 55.1009 122.091 54.9986 121.903 54.9177C121.718 54.8367 121.508 54.7653 121.274 54.7035L120.5 54.4926C119.976 54.3498 119.561 54.14 119.254 53.863C118.949 53.586 118.797 53.2195 118.797 52.7635C118.797 52.3864 118.899 52.0572 119.104 51.776C119.308 51.4947 119.585 51.2763 119.935 51.1208C120.284 50.9631 120.678 50.8843 121.117 50.8843C121.56 50.8843 121.951 50.9621 122.29 51.1176C122.631 51.2731 122.9 51.4873 123.096 51.76C123.292 52.0306 123.394 52.3417 123.402 52.6932H122.45ZM125.609 51.8239V50.9738H130.675V51.8239H128.633V57.5192H127.648V51.8239H125.609ZM134.042 50.9738V57.5192H133.054V50.9738H134.042ZM142.023 50.9738V57.5192H141.115L137.788 52.7188H137.728V57.5192H136.74V50.9738H137.654L140.984 55.7806H141.045V50.9738H142.023ZM145.277 57.5192H144.228L146.584 50.9738H147.725L150.08 57.5192H149.032L147.181 52.1627H147.13L145.277 57.5192ZM145.452 54.956H148.853V55.787H145.452V54.956ZM151.189 51.8239V50.9738H156.255V51.8239H154.213V57.5192H153.228V51.8239H151.189ZM159.622 50.9738V57.5192H158.634V50.9738H159.622ZM168.006 54.2465C168.006 54.9454 167.878 55.5462 167.622 56.0491C167.367 56.5498 167.016 56.9354 166.571 57.206C166.128 57.4745 165.624 57.6087 165.059 57.6087C164.492 57.6087 163.986 57.4745 163.541 57.206C163.098 56.9354 162.748 56.5487 162.493 56.0459C162.237 55.543 162.109 54.9432 162.109 54.2465C162.109 53.5476 162.237 52.9478 162.493 52.4471C162.748 51.9443 163.098 51.5586 163.541 51.2902C163.986 51.0196 164.492 50.8843 165.059 50.8843C165.624 50.8843 166.128 51.0196 166.571 51.2902C167.016 51.5586 167.367 51.9443 167.622 52.4471C167.878 52.9478 168.006 53.5476 168.006 54.2465ZM167.028 54.2465C167.028 53.7138 166.942 53.2653 166.769 52.901C166.599 52.5345 166.364 52.2575 166.066 52.07C165.77 51.8804 165.434 51.7856 165.059 51.7856C164.682 51.7856 164.345 51.8804 164.049 52.07C163.753 52.2575 163.519 52.5345 163.346 52.901C163.176 53.2653 163.09 53.7138 163.09 54.2465C163.09 54.7792 163.176 55.2287 163.346 55.5952C163.519 55.9596 163.753 56.2366 164.049 56.4262C164.345 56.6137 164.682 56.7074 165.059 56.7074C165.434 56.7074 165.77 56.6137 166.066 56.4262C166.364 56.2366 166.599 55.9596 166.769 55.5952C166.942 55.2287 167.028 54.7792 167.028 54.2465ZM175.78 50.9738V57.5192H174.872L171.545 52.7188H171.485V57.5192H170.497V50.9738H171.411L174.741 55.7806H174.802V50.9738H175.78ZM182.051 52.6932C182.017 52.3907 181.876 52.1563 181.629 51.9901C181.382 51.8218 181.071 51.7376 180.696 51.7376C180.427 51.7376 180.195 51.7802 179.999 51.8655C179.803 51.9486 179.651 52.0636 179.542 52.2106C179.435 52.3555 179.382 52.5206 179.382 52.706C179.382 52.8616 179.418 52.9958 179.491 53.1087C179.565 53.2216 179.662 53.3165 179.782 53.3932C179.903 53.4677 180.033 53.5306 180.171 53.5817C180.31 53.6307 180.443 53.6712 180.571 53.7032L181.21 53.8694C181.419 53.9205 181.633 53.9898 181.853 54.0771C182.072 54.1645 182.276 54.2795 182.463 54.4223C182.651 54.565 182.802 54.7419 182.917 54.9528C183.034 55.1638 183.093 55.4162 183.093 55.7103C183.093 56.081 182.997 56.4102 182.805 56.6978C182.615 56.9855 182.339 57.2124 181.977 57.3786C181.617 57.5448 181.181 57.6279 180.67 57.6279C180.18 57.6279 179.756 57.5501 179.398 57.3946C179.04 57.239 178.76 57.0185 178.557 56.733C178.355 56.4454 178.243 56.1045 178.222 55.7103H179.213C179.232 55.9468 179.309 56.1439 179.443 56.3015C179.579 56.4571 179.753 56.5732 179.964 56.6499C180.177 56.7245 180.41 56.7618 180.664 56.7618C180.943 56.7618 181.191 56.7181 181.408 56.6307C181.628 56.5412 181.8 56.4177 181.926 56.26C182.052 56.1002 182.115 55.9138 182.115 55.7007C182.115 55.5068 182.059 55.3481 181.948 55.2245C181.84 55.1009 181.692 54.9986 181.504 54.9177C181.319 54.8367 181.109 54.7653 180.875 54.7035L180.101 54.4926C179.577 54.3498 179.162 54.14 178.855 53.863C178.55 53.586 178.398 53.2195 178.398 52.7635C178.398 52.3864 178.5 52.0572 178.704 51.776C178.909 51.4947 179.186 51.2763 179.535 51.1208C179.885 50.9631 180.279 50.8843 180.718 50.8843C181.161 50.8843 181.552 50.9621 181.891 51.1176C182.232 51.2731 182.5 51.4873 182.696 51.76C182.892 52.0306 182.995 52.3417 183.003 52.6932H182.051ZM190.162 50.9738V57.5192H189.175V50.9738H190.162ZM198.143 50.9738V57.5192H197.236L193.909 52.7188H193.848V57.5192H192.86V50.9738H193.774L197.105 55.7806H197.165V50.9738H198.143ZM200.521 51.8239V50.9738H205.587V51.8239H203.545V57.5192H202.56V51.8239H200.521ZM213.371 54.2465C213.371 54.9454 213.243 55.5462 212.987 56.0491C212.732 56.5498 212.381 56.9354 211.936 57.206C211.493 57.4745 210.989 57.6087 210.424 57.6087C209.857 57.6087 209.351 57.4745 208.906 57.206C208.463 56.9354 208.113 56.5487 207.858 56.0459C207.602 55.543 207.474 54.9432 207.474 54.2465C207.474 53.5476 207.602 52.9478 207.858 52.4471C208.113 51.9443 208.463 51.5586 208.906 51.2902C209.351 51.0196 209.857 50.8843 210.424 50.8843C210.989 50.8843 211.493 51.0196 211.936 51.2902C212.381 51.5586 212.732 51.9443 212.987 52.4471C213.243 52.9478 213.371 53.5476 213.371 54.2465ZM212.393 54.2465C212.393 53.7138 212.307 53.2653 212.134 52.901C211.963 52.5345 211.729 52.2575 211.431 52.07C211.135 51.8804 210.799 51.7856 210.424 51.7856C210.047 51.7856 209.71 51.8804 209.414 52.07C209.118 52.2575 208.884 52.5345 208.711 52.901C208.541 53.2653 208.455 53.7138 208.455 54.2465C208.455 54.7792 208.541 55.2287 208.711 55.5952C208.884 55.9596 209.118 56.2366 209.414 56.4262C209.71 56.6137 210.047 56.7074 210.424 56.7074C210.799 56.7074 211.135 56.6137 211.431 56.4262C211.729 56.2366 211.963 55.9596 212.134 55.5952C212.307 55.2287 212.393 54.7792 212.393 54.2465ZM219.504 57.5192V50.9738H223.608V51.8239H220.491V53.8182H223.393V54.6652H220.491V56.6691H223.646V57.5192H219.504ZM226.874 50.9738L228.44 53.5338H228.491L230.057 50.9738H231.201L229.162 54.2465L231.214 57.5192H230.064L228.491 54.9944H228.44L226.867 57.5192H225.717L227.804 54.2465L225.73 50.9738H226.874ZM233.441 57.5192V50.9738H235.774C236.283 50.9738 236.705 51.0665 237.04 51.2518C237.374 51.4372 237.624 51.6907 237.791 52.0125C237.957 52.3321 238.04 52.6922 238.04 53.0927C238.04 53.4954 237.956 53.8576 237.787 54.1794C237.621 54.499 237.37 54.7525 237.033 54.94C236.699 55.1254 236.278 55.2181 235.771 55.2181H234.166V54.3807H235.681C236.003 54.3807 236.264 54.3253 236.464 54.2145C236.665 54.1016 236.812 53.9482 236.905 53.7543C236.999 53.5604 237.046 53.3399 237.046 53.0927C237.046 52.8456 236.999 52.6261 236.905 52.4344C236.812 52.2426 236.664 52.0924 236.461 51.9837C236.261 51.875 235.997 51.8207 235.669 51.8207H234.428V57.5192H233.441ZM240.458 57.5192V50.9738H244.561V51.8239H241.445V53.8182H244.347V54.6652H241.445V56.6691H244.6V57.5192H240.458ZM247.141 57.5192V50.9738H249.474C249.981 50.9738 250.402 51.0611 250.736 51.2358C251.073 51.4106 251.324 51.6524 251.49 51.9613C251.657 52.2682 251.74 52.6229 251.74 53.0256C251.74 53.4262 251.655 53.7788 251.487 54.0835C251.321 54.3861 251.07 54.6215 250.733 54.7898C250.398 54.9581 249.978 55.0423 249.47 55.0423H247.703V54.1922H249.381C249.701 54.1922 249.961 54.1464 250.161 54.0547C250.363 53.9631 250.511 53.83 250.605 53.6552C250.699 53.4805 250.746 53.2706 250.746 53.0256C250.746 52.7785 250.698 52.5643 250.602 52.3832C250.508 52.2021 250.36 52.0636 250.158 51.9677C249.957 51.8697 249.694 51.8207 249.368 51.8207H248.128V57.5192H247.141ZM250.372 54.5661L251.989 57.5192H250.864L249.279 54.5661H250.372ZM255.189 50.9738V57.5192H254.201V50.9738H255.189ZM257.887 57.5192V50.9738H261.991V51.8239H258.875V53.8182H261.777V54.6652H258.875V56.6691H262.029V57.5192H257.887ZM269.853 50.9738V57.5192H268.945L265.618 52.7188H265.558V57.5192H264.57V50.9738H265.484L268.814 55.7806H268.875V50.9738H269.853ZM277.99 53.1023H276.993C276.955 52.8893 276.883 52.7018 276.779 52.5398C276.674 52.3779 276.547 52.2405 276.395 52.1275C276.244 52.0146 276.075 51.9294 275.887 51.8719C275.702 51.8143 275.505 51.7856 275.296 51.7856C274.919 51.7856 274.581 51.8804 274.283 52.07C273.987 52.2596 273.752 52.5377 273.58 52.9042C273.409 53.2706 273.324 53.7181 273.324 54.2465C273.324 54.7792 273.409 55.2287 273.58 55.5952C273.752 55.9617 273.988 56.2387 274.286 56.4262C274.584 56.6137 274.92 56.7074 275.293 56.7074C275.499 56.7074 275.695 56.6797 275.881 56.6243C276.068 56.5668 276.238 56.4826 276.389 56.3719C276.54 56.2611 276.668 56.1258 276.772 55.966C276.879 55.804 276.952 55.6187 276.993 55.4099L277.99 55.413C277.937 55.7348 277.833 56.0309 277.68 56.3015C277.529 56.57 277.334 56.8023 277.095 56.9983C276.859 57.1922 276.588 57.3424 276.283 57.4489C275.979 57.5554 275.646 57.6087 275.286 57.6087C274.719 57.6087 274.214 57.4745 273.771 57.206C273.328 56.9354 272.979 56.5487 272.723 56.0459C272.469 55.543 272.343 54.9432 272.343 54.2465C272.343 53.5476 272.471 52.9478 272.726 52.4471C272.982 51.9443 273.331 51.5586 273.775 51.2902C274.218 51.0196 274.722 50.8843 275.286 50.8843C275.634 50.8843 275.957 50.9344 276.258 51.0345C276.56 51.1325 276.832 51.2774 277.073 51.4692C277.314 51.6588 277.513 51.891 277.67 52.1659C277.828 52.4386 277.935 52.7508 277.99 53.1023ZM280.432 57.5192V50.9738H284.535V51.8239H281.419V53.8182H284.321V54.6652H281.419V56.6691H284.574V57.5192H280.432Z" fill="#444444"/>
    </g>
    <defs>
    <linearGradient id="paint0_linear_204_3" x1="52.6871" y1="65.9158" x2="24.01" y2="14.4106" gradientUnits="userSpaceOnUse">
    <stop stopColor="white"/>
    <stop offset="0.05" stopColor="#C6DFEA"/>
    <stop offset="0.11" stopColor="#8BBED4"/>
    <stop offset="0.17" stopColor="#5BA2C2"/>
    <stop offset="0.22" stopColor="#358DB5"/>
    <stop offset="0.27" stopColor="#1A7EAB"/>
    <stop offset="0.31" stopColor="#0975A5"/>
    <stop offset="0.35" stopColor="#0472A3"/>
    <stop offset="0.6" stopColor="#2A398B"/>
    <stop offset="0.67" stopColor="#283077"/>
    <stop offset="0.75" stopColor="#272866"/>
    <stop offset="0.82" stopColor="#272660"/>
    </linearGradient>
    <linearGradient id="paint1_linear_204_3" x1="39.9535" y1="2.09121" x2="-4.06757" y2="74.943" gradientUnits="userSpaceOnUse">
    <stop stopColor="white"/>
    <stop offset="0.05" stopColor="#C6DFEA"/>
    <stop offset="0.11" stopColor="#8BBED4"/>
    <stop offset="0.17" stopColor="#5BA2C2"/>
    <stop offset="0.22" stopColor="#358DB5"/>
    <stop offset="0.27" stopColor="#1A7EAB"/>
    <stop offset="0.31" stopColor="#0975A5"/>
    <stop offset="0.35" stopColor="#0472A3"/>
    <stop offset="0.6" stopColor="#2A398B"/>
    <stop offset="0.67" stopColor="#283077"/>
    <stop offset="0.75" stopColor="#272866"/>
    <stop offset="0.82" stopColor="#272660"/>
    <stop offset="1" stopColor="#121427"/>
    </linearGradient>
    <linearGradient id="paint2_linear_204_3" x1="13.675" y1="44.0572" x2="53.8347" y2="65.5998" gradientUnits="userSpaceOnUse">
    <stop stopColor="white"/>
    <stop offset="0.05" stopColor="#C6DFEA"/>
    <stop offset="0.11" stopColor="#8BBED4"/>
    <stop offset="0.17" stopColor="#5BA2C2"/>
    <stop offset="0.22" stopColor="#358DB5"/>
    <stop offset="0.27" stopColor="#1A7EAB"/>
    <stop offset="0.31" stopColor="#0975A5"/>
    <stop offset="0.35" stopColor="#0472A3"/>
    <stop offset="0.6" stopColor="#2A398B"/>
    <stop offset="0.67" stopColor="#283077"/>
    <stop offset="0.75" stopColor="#272866"/>
    <stop offset="0.82" stopColor="#272660"/>
    <stop offset="1" stopColor="#121427"/>
    </linearGradient>
    <linearGradient id="paint3_linear_204_3" x1="-3.61135" y1="64.5225" x2="39.755" y2="35.1815" gradientUnits="userSpaceOnUse">
    <stop stopColor="white"/>
    <stop offset="0.05" stopColor="#C6DFEA"/>
    <stop offset="0.11" stopColor="#8BBED4"/>
    <stop offset="0.17" stopColor="#5BA2C2"/>
    <stop offset="0.22" stopColor="#358DB5"/>
    <stop offset="0.27" stopColor="#1A7EAB"/>
    <stop offset="0.31" stopColor="#0975A5"/>
    <stop offset="0.35" stopColor="#0472A3"/>
    <stop offset="0.6" stopColor="#2A398B"/>
    <stop offset="0.67" stopColor="#283077"/>
    <stop offset="0.75" stopColor="#272866"/>
    <stop offset="0.82" stopColor="#272660"/>
    <stop offset="1" stopColor="#121427"/>
    </linearGradient>
    <clipPath id="clip0_204_3">
    <rect width="290" height="64" fill="white"/>
    </clipPath>
    </defs>
  </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Tracks which single nav dropdown (Journeys, Stays, or Travel Services) is
  // currently open — at most one at a time, same as the original "More" menu.
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  // Same three dropdowns as desktop, reusing the same item data — just
  // presented as an inline accordion instead of a floating panel, since a
  // mobile menu is a scrolling list rather than a fixed-width header row.
  const [mobileOpenMenuKey, setMobileOpenMenuKey] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSearchButtonRef = useRef<HTMLButtonElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function registerMenuRef(key: string, node: HTMLDivElement | null) {
    menuRefs.current[key] = node;
  }

  function handleToggleMenu(key: string) {
    setOpenMenuKey((current) => (current === key ? null : key));
  }

  const primaryRoutes = navRoutes.filter((route) => !MORE_MENU_LABELS.has(route.label));
  const moreRoutes = navRoutes.filter((route) => MORE_MENU_LABELS.has(route.label));

  const hasHero = HERO_ROUTES.has(pathname);
  // Known synchronously from the route, so there's no first-paint flash while the
  // scroll-position effect below is still settling.
  const isTransparent = hasHero && !isScrolled && !open;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Pressing "/" anywhere outside a text field opens Global Search — the overlay
  // owns "/" once it's open, so this only needs to fire while it's still closed.
  useEffect(() => {
    if (searchOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTypingTarget) return;

      e.preventDefault();
      setSearchOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Closes whichever nav dropdown is open on an outside click or Escape, same
  // pattern used by GlobalSearch's own dismiss handling elsewhere in the navbar.
  useEffect(() => {
    if (!openMenuKey) return;

    const handlePointerDown = (event: MouseEvent) => {
      const container = menuRefs.current[openMenuKey];
      if (container && !container.contains(event.target as Node)) {
        setOpenMenuKey(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenuKey(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuKey]);

  useEffect(() => {
    setOpenMenuKey(null);
    setMobileOpenMenuKey(null);
  }, [pathname]);

  function isActiveRoute(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleToggleMobileMenu(key: string) {
    setMobileOpenMenuKey((current) => (current === key ? null : key));
  }

  // Mobile equivalent of NavDropdown above — same trigger-only-toggles,
  // items-only-navigate behavior, same underlying item data, rendered as an
  // inline accordion instead of a floating panel.
  function renderMobileAccordion(key: string, label: string, items: NavDropdownItem[]) {
    const isOpen = mobileOpenMenuKey === key;
    return (
      <div key={key}>
        <button
          type="button"
          onClick={() => handleToggleMobileMenu(key)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="cursor-hover flex w-full items-center justify-between rounded-xl px-3 py-2 text-md font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          {label}
          <ChevronDown size={16} className={cn('transition-transform duration-200 ease-in-out', isOpen && 'rotate-180')} />
        </button>
        {isOpen ? (
          <div role="menu" className="ml-3 flex flex-col gap-0.5">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setMobileOpenMenuKey(null);
                }}
                className="cursor-hover rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <header
      className={cn(
        'inset-x-0 top-0 z-50 transition-all duration-300 ease-out',
        isTransparent
          ? 'absolute border-b border-transparent'
          : [hasHero ? 'fixed' : 'sticky', 'bg-white/70 backdrop-blur-md shadow-sm shadow-slate-900/5']
      )}
    >
      <div className="mx-auto grid max-w-8xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-4 lg:px-8">
        <Link href="/" className="cursor-hover flex items-center gap-3">
          <LogoMark className={cn('w-auto transition-all duration-300 ease-out', isTransparent ? 'h-[60px]' : 'h-[55px]')} />
        </Link>

        <nav className="hidden items-center justify-center gap-6 xl:flex">
          {primaryRoutes.map((route) => {
            const active = isActiveRoute(route.href);

            if (route.label === 'Journeys') {
              return (
                <NavDropdown
                  key={route.label}
                  menuKey="journeys"
                  label="Our Journeys"
                  items={JOURNEYS_DROPDOWN_ITEMS}
                  active={active}
                  isTransparent={isTransparent}
                  isOpen={openMenuKey === 'journeys'}
                  isActiveItem={() => false}
                  onToggle={handleToggleMenu}
                  onSelect={() => setOpenMenuKey(null)}
                  registerRef={registerMenuRef}
                />
              );
            }

            if (route.label === 'Stays') {
              return (
                <NavDropdown
                  key={route.label}
                  menuKey="stays"
                  label="Apex Stays"
                  items={STAYS_DROPDOWN_ITEMS}
                  active={active}
                  isTransparent={isTransparent}
                  isOpen={openMenuKey === 'stays'}
                  isActiveItem={() => false}
                  onToggle={handleToggleMenu}
                  onSelect={() => setOpenMenuKey(null)}
                  registerRef={registerMenuRef}
                />
              );
            }

            return (
              <Link
                key={route.label}
                href={route.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'cursor-hover whitespace-nowrap text-md font-medium transition border-b-2 border-transparent pb-1',
                  isTransparent ? 'text-black hover:text-black/80' : 'text-slate-600',
                  active
                    ? cn(isTransparent ? 'text-black border-black' : 'text-apex-900 border-apex-700')
                    : cn(isTransparent ? 'text-black/80 hover:text-black hover:border-apex-700' : 'text-slate-600 hover:text-slate-900 hover:border-apex-700')
                )}
              >
                {route.label}
              </Link>
            );
          })}

          <NavDropdown
            menuKey="travelServices"
            label="Travel Services"
            items={moreRoutes.map((route) => ({
              label: route.label,
              href: route.href,
              description: MORE_MENU_META[route.label]?.description,
              icon: MORE_MENU_META[route.label]?.icon
            }))}
            eyebrow="Explore more"
            active={moreRoutes.some((route) => isActiveRoute(route.href))}
            isTransparent={isTransparent}
            isOpen={openMenuKey === 'travelServices'}
            isActiveItem={isActiveRoute}
            onToggle={handleToggleMenu}
            onSelect={() => setOpenMenuKey(null)}
            registerRef={registerMenuRef}
          />
        </nav>

        <div className="hidden items-center justify-end gap-2 xl:flex">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className={cn(
              'cursor-hover rounded-full p-3 transition-all duration-300 ease-in-out',
              isTransparent
                ? 'text-black/90 hover:bg-slate-400 hover:text-black'
                : 'text-slate-500 hover:bg-slate-300 hover:text-slate-900'
            )}
          >
            <Search size={18} />
          </button>
          <a
            href={`tel:${siteConfig.contactPhone}`}
            aria-label={`Call ${siteConfig.contactPhone}`}
            title={siteConfig.contactPhone}
            className={cn(
              'cursor-hover rounded-full p-3 transition-all duration-300 ease-in-out',
              isTransparent
                ? 'text-black/90 hover:bg-slate-400 hover:text-black'
                : 'text-slate-500 hover:bg-slate-300 hover:text-slate-900'
            )}
          >
            <Phone size={18} />
          </a>
          <ButtonLink href={siteConfig.bookNowHref} size="md" className="ml-1 px-5">
            Plan My Journey
            <ArrowRight size={18} />
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2 justify-self-end xl:hidden">
          <button
            ref={mobileSearchButtonRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="cursor-hover rounded-full p-2 text-slate-500 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
          >
            <Search size={20} />
          </button>
          <a
          href={`tel:${siteConfig.contactPhone}`}
          onClick={() => setOpen(false)}
          className="cursor-hover rounded-full p-2 text-slate-500 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
        >
          <Phone size={20} />
        </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="cursor-hover inline-flex items-center justify-center rounded-full border border-slate-700 p-2 text-slate-700"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <nav className={cn('flex flex-col gap-1 px-6 pb-4 overflow-y-auto xl:hidden', open ? 'block' : 'hidden')}>
        {primaryRoutes.map((route) => {
          const active = isActiveRoute(route.href);

          if (route.label === 'Journeys') {
            return renderMobileAccordion('journeys', 'Our Journeys', JOURNEYS_DROPDOWN_ITEMS);
          }

          if (route.label === 'Stays') {
            return renderMobileAccordion('stays', 'Apex Stays', STAYS_DROPDOWN_ITEMS);
          }

          return (
            <Link
              key={route.label}
              href={route.href}
              onClick={() => setOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'cursor-hover rounded-xl px-3 py-2 text-md transition',
                active ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {route.label}
            </Link>
          );
        })}

        {/* <div className="my-2 h-px bg-slate-200" /> */}

        {renderMobileAccordion(
          'travelServices',
          'Travel Services',
          moreRoutes.map((route) => ({ label: route.label, href: route.href }))
        )}

        {/* <div className="my-2 h-px bg-slate-200" /> */}
          <ButtonLink href={siteConfig.bookNowHref} size="md" className="mt-3 justify-center">
            Plan My Journey
            <ArrowRight size={16} />
          </ButtonLink>
        </nav>

      <GlobalSearch
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          // Whichever trigger is actually on-screen for the current breakpoint is
          // the one with a layout box — the other is `display: none` and can't
          // take focus, so this needs no viewport check of its own.
          (searchButtonRef.current?.offsetParent ? searchButtonRef : mobileSearchButtonRef).current?.focus();
        }}
      />
    </header>
  );
}
