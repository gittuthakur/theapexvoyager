import { describe, expect, it } from 'vitest';
import { TARGET, assertTarget, assertAllowedFields, correctedItinerary, prepareValues, unchangedOutsidePlan } from './preparePhase11Gulmarg';
import { draftJourneys } from '../config/draftJourneys.config';
import { Journey } from '../models/Journey';
import { getCommercialBlockers } from '../lib/journeyCommercialReadiness';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GULMARG_WINTER_IMAGE, getJourneyImageCredit } from '../config/imageCredits.config';

const original = draftJourneys.find((journey) => journey.slug === TARGET)!;
const image = GULMARG_WINTER_IMAGE;

describe('Phase 11 Gulmarg commercial preparation', () => {
  it('refuses all non-target or non-draft updates', () => {
    for (const journey of draftJourneys) {
      if (journey.slug === TARGET) {
        expect(() => assertTarget(journey.slug, 'draft')).not.toThrow();
      } else {
        expect(() => assertTarget(journey.slug, 'draft')).toThrow();
      }
      expect(() => assertTarget(journey.slug, 'published')).toThrow();
    }
    for (const field of ['status', 'slug', 'duration', 'startingCity', 'endingCity', 'destinationSlugs', 'importantNotes', 'updatedAt', 'priceBasis']) {
      expect(() => assertAllowedFields({ [field]: 'changed' })).toThrow();
    }
  });

  it('corrects only the minimal Gondola wording and preserves the rest of the itinerary', () => {
    const days = original.itinerary.map((day) => ({ ...day, _id: `preserved-${day.day}` }));
    const corrected = correctedItinerary(days);

    expect(corrected.filter((day, index) => day.description !== days[index].description).map((day) => day.day)).toEqual([2, 3]);
    expect(corrected[1].description).toContain('optional and separately payable');
    expect(corrected[1].description).toContain('operations, weather, availability');
    expect(corrected[2].description).toContain('Skiing, snowboarding, sledging, snowmobile');
    expect(corrected[2].description).toContain('optional and separately payable');
    expect(corrected[2].description).toContain('may require itinerary changes');
    expect(corrected[2].description).toContain('Snowfall and uninterrupted access are not guaranteed');
    expect(corrected[1]._id).toBe('preserved-2');
    expect(correctedItinerary(corrected)).toEqual(corrected);
  });

  it('prepares the approved commercial values and keeps all protected fields untouched', () => {
    const values = prepareValues(original, image);

    expect(values.price).toBe(19999);
    expect(values.pickupInfo).toContain('Srinagar Airport');
    expect(values.dropInfo).toContain('Srinagar Airport');
    expect(values.mealPlan).toContain('3 breakfasts');
    expect(values.transportType).toContain('Srinagar Airport');
    expect(values.hotelCategoryDescription).toContain('3 nights');
    expect(values.inclusions).toContain('3 nights of approved accommodation');
    expect(values.exclusions).toContain('Gondola tickets');
    expect(values.exclusions).toContain('Snowmobile and other snow activities');
    expect(values.usesGeneralCancellationPolicy).toBe(true);
    expect(values.image).toBe('/images/gulmarg-winter-snow.jpg');
    expect(values).not.toHaveProperty('status');
    expect(values).not.toHaveProperty('slug');
    expect(values).not.toHaveProperty('duration');
  });

  it('uses the verified credited winter asset and confirms its image bytes are valid', () => {
    const credit = getJourneyImageCredit(image);
    const localPath = resolve('public', image.slice(1));
    const bytes = readFileSync(localPath);

    expect(credit).toMatchObject({
      title: 'Snowfall In Gulmarg',
      author: 'Koshur',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Snowfall_In_Gulmarg.jpg',
      originalMediaUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Snowfall_In_Gulmarg.jpg',
      downloadedMediaUrl:
        'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Snowfall_In_Gulmarg.jpg/1280px-Snowfall_In_Gulmarg.jpg',
      originalResolution: '4096x3072',
      localResolution: '1280x960',
      licenseName: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      modified: true
    });
    expect(credit?.modificationDescription).toContain('1280x960');
    expect(existsSync(localPath)).toBe(true);
    expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(prepareValues(original, image).image).toBe(image);
  });

  it('keeps the draft in a safe state: valid draft, only owner approval blocker remains, no publication', async () => {
    const values = prepareValues(original, image);
    const record = { ...original, ...values };
    const draft = Journey.hydrate(record);

    await expect(draft.validate()).resolves.toBeUndefined();
    expect(getCommercialBlockers(draft)).toEqual(['OWNER_APPROVAL_REQUIRED']);
    expect(draft.status).toBe('draft');

    draft.status = 'published';
    await expect(draft.validate()).resolves.toBeUndefined();
    expect(record.status).toBe('draft');
    expect(prepareValues(record, image)).toEqual(values);
  });

  it('refuses unrelated mutation and preserves the global draft-only contract', () => {
    const values = prepareValues(original, image);
    expect(unchangedOutsidePlan(original, { ...original, ...values }, values)).toBe(true);
    for (const extra of [{ status: 'published' }, { updatedAt: 'changed' }, { importantNotes: ['changed'] }, { itinerary: [] }]) {
      expect(unchangedOutsidePlan(original, { ...original, ...values, ...extra }, values)).toBe(false);
    }
  });
});
