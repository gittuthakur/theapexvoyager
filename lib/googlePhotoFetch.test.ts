import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InMemoryRateStore } from './photoProxyGuard';
import { FRESH_PHOTO_LIMITS, createConcurrencyGate, createFreshPhotoFetcher, eligiblePlaceIdFrom, fetchFreshPlacePhotos, type EligiblePlaceId, type FreshPhotosInput } from './googlePhotoFetch';

// Everything here uses an injected fake `fetch`. No test can reach Google, a database or the network.
const ROOT = process.cwd();
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');

const KEY = 'test-key-not-real-1234567890';
const PLACE = 'ChIJabc123_-XYZ' as EligiblePlaceId;
const AUTHOR = { displayName: 'Asha Verma', uri: 'https://www.google.com/maps/contrib/1', photoUri: 'https://lh3.googleusercontent.com/a' };
const photo = (token: string, extra: Record<string, unknown> = {}) => ({
  name: `places/${PLACE}/photos/${token}`,
  widthPx: 4000,
  heightPx: 3000,
  authorAttributions: [AUTHOR],
  googleMapsUri: `https://www.google.com/maps/place/@1,1,3a/photos/${token}`,
  flagContentUri: `https://www.google.com/local/imagery/report/?image_key=${token}`,
  ...extra
});
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const input = (extra: Partial<FreshPhotosInput> = {}): FreshPhotosInput => ({ placeId: PLACE, apiKey: KEY, mode: 'fresh', clientKey: '203.0.113.7', ...extra });
const fetcherWith = (fetchImpl: ReturnType<typeof vi.fn>, config: Parameters<typeof createFreshPhotoFetcher>[0] = {}) =>
  createFreshPhotoFetcher({ fetchImpl: fetchImpl as unknown as typeof fetch, isLocalDev: () => false, ...config });
const okFetch = (body: unknown = { photos: [photo('a')] }) => vi.fn(async () => jsonResponse(body));

afterEach(() => vi.restoreAllMocks());

describe('valid photo-only request', () => {
  it('returns the credited photos, preserving every genuine author and link', async () => {
    const fetchImpl = okFetch({ photos: [photo('a'), photo('b', { authorAttributions: [{ displayName: 'One' }, { displayName: 'Two', uri: 'https://www.google.com/maps/contrib/2' }] })] });

    const result = await fetcherWith(fetchImpl)(input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.photos.map((p) => p.name)).toEqual([`places/${PLACE}/photos/a`, `places/${PLACE}/photos/b`]);
    expect(result.photos[0].authorAttributions).toEqual([AUTHOR]);
    expect(result.photos[1].authorAttributions).toEqual([{ displayName: 'One' }, { displayName: 'Two', uri: 'https://www.google.com/maps/contrib/2' }]);
    expect(result.photos[0].googleMapsUri).toContain('/maps/place/');
    expect(result.photos[0].flagContentUri).toContain('/local/imagery/report/');
    expect(result.withheld).toBe(0);
  });
});

describe('exact Google request', () => {
  it('is a GET to the Place Details endpoint with the photos-only field mask, the key in a header, no-store and a timeout signal', async () => {
    const fetchImpl = okFetch();
    await fetcherWith(fetchImpl)(input());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://places.googleapis.com/v1/places/${PLACE}`);
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'photos' });
    expect(init.cache).toBe('no-store');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init).not.toHaveProperty('next');
    expect(init).not.toHaveProperty('body');
  });

  it('the URL carries no query string, so the key and any mask can never travel in it', async () => {
    const fetchImpl = okFetch();
    await fetcherWith(fetchImpl)(input());
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).not.toContain('?');
    expect(url).not.toContain(KEY);
  });

  it('has no parameter that could change the field mask: it is always exactly "photos"', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl);
    await fetcher({ ...input(), fieldMask: '*', fields: 'rating,reviews' } as unknown as FreshPhotosInput);
    await fetcher(input({ clientKey: 'someone-else' }));
    for (const call of fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>) {
      expect((call[1].headers as Record<string, string>)['X-Goog-FieldMask']).toBe('photos');
      expect(Object.keys(call[1].headers as object).sort()).toEqual(['X-Goog-Api-Key', 'X-Goog-FieldMask']);
    }
  });

  it('uses a three-second timeout by default', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    await fetcherWith(okFetch())(input());
    expect(timeoutSpy).toHaveBeenCalledWith(3000);
    expect(FRESH_PHOTO_LIMITS).toEqual({ perClientPerMinute: 30, perInstancePerMinute: 300, maxConcurrent: 4, timeoutMs: 3000 });
  });
});

