import { cn } from '@/lib/utils';

/**
 * THE one Google Maps attribution every Google-sourced Stay surface renders (D1-1 / D1-1B).
 *
 * Google's attribution rules (https://developers.google.com/maps/documentation/places/web-service/policies, reviewed
 * 2026-10-16): Places data shown without a Google map must carry the Google Maps LOGO whenever possible; the text
 * "Google Maps" is acceptable only "in cases where space is limited". The logo must never be modified or recreated,
 * keeps its aspect ratio, is 16-19 high with 10 clear space left/right/top and 5 below, uses the outlined variant on a
 * busy background (a photo) and a plain one on a plain background, and carries the accessible name "Google Maps".
 *
 * OFFICIAL ASSETS: the files under public/brand/google-maps/ are Google's own Google Maps logo files, supplied by the
 * owner and committed UNMODIFIED. They are rendered as <img> at their own native size (the 1x size Google ships) - never
 * recoloured, cropped, stretched or redrawn, and never rebuilt from text, CSS or hand-written SVG. Components/ui/
 * GoogleMapsAttribution.test.tsx pins each file's SHA-256 so an accidental edit or replacement fails the build.
 * The text fallback below exists only for a placement whose variant is not registered; it is the documented
 * "space is limited" alternative, not a substitute for the logo.
 */

/** One official file, rendered at exactly its own pixel size (no scaling, so the aspect ratio can never distort). */
export interface GoogleMapsLogoAsset {
  src: string;
  width: number;
  height: number;
}

export interface GoogleMapsLogoAssets {
  /** Dark logo (#1F1F1F) for a plain white / light solid background. */
  plain?: GoogleMapsLogoAsset;
  /** White logo for a plain dark solid background. */
  plainDark?: GoogleMapsLogoAsset;
  /** Outlined logo for a busy background that is light overall: dark (#474747) lettering with a light outline. */
  busyLight?: GoogleMapsLogoAsset;
  /** Outlined logo for a busy background that is dark overall: white lettering with a dark (#1E1E1E) outline. */
  busyDark?: GoogleMapsLogoAsset;
}

const BASE = '/brand/google-maps';

/** Google's official, unmodified files as supplied by the owner. Sizes are the files' own width/height attributes
 *  (98x18 plain, 105x22 outlined). `GoogleMaps_Logo_Gray` (#5E5E5E) is also supplied and kept, but not registered:
 *  the #1F1F1F variant gives the strongest contrast on this site's white and slate-50 containers. */
export const GOOGLE_MAPS_LOGO_ASSETS: GoogleMapsLogoAssets = {
  plain: { src: `${BASE}/GoogleMaps_Logo_DarkGray/GoogleMaps_Logo_DarkGray.svg`, width: 98, height: 18 },
  plainDark: { src: `${BASE}/GoogleMaps_Logo_White/GoogleMaps_Logo_White.svg`, width: 98, height: 18 },
  busyLight: { src: `${BASE}/GoogleMaps_Logo_WithLightOutline/GoogleMaps_Logo_WithLightOutline.svg`, width: 105, height: 22 },
  busyDark: { src: `${BASE}/GoogleMaps_Logo_WithDarkOutline/GoogleMaps_Logo_WithDarkOutline.svg`, width: 105, height: 22 }
};

export type GoogleMapsAttributionBackground = 'plain' | 'plain-dark' | 'busy-light' | 'busy-dark';

const ASSET_KEY: Record<GoogleMapsAttributionBackground, keyof GoogleMapsLogoAssets> = {
  plain: 'plain',
  'plain-dark': 'plainDark',
  'busy-light': 'busyLight',
  'busy-dark': 'busyDark'
};

export interface GoogleMapsAttributionProps {
  /** `card` is the compact, space-limited placement; `detail` is the roomier property-page placement. */
  variant?: 'card' | 'detail';
  /** What the mark sits on, which selects the official variant: plain light (default), plain dark, or a busy
   *  (photo) background that is overall light or dark. */
  background?: GoogleMapsAttributionBackground;
  /** Optional lead-in sentence rendered before the mark, e.g. "Property information sourced from". */
  prefix?: string;
  /** Test seam / future override; defaults to the official asset registry above. */
  assets?: GoogleMapsLogoAssets;
  className?: string;
}

export function GoogleMapsAttribution({ variant = 'card', background = 'plain', prefix, assets = GOOGLE_MAPS_LOGO_ASSETS, className }: GoogleMapsAttributionProps) {
  const logo = assets[ASSET_KEY[background]];

  return (
    <p
      data-google-maps-attribution={logo ? 'logo' : 'text'}
      className={cn(
        // Lead-in text: 12px (text-xs) on cards, 14px (text-sm) on the detail page - inside Google's 12-16 range.
        'flex flex-wrap items-center gap-x-1 leading-snug text-[#5E5E5E]',
        variant === 'detail' ? 'text-sm' : 'text-xs',
        className
      )}
    >
      {prefix ? <span>{prefix}</span> : null}
      {logo ? (
        // The official file, unmodified, at its own width and height (explicit attributes: no layout shift, no
        // distortion). The padding is Google's clear space: 10 left/right/top, 5 below.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.src} alt="Google Maps" width={logo.width} height={logo.height} decoding="async" className="box-content inline-block max-w-none shrink-0 px-2.5 pb-[5px] pt-2.5" />
      ) : (
        // Documented text fallback for an unregistered variant: must read exactly "Google Maps" - never wrapped,
        // localized or re-capitalized.
        <span translate="no" className="whitespace-nowrap font-medium normal-case text-[#1F1F1F]">
          Google Maps
        </span>
      )}
    </p>
  );
}
