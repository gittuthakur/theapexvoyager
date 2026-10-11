import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// DOM-free contract checks (this repo has no jsdom). They pin the structure behind the Phase A
// Enter/clear fix and the Phase B committed-value display; real keyboard/mouse behaviour is
// verified in Chromium (see the Phase B QA report).
const field = readFileSync(join(process.cwd(), 'components', 'modules', 'search', 'DestinationField.tsx'), 'utf8').replace(/\r\n/g, '\n');
const panel = readFileSync(join(process.cwd(), 'components', 'GlobalSearchFilter.tsx'), 'utf8').replace(/\r\n/g, '\n');

describe('DestinationField commits typed text to its parent immediately (Phase A Enter / clear)', () => {
  it('the input onChange handler forwards the typed value to the parent onChange', () => {
    const handler = field.slice(field.indexOf('onChange={(event) => {'), field.indexOf('placeholder={placeholder}'));
    expect(handler).toContain('setTouched(true)');
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
  it('closing no longer needs to commit (already committed) and never blanks the value', () => {
    const close = field.slice(field.indexOf('function close'), field.indexOf('return ('));
    expect(close).toContain('setOpen(false)');
    expect(close).not.toMatch(/onChange\(''\)/);
  });
});

describe('DestinationField shows the committed value consistently (Phase B)', () => {
  it('the input always renders the committed value, never an empty-looking blank while open', () => {
    expect(field).toContain('value={value}');
    expect(field).not.toMatch(/value=\{open \? query : value\}/);
  });
  it('opening selects the committed text so typing replaces it and Backspace clears it', () => {
    const click = field.slice(field.indexOf('onClick={(event) => {'), field.indexOf('onKeyDown'));
    expect(click).toContain('setOpen(true)');
    expect(click).toContain('event.currentTarget.select()');
  });
  it('suggestions stay unfiltered until the visitor types, so a committed value does not hide the other destinations', () => {
    const filtered = field.slice(field.indexOf('const filtered = useMemo'), field.indexOf('function selectDestination'));
    expect(filtered).toContain('if (!touched || !needle) return destinations;');
    expect(filtered).toContain('[destinations, value, touched]');
  });
});

describe('homepage panel wiring', () => {
  it('builds every tab URL through the tested buildGlobalSearchTarget contract', () => {
    expect(panel).toContain('buildGlobalSearchTarget(');
    expect(panel).toContain('toSearchUrl({ path, params, hash })');
  });
  it('Stays and Journeys hide the rooms and pets controls that have no consumer', () => {
    const matches = panel.match(/<OccupancyField value=\{occupancy\} onChange=\{setOccupancy\} showRooms=\{false\} showPets=\{false\} \/>/g) ?? [];
    expect(matches).toHaveLength(2);
  });
});
