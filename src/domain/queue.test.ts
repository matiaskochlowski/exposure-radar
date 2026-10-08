import { buildQueue, DEFAULT_FILTERS, type QueueFilters } from '@/domain/queue';
import { makeEntry, makeEpss, TEST_NOW } from '@/domain/test-builders';
import type { EpssScore, TriageRecord } from '@/domain/types';

const log4shell = makeEntry({
  cveId: 'CVE-2021-44228',
  vendor: 'Apache',
  product: 'Log4j2',
  name: 'Apache Log4j2 Remote Code Execution Vulnerability',
  knownRansomware: true,
  dateAdded: '2021-12-10',
  dueDate: '2021-12-24',
});
const fresh = makeEntry({
  cveId: 'CVE-2026-1111',
  vendor: 'Contoso',
  dateAdded: '2026-10-01',
  dueDate: '2026-10-22',
});
const quiet = makeEntry({
  cveId: 'CVE-2019-2222',
  vendor: 'Initech',
  dateAdded: '2019-11-03',
  dueDate: '2020-05-03',
});

const epss = new Map<string, EpssScore>([
  [log4shell.cveId, makeEpss({ cveId: log4shell.cveId, epss: 0.97 })],
  [fresh.cveId, makeEpss({ cveId: fresh.cveId, epss: 0.02 })],
  [quiet.cveId, makeEpss({ cveId: quiet.cveId, epss: 0.01 })],
]);

const triage = (status: TriageRecord['status']): TriageRecord => ({
  status,
  note: '',
  updatedAt: TEST_NOW.toISOString(),
});
const queue = (filters: Partial<QueueFilters> = {}, triageById: Record<string, TriageRecord> = {}) =>
  buildQueue([quiet, fresh, log4shell], epss, triageById, { ...DEFAULT_FILTERS, ...filters }, TEST_NOW).map(
    (e) => e.entry.cveId,
  );

describe('buildQueue', () => {
  it('sorts by priority score, highest first', () => {
    expect(queue()).toEqual(['CVE-2021-44228', 'CVE-2019-2222', 'CVE-2026-1111']);
  });

  it('hides closed items by default and shows them on request', () => {
    const closed = { [log4shell.cveId]: triage('mitigated'), [quiet.cveId]: triage('accepted') };
    expect(queue({}, closed)).toEqual(['CVE-2026-1111']);
    expect(queue({ showClosed: true }, closed)).toHaveLength(3);
  });

  it('keeps items that are only being investigated', () => {
    expect(queue({}, { [log4shell.cveId]: triage('investigating') })).toContain('CVE-2021-44228');
  });

  it('filters to known ransomware use', () => {
    expect(queue({ ransomwareOnly: true })).toEqual(['CVE-2021-44228']);
  });

  it('filters to new entries (last 30 days)', () => {
    expect(queue({ newOnly: true })).toEqual(['CVE-2026-1111']);
  });

  it('treats overdue entries as due soon', () => {
    expect(queue({ dueSoonOnly: true })).toEqual(['CVE-2021-44228', 'CVE-2019-2222']);
  });

  it('searches CVE id, vendor, product and name, case-insensitively', () => {
    expect(queue({ search: 'log4j' })).toEqual(['CVE-2021-44228']);
    expect(queue({ search: '  CONTOSO ' })).toEqual(['CVE-2026-1111']);
    expect(queue({ search: 'cve-2019' })).toEqual(['CVE-2019-2222']);
    expect(queue({ search: 'nothing matches' })).toEqual([]);
  });

  it('breaks score ties by earlier due date', () => {
    const a = makeEntry({ cveId: 'CVE-A', dueDate: '2026-10-20', dateAdded: '2025-01-01' });
    const b = makeEntry({ cveId: 'CVE-B', dueDate: '2026-10-25', dateAdded: '2025-01-01' });
    const ids = buildQueue([b, a], new Map(), {}, DEFAULT_FILTERS, TEST_NOW).map((e) => e.entry.cveId);
    expect(ids).toEqual(['CVE-A', 'CVE-B']);
  });
});
