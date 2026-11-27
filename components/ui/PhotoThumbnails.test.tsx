import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PhotoThumbnails } from '@/components/ui/PhotoThumbnails';

const photos = ['/api/places/photo?name=a&w=1200', '/api/places/photo?name=b&w=1200', '/api/places/photo?name=c&w=1200'];

describe('PhotoThumbnails', () => {
  it('renders one thumbnail per photo, with the rewritten URL and its own alt text', () => {
    const html = renderToStaticMarkup(
      <PhotoThumbnails photos={photos} srcFor={(photo) => photo.replace('w=1200', 'w=192')} altFor={(index) => `Hotel, photo ${index + 2}`} sizes="40px" rowClassName="row" itemClassName="item" />
    );
    expect(html.match(/<img/g)?.length).toBe(3);
    expect(html).toContain('alt="Hotel, photo 2"');
    expect(html).toContain('alt="Hotel, photo 4"');
    expect(html).toContain('w=192');
    expect(html).not.toContain('data-photo-fallback');
  });

  it('renders nothing at all when there are no photos (the row collapses)', () => {
    expect(renderToStaticMarkup(<PhotoThumbnails photos={[]} altFor={() => ''} sizes="40px" itemClassName="item" />)).toBe('');
  });
});
