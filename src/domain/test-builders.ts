import type { EpssScore, KevEntry } from '@/domain/types';

/** Fixed clock for tests: Thursday 2026-10-08, midday UTC. */
export const TEST_NOW = new Date('2026-10-08T12:00:00Z');

export function makeEntry(overrides: Partial<KevEntry> = {}): KevEntry {
  return {
    cveId: 'CVE-2024-0001',
    vendor: 'Acme',
    product: 'Gateway',
    name: 'Acme Gateway Command Injection Vulnerability',
    dateAdded: '2026-01-15',
    // Neutral by default: added > 90 days and due > 30 days from TEST_NOW, so no date weights apply.
    dueDate: '2026-12-31',
    description: 'Acme Gateway contains a command injection vulnerability.',
    requiredAction: 'Apply mitigations per vendor instructions.',
    knownRansomware: false,
    notes: '',
    cwes: ['CWE-78'],
    ...overrides,
  };
}

export function makeEpss(overrides: Partial<EpssScore> = {}): EpssScore {
  return { cveId: 'CVE-2024-0001', epss: 0.5, percentile: 0.95, date: '2026-10-08', ...overrides };
}
