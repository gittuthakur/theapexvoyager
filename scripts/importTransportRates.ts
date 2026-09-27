/**
 * The safe write path for genuine Transport supplier rates (TP2 Section 27). This is a
 * guarded, server-side, human-run import script — never a public endpoint, never wired
 * into any UI. It exists so a real supplier rate can enter TransportRate the day one is
 * collected, without building a production admin UI (this repo has no real admin
 * authentication yet — see lib/internalRouteGuard.ts's own doc comment).
 *
 * Usage:
 *   npx tsx scripts/importTransportRates.ts --file path/to/rates.csv
 *
 * The CSV columns match docs/transport-rate-import-template.md exactly. Every row is
 * validated and routed through services/pricing/transportPricing.service.ts's
 * createTransportRate — the same referential-integrity and overlap checks apply here as
 * everywhere else; this script adds no bypass. Rupee amounts in the CSV are converted to
 * minorUnits (paise) here, since that's the unit staff will naturally enter, while the
 * schema itself only ever stores minor units (see models/TransportRate.ts).
 *
 * With no --file argument, or a file that doesn't exist, this prints usage and exits
 * without touching the database — it never seeds a placeholder or demo row.
 */
import { connectDB } from '../lib/mongodb';
import { createTransportRate, type CreateTransportRateInput } from '../services/pricing/transportPricing.service';
import { TRANSPORT_RATE_TYPES, TRANSPORT_RATE_VEHICLE_CATEGORIES, type TransportRateType, type TransportRateVehicleCategory } from '../models/TransportRate';

const REQUIRED_COLUMNS = [
  'partnerId',
  'vehicleCategory',
  'rateType',
  'routeId',
  'circuitKey',
  'journeySlug',
  'supplierCostRupees',
  'includedKm',
  'minimumKm',
  'extraKmRateRupees',
  'driverAllowanceRupees',
  'nightChargeRupees',
  'fuelIncluded',
  'driverAllowanceIncluded',
  'tollParkingIncluded',
  'stateTaxIncluded',
  'permitIncluded',
  'nightChargeIncluded',
  'validFrom',
  'validTo',
  'source',
  'sourceReference',
  'verifiedBy',
  'notes'
] as const;

export type Row = Record<(typeof REQUIRED_COLUMNS)[number], string>;

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const row = {} as Row;
    header.forEach((col, i) => {
      (row as Record<string, string>)[col] = cells[i] ?? '';
    });
    return row;
  });
}

function toRupeesToMinorUnits(value: string): number | undefined {
  if (!value) return undefined;
  const rupees = Number(value);
  if (!Number.isFinite(rupees)) return undefined;
  return Math.round(rupees * 100);
}

function toOptionalBoolean(value: string): boolean | undefined {
  if (value === '') return undefined;
  if (value.toLowerCase() === 'true' || value === '1') return true;
  if (value.toLowerCase() === 'false' || value === '0') return false;
  return undefined;
}

