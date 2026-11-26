import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder';
import { PhotoFallback } from '@/components/ui/PhotoFallback';
import { SafeImage } from '@/components/ui/SafeImage';

describe('PhotoFallback', () => {
  it('is a branded panel with the mark, the brand name and the message', () => {
    const html = renderToStaticMarkup(<PhotoFallback label="Photo of Test Hotel unavailable" message="Photo unavailable" />);
    expect(html).toContain('data-photo-fallback');
    expect(html).toContain('The Apex Voyager');
    expect(html).toContain('Photo unavailable');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Photo of Test Hotel unavailable"');
  });

  it('is never an image: no <img>, no src, no srcset, no picture/svg-as-image that a crawler could index', () => {
    const html = renderToStaticMarkup(<PhotoFallback fill label="x" message="y" />);
    expect(html).not.toMatch(/<img|<picture|srcset|\ssrc=|background-image|url\(/i);
  });

  it('is decorative (hidden from assistive technology) when it has no label', () => {
    const html = renderToStaticMarkup(<PhotoFallback />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it('shows only the mark in a compact slot', () => {
    const html = renderToStaticMarkup(<PhotoFallback compact message="Photo unavailable" />);
    expect(html).not.toContain('The Apex Voyager');
    expect(html).not.toContain('Photo unavailable');
  });

  it('fills its container when asked and otherwise uses the given class', () => {
    expect(renderToStaticMarkup(<PhotoFallback fill />)).toContain('absolute inset-0');
    expect(renderToStaticMarkup(<PhotoFallback className="h-72 w-full" />)).toContain('h-72 w-full');
  });
});

describe('MediaPlaceholder shares the branded look and keeps its contract', () => {
  it('still has an accessible name, defaulting to "Photo not available", and shows its label', () => {
    expect(renderToStaticMarkup(<MediaPlaceholder />)).toContain('aria-label="Photo not available"');
    const labelled = renderToStaticMarkup(<MediaPlaceholder label="Manali" />);
    expect(labelled).toContain('aria-label="Manali"');
    expect(labelled).toContain('Manali');
    expect(labelled).toContain('data-photo-fallback');
  });
});

describe('SafeImage success path is unchanged: the real photo is the primary output', () => {
  it('renders the original Google photo URL with its alt text and no fallback', () => {
    const html = renderToStaticMarkup(
      <SafeImage src="/api/places/photo?name=places%2FChIJx%2Fphotos%2Fabc&w=640" alt="Test Hotel — Hotel in Manali" width={640} height={384} />
    );
    expect(html).toContain('<img');
    expect(html).toContain('alt="Test Hotel — Hotel in Manali"');
    expect(html).toContain('src="/api/places/photo?name=places%2FChIJx%2Fphotos%2Fabc&amp;w=640"');
    expect(html).toContain('width="640"');
    expect(html).toContain('height="384"');
    expect(html).not.toContain('data-photo-fallback');
  });
});

describe('the fallback can never become a photograph in SEO output', () => {
  const read = (file: string) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

  const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the fallback components contain no image element, URL or next/image', () => {
    for (const file of ['components/ui/PhotoFallback.tsx', 'components/ui/MediaPlaceholder.tsx']) {
      expect(stripComments(read(file)), file).not.toMatch(/<img|next\/image|\.(png|jpe?g|webp|svg)/i);
    }
  });

  it('the structured-data and metadata sources do not reference the fallback components', () => {
    expect(read('components/seo/JsonLd.tsx')).not.toMatch(/PhotoFallback|MediaPlaceholder/);
    expect(read('app/layout.tsx')).not.toMatch(/PhotoFallback|MediaPlaceholder/);
    // generateMetadata of the stays page, up to the page component itself.
    const stays = read('app/stays/[...segments]/page.tsx');
    const metadata = stays.slice(stays.indexOf('export async function generateMetadata'), stays.indexOf('export default async function'));
    expect(metadata.length).toBeGreaterThan(500);
    expect(metadata).not.toMatch(/PhotoFallback|MediaPlaceholder/);
  });
});