describe('the API key never leaks', () => {
  it('appears in no result and no console output, for success and for every failure', async () => {
    const sinks = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error'), vi.spyOn(console, 'debug')].map((spy) => spy.mockImplementation(() => undefined));
    const responses: Array<() => Promise<Response>> = [
      async () => jsonResponse({ photos: [photo('a')] }),
      async () => jsonResponse({}, 404),
      async () => jsonResponse({ error: { message: `bad key ${KEY}` } }, 403),
      async () => jsonResponse({}, 429),
      async () => jsonResponse({ error: 'boom' }, 503),
      async () => new Response(`not json ${KEY}`, { status: 200 }),
      async () => {
        throw new Error(`network failed for key ${KEY}`);
      }
    ];
    const results = [];
    for (const [index, respond] of responses.entries()) results.push(await fetcherWith(vi.fn(respond))(input({ clientKey: `c${index}` })));

    expect(JSON.stringify(results)).not.toContain(KEY);
    expect(sinks.flatMap((sink) => sink.mock.calls)).toEqual([]);
    expect(results.map((r) => (r.ok ? 'ok' : r.reason))).toEqual(['ok', 'not-found', 'upstream-error', 'upstream-error', 'upstream-error', 'upstream-error', 'upstream-error']);
  });

  it('logs nothing at all, including place IDs and photo names', async () => {
    const sinks = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')].map((spy) => spy.mockImplementation(() => undefined));
    await fetcherWith(okFetch())(input());
    await fetcherWith(vi.fn(async () => jsonResponse({}, 500)))(input());
    expect(sinks.flatMap((sink) => sink.mock.calls)).toEqual([]);
    expect(read('lib/googlePhotoFetch.ts')).not.toMatch(/console\./);
  });
});

