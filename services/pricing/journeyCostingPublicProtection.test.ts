import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() }));
vi.mock('@/models/Journey', () => ({ Journey: {} }));
import { toTravelPackage } from '@/lib/packages';
import type { JourneyDocument } from '@/models/Journey';
import { syntheticCosting } from './journeyCosting.fixture';
describe('costing isolation from public Journeys', () => {
  it('public serializer discards internal fields even if present on a source document', () => {
    const document = { slug: 'test', name: 'Test', price: 123, status: 'published', image: '/test.jpg',
      hotelCosts: syntheticCosting().hotelCosts, supplierName: 'PRIVATE', grossProfit: 999, journeyCosting: syntheticCosting(), notes: 'PRIVATE' };
    const publicData = JSON.stringify(toTravelPackage(document as unknown as JourneyDocument));
    expect(publicData).toContain('"price":123');
    for (const privateField of ['PRIVATE', 'hotelCosts', 'supplierName', 'grossProfit', 'journeyCosting', 'notes']) expect(publicData).not.toContain(privateField);
  });
  it('persistence/apply module has no MongoDB Journey write dependency', () => {
    const source = readFileSync('services/pricing/journeyCostingStore.service.ts', 'utf8');
    expect(source).not.toMatch(/from\s+['"].*(?:mongodb|models\/Journey)['"]/);
    expect(source).not.toMatch(/\.(?:updateOne|updateMany|findByIdAndUpdate|findOneAndUpdate|deleteOne)\(/);
    expect(source).toContain("executionEnabled: false");
  });
});
