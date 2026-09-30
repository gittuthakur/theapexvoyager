import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Breadcrumb from './Breadcrumb';

describe('Breadcrumb', () => {
  it('renders nothing for an empty item list', () => {
    expect(renderToStaticMarkup(<Breadcrumb items={[]} />)).toBe('');
  });

  it('renders a real <nav aria-label="Breadcrumb"> with semantic list markup', () => {
    const html = renderToStaticMarkup(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />);
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<ol');
    expect(html).toContain('<li');
  });

  it('links every item except the last, which never links to itself', () => {
    const html = renderToStaticMarkup(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Journeys', href: '/journeys' }, { label: 'Manali Premium Escape' }]} />
    );
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/journeys"');
    expect(html).toContain('>Manali Premium Escape<');
    // The current page's own label must not appear inside an <a> tag.
    expect(html).not.toMatch(/<a[^>]*>Manali Premium Escape<\/a>/);
  });

  it('marks the final item aria-current="page" for assistive tech', () => {
    const html = renderToStaticMarkup(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />);
    expect(html).toContain('aria-current="page"');
  });

  it('never keyword-stuffs — renders exactly the given labels, nothing appended', () => {
    const html = renderToStaticMarkup(<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shimla Manali Tour Package' }]} />);
    expect(html).toContain('>Shimla Manali Tour Package<');
    expect(html).not.toContain('Shimla Manali Tour Package |');
  });
});
