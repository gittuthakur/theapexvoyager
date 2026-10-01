import { describe, expect, it } from 'vitest';
import { PUBLICATION_SLUGS, publicationUpdate, validatePublishedDocument } from './publishSecondJourneyBatch';
import { draftJourneys } from '../config/draftJourneys.config';

describe('Batch 2 controlled publication', () => {
  it('allows exactly eight slugs and persists status only', () => {
    expect(PUBLICATION_SLUGS).toHaveLength(8);
    for (const slug of PUBLICATION_SLUGS) expect(publicationUpdate(slug)).toEqual({ $set: { status: 'published' } });
    for (const slug of ['manali-premium-escape', 'leh-nubra-pangong-tour', 'shimla-short-escape-extra', '']) {
      expect(() => publicationUpdate(slug)).toThrow('Unknown publication slug');
    }
  });
  it('runs the real document publication validation on all approved targets', async () => {
    for (const record of draftJourneys.filter(j => PUBLICATION_SLUGS.includes(j.slug))) {
      await expect(validatePublishedDocument(record)).resolves.toBeUndefined();
      expect(record.status).toBe('draft');
    }
  });
  it('refuses incomplete documents through the published pre-validate hook', async () => {
    const record = draftJourneys.find(j => j.slug === 'shimla-short-escape')!;
    for (const invalid of [{ price: 0 }, { image: '' }, { inclusions: [] }, { exclusions: [] }]) {
      await expect(validatePublishedDocument({ ...record, ...invalid })).rejects.toThrow('A published Journey');
    }
  });
});
