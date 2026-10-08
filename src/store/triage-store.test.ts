import { TEST_NOW } from '@/domain/test-builders';
import { NOTE_MAX_LENGTH, sanitizeRecords, useTriageStore } from '@/store/triage-store';

const store = () => useTriageStore.getState();

beforeEach(() => store().reset());

describe('triage store', () => {
  it('records a status change with a timestamp', () => {
    store().setStatus('CVE-2024-3400', 'investigating', TEST_NOW);
    expect(store().records['CVE-2024-3400']).toEqual({
      status: 'investigating',
      note: '',
      updatedAt: TEST_NOW.toISOString(),
    });
  });

  it('keeps the note when the status changes', () => {
    store().setNote('CVE-2024-3400', 'Edge firewalls only', TEST_NOW);
    store().setStatus('CVE-2024-3400', 'mitigated', TEST_NOW);
    expect(store().records['CVE-2024-3400']).toMatchObject({
      status: 'mitigated',
      note: 'Edge firewalls only',
    });
  });

  it('drops the record when it goes back to "new" with no note', () => {
    store().setStatus('CVE-2024-3400', 'investigating', TEST_NOW);
    store().setStatus('CVE-2024-3400', 'new', TEST_NOW);
    expect(store().records).toEqual({});
  });

  it('keeps a "new" record that has a note', () => {
    store().setNote('CVE-2024-3400', 'Check with infra', TEST_NOW);
    store().setStatus('CVE-2024-3400', 'new', TEST_NOW);
    expect(store().records['CVE-2024-3400']).toMatchObject({ status: 'new', note: 'Check with infra' });
  });

  it('caps note length', () => {
    store().setNote('CVE-2024-3400', 'x'.repeat(NOTE_MAX_LENGTH + 100), TEST_NOW);
    expect(store().records['CVE-2024-3400'].note).toHaveLength(NOTE_MAX_LENGTH);
  });

  it('does not create a record for an empty note on a new item', () => {
    store().setNote('CVE-2024-3400', '   ', TEST_NOW);
    expect(store().records).toEqual({});
  });

  it('drops the record when the note of a new item is cleared', () => {
    store().setNote('CVE-2024-3400', 'temp', TEST_NOW);
    store().setNote('CVE-2024-3400', '', TEST_NOW);
    expect(store().records).toEqual({});
  });

  it('leaves the timestamp alone when the note did not change', () => {
    store().setNote('CVE-2024-3400', 'same', TEST_NOW);
    store().setNote('CVE-2024-3400', 'same', new Date('2026-10-09T12:00:00Z'));
    expect(store().records['CVE-2024-3400'].updatedAt).toBe(TEST_NOW.toISOString());
  });
});

describe('sanitizeRecords', () => {
  it('keeps well-formed records and drops corrupted ones', () => {
    expect(
      sanitizeRecords({
        'CVE-2024-3400': { status: 'mitigated', note: 'done', updatedAt: '2026-10-08T12:00:00.000Z' },
        'CVE-2024-0001': { status: 'pwned', note: '' },
        'not-a-cve': { status: 'new', note: '' },
        'CVE-2024-0002': 'garbage',
        'CVE-2024-0003': { status: 'accepted', note: 42 },
      }),
    ).toEqual({
      'CVE-2024-3400': { status: 'mitigated', note: 'done', updatedAt: '2026-10-08T12:00:00.000Z' },
      'CVE-2024-0003': { status: 'accepted', note: '', updatedAt: '' },
    });
  });

  it('returns an empty object for anything that is not an object', () => {
    expect(sanitizeRecords(null)).toEqual({});
    expect(sanitizeRecords('[]')).toEqual({});
  });
});
