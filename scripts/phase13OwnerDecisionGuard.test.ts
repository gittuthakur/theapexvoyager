import { describe, expect, it } from 'vitest';
import { PHASE13_SLUGS, assertInventory, assertReadOnlyArguments, assertUnchanged, buildProposal, evaluateProposal, findDraftPublicLeaks, fingerprint, type RecordData } from './phase13OwnerDecisionGuard';

const target = (slug = PHASE13_SLUGS[0]): RecordData => ({ slug, name: slug === PHASE13_SLUGS[4] ? 'Uttarakhand Honeymoon Circuit' : slug, status: 'draft', duration: '3 Nights / 4 Days', startingCity: 'Gateway', endingCity: 'Gateway', itinerary: [], inclusions: [] });
const inventory = (): RecordData[] => [...PHASE13_SLUGS.map(target), ...Array.from({ length: 7 }, (_, i) => ({ slug: `other-draft-${i}`, status: 'draft' })), ...Array.from({ length: 28 }, (_, i) => ({ slug: `live-${i}`, status: 'published' }))];

describe('Phase 13 read-only decision boundary', () => {
  it('resolves exactly five verified targets from the 40-record inventory', () => {
    expect(assertInventory(inventory()).map(row => row.slug)).toEqual(PHASE13_SLUGS);
    expect(() => assertInventory(inventory().slice(1))).toThrow();
    const renamed = inventory(); renamed[4].name = 'Different honeymoon';
    expect(() => assertInventory(renamed)).toThrow('identity');
  });
  it('rejects a published target even when total publication counts still match', () => {
    const rows = inventory(); rows[0].status = 'published'; rows[12].status = 'draft';
    expect(() => assertInventory(rows)).toThrow('remain draft');
  });
  it('rejects siblings outside the per-record slug allowlist', () => {
    expect(() => buildProposal(target('kashmir-winter-snow-tour'))).toThrow();
    const proposal = buildProposal(target()); proposal.slug = PHASE13_SLUGS[1];
    expect(evaluateProposal(target(), proposal).reasons).toContain('SLUG_NOT_ALLOWLISTED');
  });
  it.each(['status', 'slug', 'duration'])('protects %s even if added to both payload and allowlist', field => {
    const proposal = buildProposal(target());
    proposal.allowedFields = [...proposal.allowedFields, field];
    proposal.fields[field] = { current: null, proposed: 'changed', source: 'OWNER DECISION REQUIRED', basis: 'test' };
    expect(evaluateProposal(target(), proposal).reasons).toContain(`PROTECTED_FIELD:${field}`);
  });
  it('rejects arbitrary fields and incomplete per-field allowlists', () => {
    const proposal = buildProposal(target()); proposal.allowedFields = ['price'];
    proposal.fields.unrelated = { current: null, proposed: true, source: 'EXISTING', basis: 'test' };
    expect(evaluateProposal(target(), proposal).reasons).toContain('INVALID_FIELD_ALLOWLIST');
    expect(evaluateProposal(target(), proposal).reasons).toContain('FIELD_NOT_ALLOWLISTED:unrelated');
  });
  it('rejects execution before connecting, including an approval flag', () => {
    expect(() => assertReadOnlyArguments([])).not.toThrow();
    expect(() => assertReadOnlyArguments(['--write-report'])).not.toThrow();
    expect(() => assertReadOnlyArguments(['--execute'])).toThrow('EXECUTION_DISABLED');
    expect(() => assertReadOnlyArguments(['--execute', '--owner-approved'])).toThrow('EXECUTION_DISABLED');
    expect(evaluateProposal(target(), buildProposal(target())).action).toBe('REFUSED');
  });
  it('detects concurrent changes including route content and commercial values', () => {
    const row = target(); const proposal = buildProposal(row);
    row.price = 9999;
    expect(evaluateProposal(row, proposal).reasons).toContain('SOURCE_CONFLICT');
    expect(() => assertUnchanged(proposal.expected, row)).toThrow('SOURCE_CONFLICT');
  });
  it('generates stable proposals without mutating input or approving old prices', () => {
    const row = target(PHASE13_SLUGS[4]); const original = structuredClone(row);
    expect(buildProposal(row)).toEqual(buildProposal(row));
    expect(row).toEqual(original);
    expect(buildProposal(row).fields.price).toMatchObject({ current: null, proposed: 17999, source: 'OWNER DECISION REQUIRED' });
    expect(buildProposal(target()).fields.price.proposed).toBeNull();
    expect(fingerprint({ a: 1, b: 2 })).toBe(fingerprint({ b: 2, a: 1 }));
  });
  it('detects public catalogue and sitemap leaks for any draft', () => {
    expect(findDraftPublicLeaks([...PHASE13_SLUGS], [], []).isolated).toBe(true);
    expect(findDraftPublicLeaks([...PHASE13_SLUGS], [PHASE13_SLUGS[0]], []).isolated).toBe(false);
    expect(findDraftPublicLeaks([...PHASE13_SLUGS], [], [`https://example.com/journeys/${PHASE13_SLUGS[4]}`]).isolated).toBe(false);
  });
});
