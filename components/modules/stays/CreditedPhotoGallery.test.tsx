import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CreditedLightbox, CreditedPhotoGallery } from './CreditedPhotoGallery';
import { PhotoCredit } from './PhotoCredit';
import type { CreditedGalleryPhoto } from '@/lib/stayPhotoGallery';

const ROOT = process.cwd();
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
const textOf = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const photoUrl = (token: string, width = 1200) => `/api/places/photo?name=${encodeURIComponent(`places/ChIJabc/photos/${token}`)}&w=${width}`;

const ASHA = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/111', photoUri: 'https://lh3.googleusercontent.com/asha' };
const photo = (token: string, extra: Partial<CreditedGalleryPhoto> = {}): CreditedGalleryPhoto => ({
  src: photoUrl(token),
  authors: [ASHA],
  googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/${token}`,
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`,
  ...extra
});
const photos = (count: number) => Array.from({ length: count }, (_, index) => photo(`p${index}`));
const anchors = (html: string) => [...html.matchAll(/<a\s[^>]*>/g)].map((match) => match[0]);

describe('PhotoCredit: genuine credits', () => {
  it('shows the photographer by name, linked to their profile, with an avatar', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a')} />);
    expect(textOf(html)).toContain('Photo by Asha Verma');
    expect(html).toContain('href="https://www.google.com/maps/contrib/111"');
    expect(html).toContain('src="https://lh3.googleusercontent.com/asha"');
    expect(html).toMatch(/<img[^>]*alt=""[^>]*width="20"[^>]*height="20"/);
  });

  it('renders several photographers as "A, B and C" (and "A and B"), each with their own link', () => {
    const three = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: 'One', uri: 'https://www.google.com/maps/contrib/1' }, { displayName: 'Two' }, { displayName: 'Three', uri: 'https://www.google.com/maps/contrib/3' }] })} />);
    expect(textOf(three)).toContain('Photo by One (Google Maps profile, opens in a new tab) , Two and Three');
    expect(three).toContain('contrib/1');
    expect(three).toContain('contrib/3');
    const two = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: 'One' }, { displayName: 'Two' }] })} />);
    expect(textOf(two)).toContain('Photo by One and Two');
  });

  it('an author without a profile link is plain text, not an empty or broken link', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: 'Only Name' }] })} />);
    expect(textOf(html)).toContain('Photo by Only Name');
    expect(anchors(html).some((a) => a.includes('href=""') || a.includes('href="undefined"'))).toBe(false);
    // No avatar was provided, so none is shown (the only image is the official Google Maps logo).
    expect(html).not.toContain('googleusercontent');
    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain('alt="Google Maps"');
  });

  it('a photo Google sent with no author shows no "Photo by" line at all (nothing is invented)', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [] })} />);
    expect(textOf(html)).not.toContain('Photo by');
    expect(html).not.toContain('data-photo-authors');
    expect(textOf(html)).toContain('View photo on Google Maps');
  });

  it('shows long author names in full and lets them wrap instead of overflowing', () => {
    const long = 'Maria Fernanda de los Angeles Garcia-Lopez Rodriguez-Hernandez de la Cruz y Montenegro';
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: long, uri: 'https://www.google.com/maps/contrib/9' }] })} />);
    expect(textOf(html)).toContain(long);
    expect(html).toContain('break-words');
    expect(html).toContain('min-w-0');
    expect(html).toContain('max-w-full');
  });

  it('escapes hostile author names: markup in a name is shown as text, never executed', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: '<script>alert(1)</script><img src=x onerror=alert(1)>' }] })} />);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('PhotoCredit: links', () => {
  it('links to the photo on Google Maps and to report a problem, when provided', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a')} />);
    expect(html).toContain('href="https://www.google.com/maps/place/@1,1,3a/photos/a"');
    expect(textOf(html)).toContain('View photo on Google Maps');
    expect(html).toContain('href="https://www.google.com/local/imagery/report/?image_key=a"');
    expect(textOf(html)).toContain('Report a problem with this photo');
  });

  it('omits the report link when Google did not send one', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { flagContentUri: undefined })} />);
    expect(textOf(html)).not.toContain('Report a problem');
    expect(textOf(html)).toContain('View photo on Google Maps');
  });

  it('EVERY external link opens in a new tab with noopener noreferrer, is https, and is at least 44px tall', () => {
    for (const tone of ['light', 'dark'] as const) {
      const html = renderToStaticMarkup(<PhotoCredit tone={tone} photo={photo('a', { authors: [ASHA, { displayName: 'Two', uri: 'https://www.google.com/maps/contrib/2' }] })} />);
      const links = anchors(html);
      expect(links.length).toBe(4);
      for (const link of links) {
        expect(link, link).toContain('target="_blank"');
        expect(link, link).toMatch(/rel="noopener noreferrer"/);
        expect(link, link).toMatch(/href="https:\/\//);
        expect(link, link).toContain('min-h-[44px]');
      }
    }
  });

  it('each external link tells assistive technology it opens a new tab', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a')} />);
    expect(html.match(/opens in a new tab/g)?.length).toBe(3);
  });
});

