import { describe, expect, it } from 'vitest';
import { PUBLICATION_SLUGS, publicationUpdate, validatePublishedDocument } from './publishPhase9BJourneys';
import { commercialValues } from './preparePhase9ACommercialData';
import { draftJourneys } from '../config/draftJourneys.config';

describe('Phase 9B exact publication', () => {
  it('permits only the approved two and updates status only', () => {
    expect(PUBLICATION_SLUGS).toEqual(['dharamshala-mcleodganj-short-escape', 'grand-himachal-circuit']);
    for (const j of draftJourneys) {
      if (PUBLICATION_SLUGS.includes(j.slug)) expect(publicationUpdate(j.slug)).toEqual({ $set: { status: 'published' } });
      else expect(() => publicationUpdate(j.slug)).toThrow();
    }
  });
  it('runs actual document validation for approved commercial records without mutating them', async () => {
    for (const slug of PUBLICATION_SLUGS) {
      const config = draftJourneys.find(j => j.slug === slug)!;
      const record = { ...config, ...commercialValues(slug, '/images/verified.jpg') };
      const before = structuredClone(record);
      await expect(validatePublishedDocument(record)).resolves.toBeUndefined();
      expect(record).toEqual(before);
      for (const invalid of [{ price: 0 }, { image: '' }, { inclusions: [] }, { exclusions: [] }]) {
        await expect(validatePublishedDocument({ ...record, ...invalid })).rejects.toThrow('A published Journey');
      }
    }
  });
});
