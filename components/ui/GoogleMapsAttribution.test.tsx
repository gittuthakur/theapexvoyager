import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GOOGLE_MAPS_LOGO_ASSETS, GoogleMapsAttribution } from './GoogleMapsAttribution';

const ROOT = process.cwd();
const publicFile = (publicPath: string) => join(ROOT, 'public', publicPath);

// SHA-256 of each official SVG exactly as supplied by the owner (Google's own files). If one of these files is edited,
// recoloured, re-exported or replaced, this test fails: the logo must stay unmodified. Updating a hash is a deliberate
// act that means a new official file was supplied.
const OFFICIAL_SVG_SHA256: Record<string, string> = {
  GoogleMaps_Logo_DarkGray: '62c52df68d8f450c860d5d65068fc96d63c2dfaec849b91ac64b3256a898936e',
  GoogleMaps_Logo_Gray: '99a08b570afce8ce830d26aeb93ba287f6ad67387e6219fe381234ad7e4016b5',
  GoogleMaps_Logo_White: '727012e157bc115222e717325d3fb70a3cd1e6ba2407cd320e489285543503ec',
  GoogleMaps_Logo_WithDarkOutline: '1974830500ca480c8c81daf95b049441927f18061fff040be607467c6b42bc39',
  GoogleMaps_Logo_WithLightOutline: '16751302519e08d2cdfe3b693c78e1a288a7dc85cc17218bdc971bbdcf427cbe'
};

describe('official Google Maps logo files', () => {
  it('are present, byte-for-byte as supplied (SHA-256 pinned), in their own folders with Google\'s original names', () => {
    for (const [name, expected] of Object.entries(OFFICIAL_SVG_SHA256)) {
      const file = publicFile(`brand/google-maps/${name}/${name}.svg`);
      expect(existsSync(file), name).toBe(true);
      expect(createHash('sha256').update(readFileSync(file)).digest('hex'), name).toBe(expected);
      for (const scale of ['1x', '2x', '4x']) expect(existsSync(publicFile(`brand/google-maps/${name}/${name}_${scale}.png`)), `${name} ${scale}`).toBe(true);
    }
  });

  it('are inert vector files: no scripts, event handlers, external references or embedded images', () => {
    for (const name of Object.keys(OFFICIAL_SVG_SHA256)) {
      const svg = readFileSync(publicFile(`brand/google-maps/${name}/${name}.svg`), 'utf8');
      expect(svg, name).not.toMatch(/<script|\son[a-z]+=|href=|<image|foreignObject|<style/i);
    }
  });

  it('every registered asset exists, and its registered size is the SVG file\'s own width and height (no scaling, no distortion)', () => {
    for (const [key, asset] of Object.entries(GOOGLE_MAPS_LOGO_ASSETS)) {
      expect(asset, key).toBeDefined();
      const svg = readFileSync(publicFile(asset!.src), 'utf8');
      expect(svg.match(/<svg[^>]*\swidth="(\d+)px"/)?.[1], `${key} width`).toBe(String(asset!.width));
      expect(svg.match(/<svg[^>]*\sheight="(\d+)px"/)?.[1], `${key} height`).toBe(String(asset!.height));
    }
  });

  it('registers exactly the four official variants the site uses (the #5E5E5E gray one is kept but unused)', () => {
    expect(Object.keys(GOOGLE_MAPS_LOGO_ASSETS).sort()).toEqual(['busyDark', 'busyLight', 'plain', 'plainDark']);
    expect(GOOGLE_MAPS_LOGO_ASSETS.plain?.src).toContain('GoogleMaps_Logo_DarkGray');
    expect(GOOGLE_MAPS_LOGO_ASSETS.plainDark?.src).toContain('GoogleMaps_Logo_White');
    expect(GOOGLE_MAPS_LOGO_ASSETS.busyLight?.src).toContain('GoogleMaps_Logo_WithLightOutline');
    expect(GOOGLE_MAPS_LOGO_ASSETS.busyDark?.src).toContain('GoogleMaps_Logo_WithDarkOutline');
  });
});