describe('PhotoCredit: official Google Maps logo', () => {
  it('shows the official plain logo on the light page and the official white logo on the dark lightbox', () => {
    const light = renderToStaticMarkup(<PhotoCredit tone="light" photo={photo('a')} />);
    const dark = renderToStaticMarkup(<PhotoCredit tone="dark" photo={photo('a')} />);
    expect(light).toContain('/brand/google-maps/GoogleMaps_Logo_DarkGray/GoogleMaps_Logo_DarkGray.svg');
    expect(dark).toContain('/brand/google-maps/GoogleMaps_Logo_White/GoogleMaps_Logo_White.svg');
    for (const html of [light, dark]) {
      expect(html).toContain('alt="Google Maps"');
      expect(html.match(/data-google-maps-attribution=/g)).toHaveLength(1);
      expect(html).toContain('data-google-maps-attribution="logo"');
      expect(html).toMatch(/width="98"[^>]*height="18"|height="18"[^>]*width="98"/);
    }
  });

  it('PINS the logo outside the scrolling credit text, so a very long credit can never push it out of sight', () => {
    for (const tone of ['light', 'dark'] as const) {
      const html = renderToStaticMarkup(<PhotoCredit tone={tone} photo={photo('a', { authors: [ASHA, { displayName: 'Two' }, { displayName: 'Three' }] })} />);
      const textStart = html.indexOf('data-photo-credit-text');
      const logoStart = html.indexOf('data-google-maps-attribution');
      expect(textStart).toBeGreaterThan(-1);
      expect(logoStart).toBeGreaterThan(textStart);
      const scrollArea = html.slice(textStart, logoStart);
      expect(scrollArea).not.toContain('data-google-maps-attribution');
      expect(scrollArea).not.toContain('GoogleMaps_Logo');
      expect(scrollArea.trimEnd().endsWith('</div><p')).toBe(true);
      expect(html.slice(html.lastIndexOf('<p', logoStart), logoStart + 120)).toContain('shrink-0');
    }
  });

  it('keeps each separator (comma or "and") inside its own author box, so it can never wrap onto a line of its own', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: 'One' }, { displayName: 'Two' }, { displayName: 'Three' }] })} />);
    expect(html.match(/whitespace-pre">, </g)).toHaveLength(1);
    expect(html.match(/whitespace-pre"> and </g)).toHaveLength(1);
    const single = renderToStaticMarkup(<PhotoCredit photo={photo('a', { authors: [{ displayName: 'Solo' }] })} />);
    expect(single).not.toContain('whitespace-pre');
  });

  it('keeps Google\'s clear space around the logo', () => {
    const html = renderToStaticMarkup(<PhotoCredit photo={photo('a')} />);
    for (const token of ['px-2.5', 'pt-2.5', 'pb-[5px]']) expect(html).toContain(token);
  });
});

