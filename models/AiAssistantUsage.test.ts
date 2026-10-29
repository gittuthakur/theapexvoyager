import { describe, expect, it } from 'vitest';
import { AiAssistantUsage } from '@/models/AiAssistantUsage';

// Schema-level checks only (no connection is opened): what Mongoose will build for this collection.
describe('AiAssistantUsage schema indexes', () => {
  const indexes = AiAssistantUsage.schema.indexes() as [Record<string, number>, Record<string, unknown>][];
  const find = (key: Record<string, number>) => indexes.find(([fields]) => JSON.stringify(fields) === JSON.stringify(key));

  it('declares a UNIQUE index on day (the integrity of the daily cap depends on it)', () => {
    const entry = find({ day: 1 });
    expect(entry).toBeDefined();
    expect(entry![1]).toMatchObject({ unique: true });
  });

  it('expires old counters with a TTL index on expireAt', () => {
    expect(find({ expireAt: 1 })![1]).toMatchObject({ expireAfterSeconds: 0 });
  });

  it('requires a day and an expiry, and counts start at zero', () => {
    expect(AiAssistantUsage.schema.path('day').isRequired).toBe(true);
    expect(AiAssistantUsage.schema.path('expireAt').isRequired).toBe(true);
    expect(AiAssistantUsage.schema.path('requests').options.default).toBe(0);
    expect(AiAssistantUsage.schema.path('tokens').options.default).toBe(0);
  });

  it('stores counts only: no field could hold conversation or contact content', () => {
    const fields = Object.keys(AiAssistantUsage.schema.paths).filter((name) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(name));
    expect(fields.sort()).toEqual(['day', 'expireAt', 'requests', 'tokens']);
  });
});
