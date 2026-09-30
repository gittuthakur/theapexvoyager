import { describe, expect, it } from 'vitest';
import { Destination } from './Destination';

describe('Destination model — status defaults to draft (Phase 3B publish workflow)', () => {
  it('defaults to draft when status is omitted — a new Destination is never accidentally public', () => {
    const doc = new Destination({ slug: 'test-destination', title: 'Test', category: 'Test', description: 'x', image: '/x.jpg' });
    expect(doc.status).toBe('draft');
  });

  it('rejects an undocumented status value', async () => {
    const doc = new Destination({ slug: 'test-destination', title: 'Test', category: 'Test', description: 'x', image: '/x.jpg', status: 'archived' });
    let error: unknown;
    try {
      await doc.validate();
    } catch (e) {
      error = e;
    }
    expect((error as { errors?: { status?: unknown } })?.errors?.status).toBeDefined();
  });

  it('slug carries a unique index — enforced at the MongoDB level, not application code', () => {
    expect(Destination.schema.path('slug').options.unique).toBe(true);
  });
});