describe('CreditedPhotoGallery: hero, thumbnails and layout', () => {
  const html = renderToStaticMarkup(<CreditedPhotoGallery photos={photos(8)} propertyName="Riverside Hotel" />);

  it('shows the first photo as the hero with its credit in a caption directly under it', () => {
    expect(html).toContain('<figure');
    expect(html).toContain('<figcaption');
    expect(html.indexOf('<figure')).toBeLessThan(html.indexOf('Photo by'));
    expect(html.indexOf('Photo by')).toBeLessThan(html.indexOf('</figcaption>'));
    expect(html).toContain('Riverside Hotel, photo 1 of 8');
    expect(textOf(html)).toContain('Photo by Asha Verma');
  });

  it('shows at most six thumbnails, none of them carrying a credit (the credit is on the hero and in the lightbox)', () => {
    expect(html.match(/aria-label="Show photo \d+ of 8"/g)).toHaveLength(6);
    const thumbs = html.slice(html.indexOf('aria-label="Choose a photo"'));
    expect(thumbs).not.toContain('Photo by');
    expect(thumbs).not.toContain('Google Maps');
  });

  it('marks only the active thumbnail as current and gives each an accessible name', () => {
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html.indexOf('aria-current="true"')).toBeLessThan(html.indexOf('aria-label="Show photo 2 of 8"'));
  });

  it('thumbnails use the small canonical width (192) while the hero keeps the large one', () => {
    expect(html).toContain('&amp;w=192');
    expect(html).toContain('&amp;w=1200');
  });

  it('offers a "View all N photos" button and an accessible way to open the full-screen gallery', () => {
    expect(textOf(html)).toContain('View all 8 photos');
    expect(html).toContain('Open the full-screen gallery for Riverside Hotel, photo 1 of 8');
  });

  it('a single photo shows no thumbnail strip and no "View all" button, but still has its caption', () => {
    const single = renderToStaticMarkup(<CreditedPhotoGallery photos={photos(1)} propertyName="Riverside Hotel" />);
    expect(single).not.toContain('Choose a photo');
    expect(single).not.toContain('View all');
    expect(textOf(single)).toContain('Photo by Asha Verma');
  });

  it('touch targets are large enough: thumbnails are at least 64px tall and the "View all" button at least 44px', () => {
    expect(html).toContain('h-16');
    expect(html).toContain('min-h-[44px]');
  });

  it('has no mobile overflow hazards: constrained widths, no fixed pixel widths, no horizontal scrolling or full-bleed widths', () => {
    expect(html).toContain('min-w-0 max-w-full');
    expect(html).not.toMatch(/\bw-screen\b|\bmin-w-screen\b|overflow-x-(auto|scroll)|\bw-\[\d{3,}px\]|\bmin-w-\[\d{3,}px\]|whitespace-nowrap/);
  });

  it('uses the existing protected photo-proxy URLs only, and no photo-name storage or API key appears in the markup', () => {
    for (const src of [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')).filter((s) => s.includes('/api/places/photo'))) expect(src).toMatch(/^\/api\/places\/photo\?name=places%2F/);
    expect(html).not.toMatch(/X-Goog|api[_-]?key|AIza|maps\.googleapis\.com/i);
  });
});

describe('CreditedLightbox', () => {
  const noop = () => undefined;
  const html = renderToStaticMarkup(<CreditedLightbox photos={photos(8)} propertyName="Riverside Hotel" initialIndex={3} onClose={noop} />);

  it('is an accessible modal dialog with a label', () => {
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Riverside Hotel photo gallery"');
  });

  it('has a labelled close button and previous/next buttons, each at least 44px square', () => {
    for (const label of ['Close photo gallery', 'Previous photo', 'Next photo']) {
      const button = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0] ?? '';
      expect(button, label).toContain('h-11');
      expect(button, label).toContain('w-11');
    }
  });

  it('announces the slide to screen readers: position and photographer, in a polite live region', () => {
    expect(html).toMatch(/<p[^>]*role="status"[^>]*aria-live="polite"[^>]*>Photo 4 of 8, by Asha Verma<\/p>/);
  });

  it('shows the credit for the CURRENT slide below the image, with the dark-surface official logo and photo-specific links', () => {
    expect(textOf(html)).toContain('Photo by Asha Verma');
    expect(html).toContain('photos/p3"');
    expect(html).toContain('GoogleMaps_Logo_White.svg');
    expect(html).toContain('image_key=p3');
  });

  it('mounts only the current photo and its two neighbours (only nearby photos are loaded)', () => {
    expect(html.match(/alt="Riverside Hotel, photo \d+ of 8"/g)?.length).toBe(3);
    for (const n of [3, 4, 5]) expect(html).toContain(`photo ${n} of 8`);
    expect(html).not.toContain('photo 1 of 8');
    expect(html).not.toContain('photo 8 of 8');
  });

  it('hides the non-current mounted photos from assistive technology', () => {
    expect(html.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('a single photo has no previous/next buttons', () => {
    const single = renderToStaticMarkup(<CreditedLightbox photos={photos(1)} propertyName="Riverside Hotel" initialIndex={0} onClose={noop} />);
    expect(single).not.toContain('Previous photo');
    expect(single).not.toContain('Next photo');
    expect(single).toContain('Close photo gallery');
  });

  it('respects reduced motion: no unconditional transitions or animations', () => {
    expect(html).toContain('motion-safe:transition');
    expect(html).not.toMatch(/(^|[\s"])transition(-[a-z]+)?(?=[\s"])/);
    expect(html).not.toMatch(/(^|[\s"])duration-\d+/);
    expect(html).not.toMatch(/animate-/);
  });

  it('has no mobile overflow hazards: fixed full-screen overflow-hidden dialog, a scrollable bounded caption, and wrapping names', () => {
    expect(html).toContain('fixed inset-0');
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('max-h-[40vh]');
    expect(html).toContain('overflow-y-auto');
    expect(html).not.toMatch(/overflow-x-(auto|scroll)|\bw-screen\b|whitespace-nowrap|\bw-\[\d{3,}px\]/);
  });
});

describe('interaction wiring (the behaviour itself is tested in lightboxLogic.test.ts)', () => {
  const source = read('components/modules/stays/CreditedPhotoGallery.tsx');

  it('wires Escape, arrows and the Tab focus trap through handleLightboxKeyDown over the dialog\'s own focusable elements', () => {
    expect(source).toContain('handleLightboxKeyDown(event');
    expect(source).toContain('FOCUSABLE_SELECTOR');
    expect(source).toContain("window.addEventListener('keydown', onKeyDown)");
    expect(source).toContain("window.removeEventListener('keydown', onKeyDown)");
  });

  it('moves focus into the dialog on open, restores it on close and releases the scroll lock', () => {
    expect(source).toContain('createFocusRestorer(() => document.activeElement)');
    expect(source).toContain('closeButtonRef.current?.focus()');
    expect(source).toMatch(/document\.body\.style\.overflow = 'hidden'/);
    expect(source).toMatch(/document\.body\.style\.overflow = originalOverflow;\s*restoreFocus\(\);/);
  });

  it('wires touch swipe through swipeDirection with the shared threshold', () => {
    expect(source).toContain('onTouchStart={onTouchStart}');
    expect(source).toContain('onTouchEnd={onTouchEnd}');
    expect(source).toContain('swipeDirection(start');
    expect(source).toContain('SWIPE_THRESHOLD_PX');
  });

  it('keeps a click on the backdrop closing the dialog without closing it for clicks inside', () => {
    expect(source).toContain('event.target === event.currentTarget');
  });

  it('makes no network request of its own and stores nothing', () => {
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|document\.cookie|maps\.googleapis/);
  });
});
