import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLibrary, saveSupplier, saveRate, verifySupplier, assertAuthoritativeSnapshots } from './supplierLibraryStore.service';
import { demoSupplier, demoHotelRate, demoSelection } from './supplierLibrary.fixture';
import { makeSnapshot, snapshotFinancials } from './supplierLibrary.service';
import { emptyCosting, emptyLine } from './journeyCosting.service';
import { saveCosting, listCostings } from './journeyCostingStore.service';
import { SYNTHETIC_JOURNEY } from './journeyCosting.fixture';
const ref = (row: { id: string; version: number }) => ({ id: row.id, version: row.version });
let root = ''; afterEach(async () => { if (root) await rm(root, { recursive: true }); root = ''; });
describe('local supplier revisions and costing integration', () => {
  it('verification is explicit, status changes retain history, identity edits reset verification', async () => {
    root = await mkdtemp(join(tmpdir(), 'phase15-library-')); let supplier = await saveSupplier(demoSupplier().input, null, root);
    expect(supplier.verificationStatus).toBe('UNVERIFIED');
    await expect(verifySupplier(ref(supplier), 'VERIFIED', 'DEMO checked', '', root)).rejects.toThrow('acknowledgement');
    supplier = await verifySupplier(ref(supplier), 'VERIFIED', 'DEMO checked', `VERIFY ${supplier.id}`, root); expect(supplier.verifiedAt).not.toBeNull();
    supplier = await saveSupplier({ ...supplier.input, status: 'INACTIVE' }, ref(supplier), root); expect(supplier.verificationStatus).toBe('VERIFIED');
    supplier = await saveSupplier({ ...supplier.input, name: 'DEMO renamed' }, ref(supplier), root); expect(supplier.verificationStatus).toBe('UNVERIFIED');
    const library = await readLibrary(root); expect(library.suppliers).toHaveLength(1); expect(library.supplierHistory).toHaveLength(4);
  });
  it('rate revisions and seasons preserve history; saved costings retain their exact historical snapshot', async () => {
    root = await mkdtemp(join(tmpdir(), 'phase15-library-')); const directory = join(root, 'supplier-library'); const supplier = await saveSupplier(demoSupplier().input, null, directory);
    const input = demoHotelRate().input; input.supplierId = supplier.id; const original = await saveRate(input, null, directory);
    const costing = emptyCosting(SYNTHETIC_JOURNEY); costing.scenarioName = 'DEMO / SYNTHETIC snapshot integration'; const snapshot = makeSnapshot(supplier, original, demoSelection());
    costing.hotelCosts = [{ ...emptyLine('hotel', 'hotelCosts'), label: 'DEMO hotel', ...snapshotFinancials(snapshot), supplierRateSnapshot: snapshot }];
    const saved = await saveCosting(costing, SYNTHETIC_JOURNEY, null, root);
    const newInput = structuredClone(input); newInput.hotel!.doubleOccupancyRate = 2500; const revised = await saveRate(newInput, ref(original), directory); expect(revised.version).toBe(2);
    await expect(saveRate(newInput, ref(original), directory)).rejects.toThrow('conflict');
    await saveRate({ ...newInput, seasonLabel: 'DEMO next season', validFrom: '2027-01-01', validTo: '2027-12-31' }, null, directory);
    expect((await readLibrary(directory)).rateHistory).toHaveLength(3); expect((await listCostings(root))[0].calculation.subtotal).toBe(6000); expect(saved.input.hotelCosts[0].unitCost).toBe(2000);
    await expect(assertAuthoritativeSnapshots(costing, directory)).resolves.toBeUndefined();
    const forged = structuredClone(costing); forged.hotelCosts[0].supplierRateSnapshot!.snapshotRate.hotel!.doubleOccupancyRate = 1; await expect(assertAuthoritativeSnapshots(forged, directory)).rejects.toThrow('altered');
    expect(SYNTHETIC_JOURNEY.price).toBeNull(); expect(SYNTHETIC_JOURNEY.status).toBe('draft');
  });
  it('cannot create rates for nonexistent or deactivated suppliers', async () => {
    root = await mkdtemp(join(tmpdir(), 'phase15-library-')); await expect(saveRate(demoHotelRate().input, null, root)).rejects.toThrow('existing');
    const supplier = await saveSupplier({ ...demoSupplier().input, status: 'INACTIVE' }, null, root); await expect(saveRate({ ...demoHotelRate().input, supplierId: supplier.id }, null, root)).rejects.toThrow('non-inactive');
  });
});
