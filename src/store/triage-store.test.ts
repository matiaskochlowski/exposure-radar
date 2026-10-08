import { TEST_NOW } from '@/domain/test-builders';
import { NOTE_MAX_LENGTH, useTriageStore } from '@/store/triage-store';

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
});
