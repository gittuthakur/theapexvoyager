import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { demoSupplier, demoHotelRate } from './supplierLibrary.fixture';
vi.mock('@/lib/mongodb', () => ({ connectDB: vi.fn() })); vi.mock('@/models/Journey', () => ({ Journey: {} }));
import { toTravelPackage } from '@/lib/packages';
import type { JourneyDocument } from '@/models/Journey';
it('public Journey serialization excludes supplier contacts, master rates and provenance even if injected into source', () => {
  const s = demoSupplier(); s.input.phone = '+91 9999999999'; s.input.email = 'demo@example.invalid';
  const publicData = JSON.stringify(toTravelPackage({ slug: 'test', price: 100, supplier: s, supplierRate: demoHotelRate(), supplierRateSnapshot: { supplierId: s.id }, phone: s.input.phone, email: s.input.email } as unknown as JourneyDocument));
  for (const privateValue of ['supplier', 'supplierRate', 'phone', 'email', s.input.phone, s.input.email]) expect(publicData).not.toContain(privateValue);
});
it('new persistence has no MongoDB/communications/analytics write dependency', () => {
  const store = readFileSync('services/pricing/supplierLibraryStore.service.ts', 'utf8'); expect(store).not.toMatch(/mongoose|mongodb|models\/Journey['"]|updateOne|findOneAndUpdate|deleteOne/);
  for (const file of ['app/internal/suppliers/SupplierLibraryClient.tsx', 'components/internal/SupplierRatePicker.tsx', 'components/internal/SupplierQuoteHelper.tsx']) {
    expect(readFileSync(file, 'utf8')).not.toMatch(/fbq|gtag|metaPixel|googleAds|sendMail|api\/whatsapp|console\.log/);
  }
});
