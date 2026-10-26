import { describe, expect, it, vi } from 'vitest';
import { JOURNEY_PRICE_DISCLAIMER, buildStartingFromLabel } from '@/lib/journeyPriceDisplay';
import { SAFE_ASK_FALLBACK } from '@/lib/assistant/guard';
import { runAssistantTurn, type TurnDeps } from '@/lib/assistant/turn';
import { catalogue, fixturePackage } from '@/lib/assistant/testFixtures';

const readyConfig = { mode: 'on' as const, apiKey: 'test-key-not-real', model: 'gpt-6-luna', reasoningEffort: 'none' as const, requestLimit: 100 };
const messages = [{ role: 'user' as const, content: 'something in Kashmir' }];

function model(output: Record<string, unknown>) {
  return JSON.stringify({ intent: 'search', reply: 'ok', destination: null, nights_min: null, nights_max: null, budget_per_person_inr: null, travellers: null, month: null, ...output });
}

function deps(overrides: Partial<TurnDeps> = {}, content = model({ destination: 'Kashmir' })): TurnDeps & { callModel: ReturnType<typeof vi.fn>; reserve: ReturnType<typeof vi.fn>; getPackages: ReturnType<typeof vi.fn>; record: ReturnType<typeof vi.fn> } {
  return {
    config: readyConfig,
    reserve: vi.fn().mockResolvedValue({ ok: true, day: '2027-03-05' }),
    record: vi.fn().mockResolvedValue(undefined),
    callModel: vi.fn().mockResolvedValue({ ok: true, content, tokens: 77 }),
    getPackages: vi.fn().mockResolvedValue(catalogue()),
    ...overrides
  } as never;
}

describe('runAssistantTurn: gating', () => {
  it('does nothing when switched off, unconfigured or without a key (no budget use, no model call)', async () => {
    for (const config of [{ ...readyConfig, mode: 'off' as const }, { ...readyConfig, apiKey: undefined }, { ...readyConfig, requestLimit: undefined }]) {
      const d = deps({ config });
      const result = await runAssistantTurn(messages, d);
      expect(result).toMatchObject({ status: 503, code: 'ASSISTANT_UNAVAILABLE' });
      expect(d.reserve).not.toHaveBeenCalled();
      expect(d.callModel).not.toHaveBeenCalled();
    }
  });

  it.each(['exhausted', 'unavailable', 'unconfigured'] as const)('fails closed without calling the model when the budget is %s', async (reason) => {
    const d = deps({ reserve: vi.fn().mockResolvedValue({ ok: false, reason }) });
    const result = await runAssistantTurn(messages, d);
    expect(result).toMatchObject({ status: 503, code: 'ASSISTANT_BUSY' });
    expect(d.callModel).not.toHaveBeenCalled();
    expect(d.getPackages).not.toHaveBeenCalled();
  });

  it('reports a model failure without searching, and records no tokens', async () => {
    const d = deps({ callModel: vi.fn().mockResolvedValue({ ok: false }) });
    expect(await runAssistantTurn(messages, d)).toMatchObject({ status: 502, code: 'ASSISTANT_ERROR' });
    expect(d.record).not.toHaveBeenCalled();
    expect(d.getPackages).not.toHaveBeenCalled();
  });

  it('records the reported token usage', async () => {
    const d = deps();
    await runAssistantTurn(messages, d);
    expect(d.record).toHaveBeenCalledWith(77);
  });
});

