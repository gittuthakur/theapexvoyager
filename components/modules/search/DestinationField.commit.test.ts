import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// DOM-free contract checks (no jsdom in this repo). They pin the structure that fixes the
// "Enter submits without the typed destination" defect; real keyboard behaviour needs a
// browser run.
const field = readFileSync(join(process.cwd(), 'components', 'modules', 'search', 'DestinationField.tsx'), 'utf8');
const panel = readFileSync(join(process.cwd(), 'components', 'GlobalSearchFilter.tsx'), 'utf8');

describe('DestinationField commits typed text to its parent immediately', () => {
  it('the input onChange handler forwards the typed value to the parent onChange', () => {
    const handler = field.slice(field.indexOf('onChange={(event) => {'), field.indexOf('placeholder={placeholder}'));
    expect(handler).toContain('setQuery(event.target.value)');
    expect(handler).toContain('onChange(event.target.value)');
  });
  it('picking a suggestion still commits the chosen name and closes', () => {
    const select = field.slice(field.indexOf('function selectDestination'), field.indexOf('function close'));
    expect(select).toContain('onChange(name)');
    expect(select).toContain('setOpen(false)');
  });
  it('a closed field still opens on Enter/ArrowDown (keyboard accessibility preserved)', () => {
    expect(field).toMatch(/!open && \(event\.key === 'ArrowDown' \|\| event\.key === 'Enter'\)/);
  });
  it('closing still commits any uncommitted typed text', () => {
    const close = field.slice(field.indexOf('function close'), field.indexOf('return ('));
    expect(close).toContain('onChange(typed)');
  });
});

describe('homepage Transport tab sends the stored vehicle category', () => {
  it('resolves the dropdown name before building the /transport URL', () => {
    const transport = panel.slice(panel.indexOf("case 'Transport': {"), panel.indexOf("case 'Travel Experts'"));
    expect(transport).toContain('resolveChauffeurVehicleParam(travelStyle)');
    expect(transport).toContain('vehicle: resolvedVehicle.value');
    expect(transport).not.toContain('vehicle: travelStyle');
    expect(transport).toContain("searched: '1'");
  });
});
