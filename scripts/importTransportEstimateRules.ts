/**
 * The safe write path for owner-approved TransportEstimateRule rows (TP3B Section 27),
 * modeled directly on scripts/importTransportRates.ts. A guarded, server-side,
 * human-run import script — never a public endpoint, never wired into any UI.
 *
 * Usage:
 *   npx tsx scripts/importTransportEstimateRules.ts --file path/to/rules.csv
 *
 * The CSV columns match docs/transport-estimate-rule-import-template.md exactly. Every
 * row is validated and routed through
 * services/pricing/transportEstimate.service.ts's createTransportEstimateRule — the same
 * overlap check applies here as everywhere else; this script adds no bypass. Rupee
 * amounts in the CSV are converted to minor units (paise) here, since that's the unit
 * staff will naturally enter, while the schema itself only ever stores minor units (see
 * models/TransportEstimateRule.ts).
 *
 * With no --file argument, or a file that doesn't exist, this prints usage and exits
 * without touching the database — it never seeds a placeholder or demo row. This script
 * is NOT run against production during TP3B (TP3B Section 29) — the expected
 * TransportEstimateRule count after this phase ships is 0.
 */
import { connectDB } from '../lib/mongodb';
import { createTransportEstimateRule, type CreateTransportEstimateRuleInput } from '../services/pricing/transportEstimate.service';
import {
  TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES,
  TRANSPORT_ESTIMATE_SERVICE_REGIONS,
  TRANSPORT_ESTIMATE_TRIP_TYPES,
  TRANSPORT_ESTIMATE_RATE_BASIS,
  TRANSPORT_ESTIMATE_SOURCE_TYPES,
  TRANSPORT_ESTIMATE_COMPONENT_STATUSES,
  type TransportEstimateTripType,
  type TransportEstimateRateBasis,
  type TransportEstimateSourceType,
  type TransportEstimateComponentStatus
} from '../models/TransportEstimateRule';
import type { TransportRateVehicleCategory } from '../models/TransportRate';

