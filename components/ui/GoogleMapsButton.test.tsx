import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GoogleMapsButton } from './GoogleMapsButton';

describe('GoogleMapsButton', () => {
  it('renders nothing at all when url is undefined — never a broken/placeholder link', () => {
    const html = renderToStaticMarkup(<GoogleMapsButton url={undefined} />);
    expect(html).toBe('');
  });

  it('renders the exact label "View on Google Maps"', () => {
    const html = renderToStaticMarkup(<GoogleMapsButton url="https://maps.google.com/?cid=123" />);
    expect(html).toContain('View on Google Maps');
  });

  it('links to the exact url passed in, unmodified', () => {
    const html = renderToStaticMarkup(<GoogleMapsButton url="https://maps.google.com/?cid=123" />);
    expect(html).toContain('href="https://maps.google.com/?cid=123"');
  });

  it('opens in a new tab with safe rel attributes (target=_blank, rel=noopener noreferrer)', () => {
    const html = renderToStaticMarkup(<GoogleMapsButton url="https://maps.google.com/?cid=123" />);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('never renders any WhatsApp, booking, pricing or availability wording', () => {
    const html = renderToStaticMarkup(<GoogleMapsButton url="https://maps.google.com/?cid=123" />);
    expect(html.toLowerCase()).not.toContain('whatsapp');
    expect(html.toLowerCase()).not.toContain('book');
    expect(html.toLowerCase()).not.toContain('price');
    expect(html.toLowerCase()).not.toContain('availability');
    expect(html.toLowerCase()).not.toContain('enquir');
  });
});
