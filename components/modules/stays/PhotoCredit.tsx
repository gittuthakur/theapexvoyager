import { ExternalLink } from 'lucide-react';
import { GoogleMapsAttribution } from '@/components/ui/GoogleMapsAttribution';
import type { CreditedGalleryPhoto } from '@/lib/stayPhotoGallery';
import { cn } from '@/lib/utils';

/**
 * The credit for ONE Google photo, built only from data Google sent for that photo (D1-3b): the genuine author(s)
 * with their profile links, a link to the photo on Google Maps, a link to report a problem with it, and the official
 * Google Maps logo. Nothing is invented: a photo Google sent with no author shows no "Photo by" line.
 *
 * `tone` is the surface the credit sits on: `light` (the page) or `dark` (the full-screen lightbox). It selects the
 * matching official logo variant and a text colour with AA contrast. Every external link opens in a new tab with
 * `noopener noreferrer`, is at least 44px tall for touch, and announces that it opens in a new tab.
 */
export interface PhotoCreditProps {
  photo: Pick<CreditedGalleryPhoto, 'authors' | 'googleMapsUri' | 'flagContentUri'>;
  tone?: 'light' | 'dark';
  className?: string;
}

const LINK_BASE =
  'inline-flex min-h-[44px] items-center gap-1 rounded-md px-1 font-semibold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export function PhotoCredit({ photo, tone = 'light', className }: PhotoCreditProps) {
  const dark = tone === 'dark';
  const linkTone = dark ? 'text-white focus-visible:outline-white' : 'text-apex-700 focus-visible:outline-apex-600';
  const { authors } = photo;

  return (
    <div className={cn('flex min-h-0 min-w-0 max-w-full flex-col text-sm leading-6', dark ? 'text-slate-200' : 'text-slate-700', className)} data-photo-credit="">
      {/* The credit text and links: the only part that may scroll (in the lightbox, when a credit is very long). The small
          negative margin and equal padding keep keyboard focus rings from being clipped by the scroll area. */}
      <div className="-m-1 min-h-0 min-w-0 space-y-1 overflow-y-auto p-1" data-photo-credit-text="">
        {authors.length > 0 ? (
          <p className="min-w-0 max-w-full break-words" data-photo-authors="">
            Photo by{' '}
            {authors.map((author, index) => (
              <span key={`${author.displayName}-${index}`} className="inline-flex max-w-full items-center align-middle">
                {author.photoUri ? (
                  // The author's own avatar, from Google, at a fixed size so it can never shift the layout.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.photoUri} alt="" width={20} height={20} loading="lazy" referrerPolicy="no-referrer" className="mr-1.5 h-5 w-5 shrink-0 rounded-full bg-slate-300" />
                ) : null}
                {author.uri ? (
                  <a href={author.uri} target="_blank" rel="noopener noreferrer" className={cn(LINK_BASE, 'min-w-0 break-words', linkTone)}>
                    {author.displayName}
                    <span className="sr-only"> (Google Maps profile, opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="min-w-0 break-words font-semibold">{author.displayName}</span>
                )}
                {/* The separator lives INSIDE this author's box, so it can never wrap onto a line of its own. The negative
                    margin cancels the link's right padding so the comma sits tight against the name. */}
                {index < authors.length - 2 ? <span className="-ml-1 whitespace-pre">{', '}</span> : null}
                {index === authors.length - 2 ? <span className="-ml-1 whitespace-pre">{' and '}</span> : null}
              </span>
            ))}
          </p>
        ) : null}

        <p className="flex flex-wrap items-center gap-x-4">
          <a href={photo.googleMapsUri} target="_blank" rel="noopener noreferrer" className={cn(LINK_BASE, linkTone)}>
            View photo on Google Maps
            <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {photo.flagContentUri ? (
            <a href={photo.flagContentUri} target="_blank" rel="noopener noreferrer" className={cn(LINK_BASE, linkTone)}>
              Report a problem with this photo
              <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </p>
      </div>

      {/* PINNED: the Google Maps logo is never inside a scrolling area, so it is always visible, as Google requires. */}
      <GoogleMapsAttribution className="shrink-0" background={dark ? 'plain-dark' : 'plain'} />
    </div>
  );
}