const REQUIRED_COLUMNS = [
  'vehicleCategory',
  'serviceRegion',
  'tripType',
  'rateBasis',
  'perKmRateRupees',
  'minimumKmPerDay',
  'driverAllowanceApplicable',
  'driverAllowanceIncludedInBaseFare',
  'driverAllowancePerDayAmountRupees',
  'nightHaltChargeRupees',
  'tollStatus',
  'parkingStatus',
  'stateTaxStatus',
  'permitStatus',
  'validFrom',
  'validTo',
  'sourceType',
  'sourceName',
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

function toOptionalComponentStatus(value: string): TransportEstimateComponentStatus | undefined {
  if (!value) return undefined;
  return TRANSPORT_ESTIMATE_COMPONENT_STATUSES.includes(value as TransportEstimateComponentStatus) ? (value as TransportEstimateComponentStatus) : undefined;
}

export interface RowValidationResult {
  valid: boolean;
  input?: CreateTransportEstimateRuleInput;
  errors: string[];
}

/** Pure, DB-free validation — kept separate from main() so its logic is directly
 *  unit-testable without a Mongo connection or file I/O (mirrors
 *  scripts/importTransportRates.ts's validateRow). */
export function validateRow(row: Row): RowValidationResult {
  const errors: string[] = [];

  if (!TRANSPORT_ESTIMATE_VEHICLE_CATEGORIES.includes(row.vehicleCategory as TransportRateVehicleCategory)) {
    errors.push(`vehicleCategory "${row.vehicleCategory}" is not a real category`);
  }
  if (!TRANSPORT_ESTIMATE_SERVICE_REGIONS.includes(row.serviceRegion)) {
    errors.push(`serviceRegion "${row.serviceRegion}" is not one of ${TRANSPORT_ESTIMATE_SERVICE_REGIONS.join(', ')}`);
  }
  if (!TRANSPORT_ESTIMATE_TRIP_TYPES.includes(row.tripType as TransportEstimateTripType)) {
    errors.push(`tripType "${row.tripType}" is not one of ${TRANSPORT_ESTIMATE_TRIP_TYPES.join(', ')}`);
  }
  if (!TRANSPORT_ESTIMATE_RATE_BASIS.includes(row.rateBasis as TransportEstimateRateBasis)) {
    errors.push(`rateBasis "${row.rateBasis}" is not one of ${TRANSPORT_ESTIMATE_RATE_BASIS.join(', ')}`);
  }
  if (!TRANSPORT_ESTIMATE_SOURCE_TYPES.includes(row.sourceType as TransportEstimateSourceType)) {
    errors.push(`sourceType "${row.sourceType}" is not one of ${TRANSPORT_ESTIMATE_SOURCE_TYPES.join(', ')}`);
  }

  const perKmRateMinorUnits = toRupeesToMinorUnits(row.perKmRateRupees);
  if (!perKmRateMinorUnits || perKmRateMinorUnits <= 0) {
    errors.push('perKmRateRupees is required and must be a positive number — never invented, must be owner-approved');
  }
  const perKmRateRupeesNum = Number(row.perKmRateRupees);
  if (row.perKmRateRupees && Number.isFinite(perKmRateRupeesNum) && Math.abs(perKmRateRupeesNum * 100 - Math.round(perKmRateRupeesNum * 100)) > 1e-6) {
    errors.push('perKmRateRupees must not include a sub-paise fraction (never silently rounded)');
  }

  if (!row.validFrom || Number.isNaN(Date.parse(row.validFrom))) errors.push('validFrom is required and must be a valid date');
  if (!row.validTo || Number.isNaN(Date.parse(row.validTo))) errors.push('validTo is required and must be a valid date');
  if (row.validFrom && row.validTo && !Number.isNaN(Date.parse(row.validFrom)) && !Number.isNaN(Date.parse(row.validTo))) {
    if (new Date(row.validTo) < new Date(row.validFrom)) errors.push('validTo must be on or after validFrom');
  }

  const driverAllowanceApplicable = toOptionalBoolean(row.driverAllowanceApplicable) ?? false;
  const driverAllowanceIncludedInBaseFare = toOptionalBoolean(row.driverAllowanceIncludedInBaseFare) ?? false;
  const driverAllowancePerDayAmountMinorUnits = toRupeesToMinorUnits(row.driverAllowancePerDayAmountRupees);
  if (driverAllowanceApplicable && !driverAllowanceIncludedInBaseFare && (!driverAllowancePerDayAmountMinorUnits || driverAllowancePerDayAmountMinorUnits <= 0)) {
    errors.push('driverAllowancePerDayAmountRupees is required when driverAllowanceApplicable is true and driverAllowanceIncludedInBaseFare is false');
  }
  if ((!driverAllowanceApplicable || driverAllowanceIncludedInBaseFare) && driverAllowancePerDayAmountMinorUnits) {
    errors.push('driverAllowancePerDayAmountRupees must be blank unless driverAllowanceApplicable is true and driverAllowanceIncludedInBaseFare is false');
  }

  for (const [column, value] of [
    ['tollStatus', row.tollStatus],
    ['parkingStatus', row.parkingStatus],
    ['stateTaxStatus', row.stateTaxStatus],
    ['permitStatus', row.permitStatus]
  ] as const) {
    if (value && !TRANSPORT_ESTIMATE_COMPONENT_STATUSES.includes(value as TransportEstimateComponentStatus)) {
      errors.push(`${column} "${value}" is not one of ${TRANSPORT_ESTIMATE_COMPONENT_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  const input: CreateTransportEstimateRuleInput = {
    vehicleCategory: row.vehicleCategory as TransportRateVehicleCategory,
    serviceRegion: row.serviceRegion,
    tripType: row.tripType as TransportEstimateTripType,
    rateBasis: row.rateBasis as TransportEstimateRateBasis,
    perKmRateMinorUnits: perKmRateMinorUnits as number,
    minimumKmPerDay: toOptionalInt(row.minimumKmPerDay),
    driverAllowance: {
      applicable: driverAllowanceApplicable,
      includedInBaseFare: driverAllowanceIncludedInBaseFare,
      perDayAmountMinorUnits: driverAllowanceApplicable && !driverAllowanceIncludedInBaseFare ? driverAllowancePerDayAmountMinorUnits : undefined
    },
    nightHaltChargeMinorUnits: toRupeesToMinorUnits(row.nightHaltChargeRupees),
    tollStatus: toOptionalComponentStatus(row.tollStatus),
    parkingStatus: toOptionalComponentStatus(row.parkingStatus),
    stateTaxStatus: toOptionalComponentStatus(row.stateTaxStatus),
    permitStatus: toOptionalComponentStatus(row.permitStatus),
    validFrom: new Date(row.validFrom),
    validTo: new Date(row.validTo),
    sourceType: row.sourceType as TransportEstimateSourceType,
    sourceName: row.sourceName || undefined,
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
    console.log('Usage: npx tsx scripts/importTransportEstimateRules.ts --file path/to/rules.csv');
    console.log('See docs/transport-estimate-rule-import-template.md for the column format.');
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
    const result = await createTransportEstimateRule(validation.input);
    if (result.created) {
      inserted += 1;
      console.log(`Row ${index + 2}: inserted rule ${String(result.rule._id)}`);
    } else {
      rejected += 1;
      console.log(`Row ${index + 2}: REJECTED — ${result.reason}${result.detail ? `: ${result.detail}` : ''}`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}. Rejected: ${rejected}.`);
}

// Guarded so `validateRow` can be imported and unit-tested (scripts/importTransportEstimateRules.test.ts)
// without also running the CLI's file/DB side effects — Vitest sets process.env.VITEST.
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error('Transport estimate rule import failed:', error);
    process.exit(1);
  });
}