function toOptionalInt(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export interface RowValidationResult {
  valid: boolean;
  input?: CreateTransportRateInput;
  errors: string[];
}

/** Pure, DB-free validation — kept separate from main() so its logic is directly
 *  unit-testable without a Mongo connection or file I/O. */
export function validateRow(row: Row): RowValidationResult {
  const errors: string[] = [];

  if (!row.partnerId) errors.push('partnerId is required');
  if (!TRANSPORT_RATE_VEHICLE_CATEGORIES.includes(row.vehicleCategory as TransportRateVehicleCategory)) {
    errors.push(`vehicleCategory "${row.vehicleCategory}" is not a real category`);
  }
  if (!TRANSPORT_RATE_TYPES.includes(row.rateType as TransportRateType)) {
    errors.push(`rateType "${row.rateType}" is not one of ${TRANSPORT_RATE_TYPES.join(', ')}`);
  }
  if (row.rateType === 'CIRCUIT_FIXED') {
    if (!row.circuitKey) errors.push('circuitKey is required for CIRCUIT_FIXED');
    if (row.routeId) errors.push('routeId must be blank for CIRCUIT_FIXED');
  } else if (row.circuitKey) {
    errors.push('circuitKey must be blank unless rateType is CIRCUIT_FIXED');
  }

  const supplierCostMinorUnits = toRupeesToMinorUnits(row.supplierCostRupees);
  if (!supplierCostMinorUnits || supplierCostMinorUnits <= 0) {
    errors.push('supplierCostRupees is required and must be a positive number — never invented, must come from the supplier');
  }

  if (!row.validFrom || Number.isNaN(Date.parse(row.validFrom))) errors.push('validFrom is required and must be a valid date');
  if (!row.validTo || Number.isNaN(Date.parse(row.validTo))) errors.push('validTo is required and must be a valid date');
  if (!row.source) errors.push('source is required (how/where this rate was actually obtained)');

  if (errors.length > 0) return { valid: false, errors };

  const input: CreateTransportRateInput = {
    partnerId: row.partnerId,
    vehicleCategory: row.vehicleCategory as TransportRateVehicleCategory,
    rateType: row.rateType as TransportRateType,
    routeId: row.routeId || undefined,
    circuitKey: row.circuitKey || undefined,
    journeySlug: row.journeySlug || undefined,
    supplierCostMinorUnits: supplierCostMinorUnits as number,
    includedKm: toOptionalInt(row.includedKm),
    minimumKm: toOptionalInt(row.minimumKm),
    extraKmRateMinorUnits: toRupeesToMinorUnits(row.extraKmRateRupees),
    driverAllowanceMinorUnits: toRupeesToMinorUnits(row.driverAllowanceRupees),
    nightChargeMinorUnits: toRupeesToMinorUnits(row.nightChargeRupees),
    inclusions: {
      fuelIncluded: toOptionalBoolean(row.fuelIncluded),
      driverAllowanceIncluded: toOptionalBoolean(row.driverAllowanceIncluded),
      tollParkingIncluded: toOptionalBoolean(row.tollParkingIncluded),
      stateTaxIncluded: toOptionalBoolean(row.stateTaxIncluded),
      permitIncluded: toOptionalBoolean(row.permitIncluded),
      nightChargeIncluded: toOptionalBoolean(row.nightChargeIncluded)
    },
    validFrom: new Date(row.validFrom),
    validTo: new Date(row.validTo),
    source: row.source,
    sourceReference: row.sourceReference || undefined,
    verifiedBy: row.verifiedBy || undefined,
    notes: row.notes || undefined
  };

  return { valid: true, input, errors: [] };
}

async function main() {
  const fileArgIndex = process.argv.indexOf('--file');
  const filePath = fileArgIndex !== -1 ? process.argv[fileArgIndex + 1] : undefined;

  if (!filePath) {
    console.log('Usage: npx tsx scripts/importTransportRates.ts --file path/to/rates.csv');
    console.log('See docs/transport-rate-import-template.md for the column format.');
    console.log('No file given — nothing was read or written.');
    return;
  }

  const fs = await import('node:fs');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath} — nothing was read or written.`);
    return;
  }

  try {
    process.loadEnvFile('.env.local');
  } catch {
    // .env.local not found — assume MONGODB_URI is already set in the environment.
  }

  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCsv(text);

  if (rows.length === 0) {
    console.log('File contained no data rows — nothing was written.');
    return;
  }

  await connectDB();

  let inserted = 0;
  let rejected = 0;

  for (const [index, row] of rows.entries()) {
    const validation = validateRow(row);
    if (!validation.valid || !validation.input) {
      rejected += 1;
      console.log(`Row ${index + 2}: REJECTED — ${validation.errors.join('; ')}`);
      continue;
    }

    // Sequential, human-reviewed import; a handful of rows at a time, never a
    // bulk/high-volume path.
    const result = await createTransportRate(validation.input);
    if (result.created) {
      inserted += 1;
      console.log(`Row ${index + 2}: inserted rate ${String(result.rate._id)}`);
    } else {
      rejected += 1;
      console.log(`Row ${index + 2}: REJECTED — ${result.reason}${result.detail ? `: ${result.detail}` : ''}`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}. Rejected: ${rejected}.`);
}

// Guarded so `validateRow` can be imported and unit-tested (scripts/importTransportRates.test.ts)
// without also running the CLI's file/DB side effects — Vitest sets process.env.VITEST.
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error('Transport rate import failed:', error);
    process.exit(1);
  });
}