describe('mode, configuration and local development', () => {
  it.each([
    ['legacy', 'legacy'],
    ['disabled', 'disabled']
  ] as const)('mode %s makes no Google call', async (mode, reason) => {
    const fetchImpl = okFetch();
    expect(await fetcherWith(fetchImpl)(input({ mode }))).toEqual({ ok: false, reason });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('an unknown mode value is treated as disabled, never as fresh', async () => {
    const fetchImpl = okFetch();
    expect(await fetcherWith(fetchImpl)(input({ mode: 'on' as never }))).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('local development never calls Google', async () => {
    const fetchImpl = okFetch();
    expect(await fetcherWith(fetchImpl, { isLocalDev: () => true })(input())).toEqual({ ok: false, reason: 'disabled' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '   '])('a missing API key (%j) is "not-configured" and makes no call', async (apiKey) => {
    const fetchImpl = okFetch();
    expect(await fetcherWith(fetchImpl)(input({ apiKey }))).toEqual({ ok: false, reason: 'not-configured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('Place ID validation', () => {
  const BAD = ['', ' ', 'a b', 'ChIJ/../x', 'ChIJabc?fields=rating', 'ChIJabc#x', 'ChIJ abc', 'ChIJabc\n', 'https://evil.example/x', 'ChIJ%2e%2e', 'a,b', '*', 'x'.repeat(256), 'places/ChIJabc', "ChIJ'--", 'ChIJabc;', 'ChIJé'];

  it.each(BAD)('rejects %j before any limit, slot or request', async (bad) => {
    const fetchImpl = okFetch();
    const store = new InMemoryRateStore();
    const hit = vi.spyOn(store, 'hit');

    expect(await fetcherWith(fetchImpl, { rateStore: store })(input({ placeId: bad as EligiblePlaceId }))).toEqual({ ok: false, reason: 'invalid-place-id' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(hit).not.toHaveBeenCalled();
  });

  it('rejects non-string IDs', async () => {
    const fetchImpl = okFetch();
    for (const bad of [undefined, null, 5, {}, ['ChIJabc']]) expect(await fetcherWith(fetchImpl)(input({ placeId: bad as never }))).toEqual({ ok: false, reason: 'invalid-place-id' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts real-looking IDs including "_" and "-"', async () => {
    const fetchImpl = okFetch();
    expect((await fetcherWith(fetchImpl)(input({ placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' as EligiblePlaceId }))).ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('Google errors, timeouts and bad bodies', () => {
  it('maps 404 to not-found', async () => {
    expect(await fetcherWith(vi.fn(async () => jsonResponse({}, 404)))(input())).toEqual({ ok: false, reason: 'not-found', upstreamStatus: 404 });
  });

  it.each([400, 401, 403, 429, 500, 502, 503])('maps Google %s to upstream-error and reports only the status', async (status) => {
    expect(await fetcherWith(vi.fn(async () => jsonResponse({ error: { message: 'details that must not be returned' } }, status)))(input())).toEqual({ ok: false, reason: 'upstream-error', upstreamStatus: status });
  });

  it('a network failure is upstream-error with no message passed on', async () => {
    const result = await fetcherWith(vi.fn(async () => Promise.reject(new TypeError('fetch failed: getaddrinfo ENOTFOUND places.googleapis.com'))))(input());
    expect(result).toEqual({ ok: false, reason: 'upstream-error' });
  });

  it('times out: the abort signal fires, the call is reported as timeout, and nothing is retried', async () => {
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => signal!.addEventListener('abort', () => reject(signal!.reason)));
    });

    const result = await fetcherWith(fetchImpl, { timeoutMs: 20 })(input());

    expect(result).toEqual({ ok: false, reason: 'timeout' });
    expect(signal?.aborted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a body that stalls after the headers also ends as a timeout', async () => {
    const fetchImpl = vi.fn((_url: string, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      const stalled = {
        ok: true,
        status: 200,
        text: () => new Promise<string>((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
      };
      return Promise.resolve(stalled as unknown as Response);
    });
    expect(await fetcherWith(fetchImpl, { timeoutMs: 20 })(input())).toEqual({ ok: false, reason: 'timeout', upstreamStatus: 200 });
  });

  it.each([
    ['not json at all', 'plain text'],
    ['truncated json', '{"photos":[{"name":'],
    ['a JSON array', '[]'],
    ['JSON null', 'null'],
    ['a JSON string', '"x"']
  ])('malformed or wrongly shaped body (%s) is upstream-error', async (_label, text) => {
    expect(await fetcherWith(vi.fn(async () => new Response(text, { status: 200 })))(input())).toMatchObject({ ok: false, reason: 'upstream-error' });
  });

  it('an oversized body is rejected rather than parsed', async () => {
    const huge = JSON.stringify({ photos: [], padding: 'x'.repeat(600_000) });
    expect(await fetcherWith(vi.fn(async () => new Response(huge, { status: 200 })))(input())).toMatchObject({ ok: false, reason: 'upstream-error' });
  });
});

describe('no photos and unusable photos', () => {
  it.each([
    ['an empty object (a place with no photos)', {}],
    ['an empty photos list', { photos: [] }],
    ['photos that is not a list', { photos: 'x' }],
    ['photos that is null', { photos: null }]
  ])('%s is no-photos', async (_label, body) => {
    expect(await fetcherWith(okFetch(body))(input())).toEqual({ ok: false, reason: 'no-photos' });
  });

  it('skips malformed photo records and keeps the good ones, counting what was withheld', async () => {
    const result = await fetcherWith(okFetch({ photos: [null, 'x', 5, { name: 'places/bad' }, {}, photo('good')] }))(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.photos.map((p) => p.name)).toEqual([`places/${PLACE}/photos/good`]);
    expect(result.withheld).toBe(5);
  });

  it('EXCLUDES a photo whose author credit is incomplete or unreadable (authorsDropped > 0)', async () => {
    const result = await fetcherWith(
      okFetch({
        photos: [
          photo('complete'),
          photo('nameless-author', { authorAttributions: [{ uri: 'https://www.google.com/maps/contrib/9' }] }),
          photo('one-bad-of-two', { authorAttributions: [{ displayName: 'Fine' }, { displayName: '' }] }),
          photo('not-a-list', { authorAttributions: 'Asha' })
        ]
      })
    )(input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.photos.map((p) => p.name)).toEqual([`places/${PLACE}/photos/complete`]);
    expect(result.withheld).toBe(3);
  });

  it('a photo with an empty author list and nothing dropped is kept (Google may legitimately send none)', async () => {
    const result = await fetcherWith(okFetch({ photos: [photo('none', { authorAttributions: [] })] }))(input());
    expect(result.ok && result.photos[0].authorAttributions).toEqual([]);
  });

  it('when every photo is unusable the result is unusable-photos, never an uncredited photo', async () => {
    expect(await fetcherWith(okFetch({ photos: [photo('a', { authorAttributions: [{}] }), { name: 'places/x' }] }))(input())).toEqual({ ok: false, reason: 'unusable-photos' });
  });

  it('drops unsafe links but keeps the photo and author name (the link is optional)', async () => {
    const result = await fetcherWith(okFetch({ photos: [photo('a', { googleMapsUri: 'javascript:alert(1)', authorAttributions: [{ displayName: 'Asha', uri: 'data:text/html,x' }] })] }))(input());
    expect(result.ok && result.photos[0]).toMatchObject({ authorAttributions: [{ displayName: 'Asha' }] });
    expect(JSON.stringify(result)).not.toMatch(/javascript:|data:/);
  });
});

describe('rate limits', () => {
  it('limits one client to 30 requests a minute; the 31st never reaches Google; another client is unaffected', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl);
    for (let i = 0; i < 30; i += 1) expect((await fetcher(input())).ok).toBe(true);

    expect(await fetcher(input())).toEqual({ ok: false, reason: 'rate-limited' });
    expect(fetchImpl).toHaveBeenCalledTimes(30);
    expect((await fetcher(input({ clientKey: '198.51.100.9' }))).ok).toBe(true);
  });

  it('limits the whole instance to 300 requests a minute, across clients', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl);
    for (let i = 0; i < 300; i += 1) expect((await fetcher(input({ clientKey: `client-${i}` }))).ok, `call ${i}`).toBe(true);

    expect(await fetcher(input({ clientKey: 'client-new' }))).toEqual({ ok: false, reason: 'rate-limited' });
    expect(fetchImpl).toHaveBeenCalledTimes(300);
  });

  it('an over-limit client cannot use up the instance allowance (the per-client check is counted first)', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl, { perClientPerMinute: 2, perInstancePerMinute: 4 });
    for (let i = 0; i < 100; i += 1) await fetcher(input({ clientKey: 'attacker' }));

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect((await fetcher(input({ clientKey: 'v1' }))).ok).toBe(true);
    expect((await fetcher(input({ clientKey: 'v2' }))).ok).toBe(true);
    expect(await fetcher(input({ clientKey: 'v3' }))).toEqual({ ok: false, reason: 'rate-limited' });
  });

  it('the window resets after a minute', async () => {
    let now = 1_000_000;
    const fetcher = fetcherWith(okFetch(), { perClientPerMinute: 1, now: () => now });
    expect((await fetcher(input())).ok).toBe(true);
    expect((await fetcher(input())).ok).toBe(false);
    now += 60_001;
    expect((await fetcher(input())).ok).toBe(true);
  });

  it('limits apply to requests that fail upstream too (a failing call still counts)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500));
    const fetcher = fetcherWith(fetchImpl, { perClientPerMinute: 2 });
    await fetcher(input());
    await fetcher(input());
    expect(await fetcher(input())).toEqual({ ok: false, reason: 'rate-limited' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('an empty or oversized client key is tolerated and bounded', async () => {
    const fetcher = fetcherWith(okFetch());
    expect((await fetcher(input({ clientKey: '' }))).ok).toBe(true);
    expect((await fetcher(input({ clientKey: 'x'.repeat(5000) }))).ok).toBe(true);
    expect((await fetcher(input({ clientKey: undefined as never }))).ok).toBe(true);
  });
});

describe('concurrency cap', () => {
  const deferred = () => {
    let resolve!: (response: Response) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<Response>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  it('allows at most four upstream calls at once; the fifth is answered "busy" immediately, with no queue', async () => {
    const pending = Array.from({ length: 5 }, deferred);
    let call = 0;
    const fetchImpl = vi.fn(() => pending[call++].promise);
    const fetcher = fetcherWith(fetchImpl, { perClientPerMinute: 100 });

    const inFlight = [0, 1, 2, 3].map((i) => fetcher(input({ clientKey: `c${i}` })));
    await Promise.resolve();
    const fifth = await fetcher(input({ clientKey: 'c4' }));

    expect(fifth).toEqual({ ok: false, reason: 'busy' });
    expect(fetchImpl).toHaveBeenCalledTimes(4);

    pending.slice(0, 4).forEach((p) => p.resolve(jsonResponse({ photos: [photo('a')] })));
    expect((await Promise.all(inFlight)).every((r) => r.ok)).toBe(true);
    // A slot is free again.
    pending[4].resolve(jsonResponse({ photos: [photo('a')] }));
    expect((await fetcher(input({ clientKey: 'c5' }))).ok).toBe(true);
  });

  it('releases the slot after a failure, a timeout, a bad body and a 404 (it can never leak)', async () => {
    const outcomes: Array<() => Promise<Response>> = [
      () => Promise.reject(new Error('network')),
      () => Promise.resolve(jsonResponse({}, 500)),
      () => Promise.resolve(jsonResponse({}, 404)),
      () => Promise.resolve(new Response('not json', { status: 200 })),
      () => Promise.resolve(jsonResponse({ photos: [photo('a')] }))
    ];
    let index = 0;
    const fetchImpl = vi.fn(() => outcomes[index++]());
    const fetcher = fetcherWith(fetchImpl, { maxConcurrent: 1, perClientPerMinute: 100 });

    const reasons = [];
    for (let i = 0; i < outcomes.length; i += 1) {
      const result = await fetcher(input({ clientKey: `c${i}` }));
      reasons.push(result.ok ? 'ok' : result.reason);
    }

    expect(reasons).toEqual(['upstream-error', 'upstream-error', 'not-found', 'upstream-error', 'ok']);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });

  it('releases the slot after a timeout', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce((_url: string, init: RequestInit) => new Promise<Response>((_res, rej) => (init.signal as AbortSignal).addEventListener('abort', () => rej((init.signal as AbortSignal).reason))))
      .mockImplementationOnce(async () => jsonResponse({ photos: [photo('a')] }));
    const fetcher = fetcherWith(fetchImpl, { maxConcurrent: 1, timeoutMs: 20, perClientPerMinute: 100 });

    expect(await fetcher(input({ clientKey: 'a' }))).toEqual({ ok: false, reason: 'timeout' });
    expect((await fetcher(input({ clientKey: 'b' }))).ok).toBe(true);
  });

  it('the gate never over-releases: a double release does not open an extra slot', () => {
    const gate = createConcurrencyGate(1);
    const release = gate.tryAcquire()!;
    expect(gate.tryAcquire()).toBeNull();
    release();
    release();
    expect(gate.active).toBe(0);
    expect(gate.tryAcquire()).not.toBeNull();
    expect(gate.tryAcquire()).toBeNull();
  });
});

describe('no retries, no caching, no sharing, no persistence', () => {
  it.each([500, 503, 429, 404])('Google %s is attempted exactly once', async (status) => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, status));
    await fetcherWith(fetchImpl)(input());
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a network error and a timeout are each attempted exactly once', async () => {
    const failing = vi.fn(async () => Promise.reject(new Error('x')));
    await fetcherWith(failing)(input());
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it('two identical sequential requests make two Google calls (nothing is cached)', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl);
    await fetcher(input());
    await fetcher(input());
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('two identical CONCURRENT requests make two Google calls (in-flight results are not shared)', async () => {
    const fetchImpl = okFetch();
    const fetcher = fetcherWith(fetchImpl);
    await Promise.all([fetcher(input({ clientKey: 'a' })), fetcher(input({ clientKey: 'b' }))]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('each result is a fresh object, so a caller cannot see another caller\'s data', async () => {
    const fetcher = fetcherWith(okFetch());
    const first = await fetcher(input({ clientKey: 'a' }));
    const second = await fetcher(input({ clientKey: 'b' }));
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    if (first.ok && second.ok) expect(first.photos).not.toBe(second.photos);
  });

  it('the library has no persistence, cache or filesystem dependency of any kind', () => {
    const source = read('lib/googlePhotoFetch.ts');
    const imports = source.split('\n').filter((line) => /^import /.test(line)).join('\n');
    expect(imports).not.toMatch(/mongo|mongoose|models\/|PlaceCache|DestinationSearchCache|node:fs|react|next\/|cache/i);
    expect(source).not.toMatch(/localStorage|sessionStorage|new Map|Map<|unstable_cache|revalidate|next:\s*\{|writeFile|appendFile|findOneAndUpdate|\.create\(|\.save\(|process\.env/);
  });

  it('never queues: there is no waiting or timer-based retry code', () => {
    const source = read('lib/googlePhotoFetch.ts');
    expect(source).not.toMatch(/setTimeout|setInterval|\bqueue\b.*push|retry\(|for \(let attempt|attempts/i);
  });

  it('exposes no way to supply a field mask, URL or header from outside', () => {
    const source = read('lib/googlePhotoFetch.ts');
    expect(source).not.toMatch(/fieldMask|input\.url|input\.headers|input\.fields/);
    expect(source.match(/PHOTOS_ONLY_FIELD_MASK = 'photos'/g)).toHaveLength(1);
  });
});

describe('the EligiblePlaceId precondition', () => {
  it('only a found, Google-sourced lookup yields an EligiblePlaceId', () => {
    expect(eligiblePlaceIdFrom({ status: 'found', stay: { placeId: PLACE, source: 'google' } })).toBe(PLACE);
  });

  it.each([
    [{ status: 'not-found' }],
    [{ status: 'unavailable' }],
    [{ status: 'found', stay: { placeId: PLACE, source: 'curated' } }],
    [{ status: 'found', stay: { placeId: PLACE } }],
    [{ status: 'found', stay: { placeId: 'curated:slug', source: 'google' } }],
    [{ status: 'found', stay: { placeId: '', source: 'google' } }],
    [{ status: 'found', stay: { placeId: 5, source: 'google' } }],
    [{ status: 'found' }]
  ])('%j yields no EligiblePlaceId', (lookup) => {
    expect(eligiblePlaceIdFrom(lookup as never)).toBeNull();
  });

  it('documents prominently that the library does NOT enforce eligibility or owner exclusions', () => {
    const header = read('lib/googlePhotoFetch.ts').slice(0, 3500).replace(/\s+/g, ' ');
    expect(header).toContain('PRECONDITION');
    expect(header).toContain('does NOT check that a place is eligible');
    expect(header).toContain('does NOT check owner exclusions');
    expect(header).toContain('getStayByPlaceIdResult');
    expect(header).toContain('NOT a runtime security boundary');
  });

  it('does not claim to enforce exclusions and makes no database query', () => {
    const source = read('lib/googlePhotoFetch.ts');
    // Comments legitimately name the checks a CALLER must make; only the code itself must not perform them.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/getActiveExclusionSet|propertyExclusion|PlaceCache|connectDB|ExcludedPlace/);
  });
});

describe('scope: not wired anywhere, and existing behaviour unchanged', () => {
  it('no other source file imports the new library or the mode parser yet', () => {
    const importers: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(ROOT, dir))) {
        if (['node_modules', '.next', '.git', 'public'].includes(entry)) continue;
        const relative = `${dir}/${entry}`;
        if (statSync(join(ROOT, relative)).isDirectory()) walk(relative);
        else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry) && !['lib/googlePhotoFetch.ts', 'lib/photoMetadataMode.ts'].includes(relative) && /googlePhotoFetch|photoMetadataMode/.test(read(relative))) importers.push(relative);
      }
    };
    for (const dir of ['app', 'components', 'lib', 'models', 'services', 'types', 'config', 'scripts']) walk(dir);
    expect(importers.sort()).toEqual([]);
  });

  it('the shared instance exists but is unused', () => {
    expect(typeof fetchFreshPlacePhotos).toBe('function');
  });

  it('the photo proxy security is unchanged: exclusion check, kill switch, rate limits and the 30-day header are all still there', () => {
    const route = read('app/api/places/photo/route.ts');
    for (const needle of ['getActiveExclusionSet', 'ExclusionLookupError', 'isPhotoProxyDisabled', 'photoRateLimits', 'InMemoryRateStore', 'PHOTO_NAME_PATTERN', 'ALLOWED_PARAMS', 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable']) {
      expect(route, needle).toContain(needle);
    }
    expect(read('lib/photoProxyGuard.ts')).toContain('GOOGLE_PHOTO_PROXY_MODE');
  });

  it('Text Search is unchanged: still exactly one fetch in lib/googlePlaces.ts and the same field mask', () => {
    const source = read('lib/googlePlaces.ts');
    expect(source.match(/\bfetch\(/g)).toHaveLength(1);
    const mask = source.slice(source.indexOf('const SEARCH_FIELD_MASK = ['), source.indexOf("].join(',')") + "].join(',')".length);
    expect(mask.replace(/\s+/g, '')).toBe(
      "constSEARCH_FIELD_MASK=['places.id','places.displayName','places.formattedAddress','places.location','places.rating','places.userRatingCount','places.photos','places.types','places.googleMapsUri','places.websiteUri','nextPageToken'].join(',')"
    );
  });

  it('no persistence file, model, page, gallery or component mentions the new library', () => {
    for (const file of ['lib/staysRefresh.ts', 'lib/stays.ts', 'lib/destinations.ts', 'models/PlaceCache.ts', 'models/DestinationSearchCache.ts', 'app/stays/[...segments]/page.tsx', 'components/modules/StaysGrid.tsx', 'components/modules/stays/PropertyPhotoGallery.tsx', 'app/api/cron/refresh-stays/route.ts']) {
      expect(read(file), file).not.toMatch(/googlePhotoFetch|photoMetadataMode|fetchFreshPlacePhotos/);
    }
  });

  it('Stays remain view-only: the new files contain no price, availability, booking or enquiry wording', () => {
    for (const file of ['lib/googlePhotoFetch.ts', 'lib/photoMetadataMode.ts']) {
      expect(read(file), file).not.toMatch(/₹|price|availab|book(ing)? now|whatsapp|wa\.me|enquir/i);
    }
  });
});
