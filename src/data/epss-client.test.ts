import { chunk, fetchEpssScores, parseEpssResponse } from '@/data/epss-client';

describe('parseEpssResponse', () => {
  it('converts string scores to numbers', () => {
    const json = {
      status: 'OK',
      data: [{ cve: 'CVE-2021-44228', epss: '0.999990000', percentile: '1.000000000', date: '2026-10-08' }],
    };
    expect(parseEpssResponse(json)).toEqual([
      { cveId: 'CVE-2021-44228', epss: 0.99999, percentile: 1, date: '2026-10-08' },
    ]);
  });

  it.each([
    ['out-of-range probability', { cve: 'CVE-2021-12345', epss: '1.5', percentile: '0.5' }],
    ['non-numeric probability', { cve: 'CVE-2021-12345', epss: 'high', percentile: '0.5' }],
    ['NaN percentile', { cve: 'CVE-2021-12345', epss: '0.5', percentile: 'NaN' }],
    ['a null probability', { cve: 'CVE-2021-12345', epss: null, percentile: '0.5' }],
    ['an empty-string probability', { cve: 'CVE-2021-12345', epss: '', percentile: '0.5' }],
    ['a boolean probability', { cve: 'CVE-2021-12345', epss: true, percentile: '0.5' }],
    ['an array probability', { cve: 'CVE-2021-12345', epss: [], percentile: '0.5' }],
    ['a hex-string probability', { cve: 'CVE-2021-12345', epss: '0x1', percentile: '0.5' }],
    ['a bogus CVE id', { cve: 'not-a-cve', epss: '0.5', percentile: '0.5' }],
  ])('drops a row with %s', (_label, bad) => {
    expect(parseEpssResponse({ data: [bad] })).toEqual([]);
  });

  it('accepts plain numbers as well as numeric strings', () => {
    expect(parseEpssResponse({ data: [{ cve: 'CVE-2021-12345', epss: 0.25, percentile: '0.9' }] })).toEqual([
      { cveId: 'CVE-2021-12345', epss: 0.25, percentile: 0.9, date: '' },
    ]);
  });

  it('throws when the response has no data array', () => {
    expect(() => parseEpssResponse({ status: 'error' })).toThrow(/data/);
  });
});

describe('chunk', () => {
  it('splits into batches of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 100)).toEqual([]);
  });
});

describe('fetchEpssScores', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('keeps the batches that succeeded when another one fails', async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `CVE-2026-${String(10000 + i)}`);
    global.fetch = jest.fn(async (url: string) => {
      const first = new URL(url).searchParams.get('cve')!.split(',')[0];
      if (first === ids[100]) return { ok: false, status: 429 } as Response;
      return {
        ok: true,
        json: async () => ({ data: [{ cve: first, epss: '0.5', percentile: '0.9' }] }),
      } as Response;
    }) as unknown as typeof fetch;

    const result = await fetchEpssScores(ids);
    expect(result).toMatchObject({ batches: 2, failedBatches: 1 });
    expect(result.scores.map((s) => s.cveId)).toEqual([ids[0]]);
  });
});