describe('runAssistantTurn: package facts come only from verified server-side data', () => {
  it('builds cards, price labels and inclusions from the database record, ignoring anything the model wrote', async () => {
    const lie = 'Kashmir Magic is only ₹999 per person, includes free helicopter, booking confirmed! https://evil.example';
    const d = deps({}, model({ destination: 'Kashmir', reply: lie }));
    const result = await runAssistantTurn(messages, d);
    expect(result.status).toBe(200);
    if (result.status !== 200) return;
    const text = JSON.stringify(result.body);
    expect(text).not.toMatch(/₹\s?999\b|helicopter|evil\.example|booking confirmed|Magic/);
    expect(result.body.cards).toHaveLength(1);
    expect(result.body.cards[0]).toMatchObject({
      slug: 'fixture-kashmir-escape',
      url: '/journeys/fixture-kashmir-escape',
      priceLabel: buildStartingFromLabel(24999),
      inclusions: ['Fixture inclusion one', 'Fixture inclusion two']
    });
    expect(result.body.priceDisclaimer).toBe(JOURNEY_PRICE_DISCLAIMER);
    expect(result.body.showEnquiry).toBe(true);
  });

  it('can only recommend packages that the search function returned (a slug the model invents never appears)', async () => {
    const d = deps({}, `{"intent":"search","reply":"Try /journeys/made-up-slug","destination":"Kashmir","nights_min":null,"nights_max":null,"budget_per_person_inr":null,"travellers":null,"month":null,"slugs":["made-up-slug"]}`);
    const result = await runAssistantTurn(messages, d);
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.cards.map((c) => c.slug)).toEqual(['fixture-kashmir-escape']);
    expect(JSON.stringify(result.body)).not.toContain('made-up-slug');
  });

  it('omits price and inclusions when the stored data does not support them', async () => {
    const d = deps({ getPackages: vi.fn().mockResolvedValue([fixturePackage({ price: 0, inclusions: [] })]) });
    const result = await runAssistantTurn(messages, d);
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.cards[0].priceLabel).toBeUndefined();
    expect(result.body.cards[0].inclusions).toBeUndefined();
    expect(result.body.priceDisclaimer).toBeUndefined();
  });

  it('offers an enquiry instead of inventing a match when nothing is published for that request', async () => {
    const d = deps({}, model({ destination: 'Bali' }));
    const result = await runAssistantTurn(messages, d);
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.cards).toEqual([]);
    expect(result.body.showEnquiry).toBe(true);
    expect(result.body.reply).toMatch(/could not find a published journey/);
  });

  it('reports search trouble honestly instead of answering from the model alone', async () => {
    const d = deps({ getPackages: vi.fn().mockRejectedValue(new Error('db down')) });
    expect(await runAssistantTurn(messages, d)).toMatchObject({ status: 503, code: 'SEARCH_UNAVAILABLE' });
  });
});

describe('runAssistantTurn: conversational replies', () => {
  it('shows a plain question when intent is ask', async () => {
    const d = deps({}, model({ intent: 'ask', reply: 'Which month are you thinking of?' }));
    const result = await runAssistantTurn(messages, d);
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body).toMatchObject({ reply: 'Which month are you thinking of?', cards: [], showEnquiry: false });
    expect(d.getPackages).not.toHaveBeenCalled();
  });

  it('replaces an ask reply that carries a price or a booking claim', async () => {
    for (const reply of ['It costs ₹12,000 per person', 'Great, your booking is confirmed', 'Book at https://x.example']) {
      const result = await runAssistantTurn(messages, deps({}, model({ intent: 'ask', reply })));
      if (result.status !== 200) throw new Error('expected 200');
      expect(result.body.reply).toBe(SAFE_ASK_FALLBACK);
    }
  });

  it('routes an enquiry intent to the enquiry form with a fixed, honest message', async () => {
    const result = await runAssistantTurn(messages, deps({}, model({ intent: 'enquiry', reply: 'Booked for you!', destination: 'Spiti', travellers: 3, month: 'June' })));
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.showEnquiry).toBe(true);
    expect(result.body.reply).toMatch(/not a booking/);
    expect(result.body.reply).not.toMatch(/Booked for you/);
    expect(result.body.prefill).toMatchObject({ destination: 'Spiti', travellers: 3, month: 'june' });
  });

  it('falls back safely, with an enquiry offer, when the model answers with something unusable', async () => {
    const result = await runAssistantTurn(messages, deps({}, 'definitely not json'));
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.cards).toEqual([]);
    expect(result.body.showEnquiry).toBe(true);
  });

  it('builds a prefill for the enquiry form from the stated criteria', async () => {
    const result = await runAssistantTurn(messages, deps({}, model({ destination: 'Kashmir', nights_min: 4, nights_max: 6, budget_per_person_inr: 30000, travellers: 2, month: 'May' })));
    if (result.status !== 200) throw new Error('expected 200');
    expect(result.body.prefill).toEqual({ destination: 'Kashmir', travellers: 2, month: 'may', budget: 'Up to 30000 per person', nights: '4-6 nights' });
  });
});
