import { chunk, parseEpssResponse } from '@/data/epss-client';

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
    ['a bogus CVE id', { cve: 'not-a-cve', epss: '0.5', percentile: '0.5' }],
  ])('drops a row with %s', (_label, bad) => {
    expect(parseEpssResponse({ data: [bad] })).toEqual([]);
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