describe('GoogleMapsAttribution — official logo selection', () => {
  const src = (html: string) => html.match(/src="([^"]+)"/)?.[1];

  it('uses the plain dark logo on a plain light background (the default)', () => {
    expect(src(renderToStaticMarkup(<GoogleMapsAttribution />))).toBe('/brand/google-maps/GoogleMaps_Logo_DarkGray/GoogleMaps_Logo_DarkGray.svg');
  });

  it('uses the white logo on a plain dark background', () => {
    expect(src(renderToStaticMarkup(<GoogleMapsAttribution background="plain-dark" />))).toContain('GoogleMaps_Logo_White.svg');
  });

  it('uses the outlined logos on busy (photo) backgrounds: light-outline on light photos, dark-outline on dark photos', () => {
    expect(src(renderToStaticMarkup(<GoogleMapsAttribution background="busy-light" />))).toContain('GoogleMaps_Logo_WithLightOutline.svg');
    expect(src(renderToStaticMarkup(<GoogleMapsAttribution background="busy-dark" />))).toContain('GoogleMaps_Logo_WithDarkOutline.svg');
  });

  it('renders every variant as an <img> with the accessible name "Google Maps", at the file\'s own size via fixed width and height attributes', () => {
    const cases: Array<['plain' | 'plain-dark' | 'busy-light' | 'busy-dark', string, string]> = [
      ['plain', '98', '18'],
      ['plain-dark', '98', '18'],
      ['busy-light', '105', '22'],
      ['busy-dark', '105', '22']
    ];
    for (const [background, width, height] of cases) {
      const html = renderToStaticMarkup(<GoogleMapsAttribution background={background} />);
      expect(html, background).toContain('alt="Google Maps"');
      expect(html, background).toContain(`width="${width}"`);
      expect(html, background).toContain(`height="${height}"`);
      expect(html, background).toContain('data-google-maps-attribution="logo"');
      expect(html, background).not.toContain('>Google Maps<');
      expect(html, background).not.toContain('<svg');
    }
  });

  it('keeps Google\'s clear space (10px left/right/top, 5px below) and never shrinks the logo', () => {
    const html = renderToStaticMarkup(<GoogleMapsAttribution />);
    for (const token of ['px-2.5', 'pt-2.5', 'pb-[5px]', 'max-w-none', 'shrink-0']) expect(html).toContain(token);
    expect(html).not.toMatch(/scale|rotate|skew|filter|opacity|mix-blend|grayscale|invert/);
  });

  it('applies no CSS colour or filter to the logo (appearance stays exactly as Google supplied it)', () => {
    const html = renderToStaticMarkup(<GoogleMapsAttribution background="busy-dark" />);
    const img = html.match(/<img[^>]*>/)?.[0] ?? '';
    expect(img).not.toMatch(/style=|text-\[|bg-|filter|fill-|stroke-/);
    // The class list is pinned: only layout and Google's clear space. Any h-/w-/size-/object- utility would stretch,
    // squash or crop the logo, so it fails here.
    const classes = (img.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).filter(Boolean).sort();
    expect(classes).toEqual(['box-content', 'inline-block', 'max-w-none', 'pb-[5px]', 'pt-2.5', 'px-2.5', 'shrink-0']);
  });

  it('renders the lead-in sentence before the logo, readable at 12px (card) and 14px (detail), with no animation or interactivity', () => {
    const card = renderToStaticMarkup(<GoogleMapsAttribution variant="card" prefix="Property information sourced from" />);
    const detail = renderToStaticMarkup(<GoogleMapsAttribution variant="detail" prefix="Property information sourced from" />);
    expect(card.indexOf('Property information sourced from')).toBeLessThan(card.indexOf('<img'));
    expect(card).toContain('text-xs');
    expect(detail).toContain('text-sm');
    for (const html of [card, detail]) {
      expect(html).toContain('text-[#5E5E5E]');
      expect(html).not.toMatch(/text-slate-[34]00|text-\[11px\]|text-\[10px\]|text-\[9px\]/);
      expect(html).not.toMatch(/animate-|transition|<a |<button|onClick/);
    }
  });

  it('renders exactly one attribution element', () => {
    expect(renderToStaticMarkup(<GoogleMapsAttribution />).match(/data-google-maps-attribution=/g)).toHaveLength(1);
  });
});

describe('GoogleMapsAttribution — text fallback only when a variant is not registered', () => {
  it('falls back to the documented text "Google Maps", never wrapped, translated or re-capitalized', () => {
    const html = renderToStaticMarkup(<GoogleMapsAttribution assets={{}} />);
    expect(html).toContain('>Google Maps<');
    expect(html).toContain('whitespace-nowrap');
    expect(html).toContain('normal-case');
    expect(html).toContain('translate="no"');
    expect(html).toContain('data-google-maps-attribution="text"');
    expect(html).not.toContain('<img');
  });

  it('never substitutes a different variant: a missing variant falls back to text, not to another logo', () => {
    const html = renderToStaticMarkup(<GoogleMapsAttribution assets={{ plain: GOOGLE_MAPS_LOGO_ASSETS.plain }} background="busy-dark" />);
    expect(html).not.toContain('<img');
    expect(html).toContain('data-google-maps-attribution="text"');
  });

  it('never draws a logo itself: no inline SVG, no CSS-drawn mark, in any state', () => {
    for (const assets of [{}, GOOGLE_MAPS_LOGO_ASSETS]) {
      expect(renderToStaticMarkup(<GoogleMapsAttribution assets={assets} />)).not.toMatch(/<svg|<path|<canvas|background-image/);
    }
  });
});
