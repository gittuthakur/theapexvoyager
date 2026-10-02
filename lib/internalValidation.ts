import { isValidCalendarDateISO } from './dateValidation';
export function strictObject(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k)) || keys.some(k => !(k in value))) throw new Error(`${label}: invalid fields`);
}
export function boundedText(value: unknown, label: string, max = 2000, required = false): asserts value is string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || (required && !value.trim())) throw new Error(`${label}: invalid text`);
}
export function amount(value: unknown, label: string, nullable = false, max = 1e9): asserts value is number | null {
  if (value === null && nullable) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`${label}: invalid amount`);
}
export function option(value: unknown, choices: readonly string[], label: string) { if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`${label}: invalid option`); }
export function flag(value: unknown, label: string) { if (typeof value !== 'boolean') throw new Error(`${label}: invalid boolean`); }
export function calendarDate(value: unknown, label: string) { if (typeof value !== 'string' || !isValidCalendarDateISO(value)) throw new Error(`${label}: invalid date`); }
export function uuid(value: unknown) { if (typeof value !== 'string' || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/.test(value)) throw new Error('Invalid identifier'); }
export function textList(value: unknown, label: string) { if (!Array.isArray(value) || value.length > 100) throw new Error(`${label}: invalid list`); for (const item of value) boundedText(item, label, 200, true); }
