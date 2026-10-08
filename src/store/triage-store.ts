import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TRIAGE_STATUSES, type TriageRecord, type TriageStatus } from '@/domain/types';

export const NOTE_MAX_LENGTH = 500;

type TriageState = {
  records: Record<string, TriageRecord>;
  setStatus: (cveId: string, status: TriageStatus, now?: Date) => void;
  setNote: (cveId: string, note: string, now?: Date) => void;
  reset: () => void;
};

/** Local-only triage state. Nothing here is sent over the network (docs/SECURITY.md). */
export const useTriageStore = create<TriageState>()(
  persist(
    (set) => ({
      records: {},
      setStatus: (cveId, status, now = new Date()) =>
        set((state) => {
          const current = state.records[cveId];
          const records = { ...state.records };
          // A record that is back to "new" with no note carries no information: drop it.
          if (status === 'new' && !current?.note) delete records[cveId];
          else records[cveId] = { status, note: current?.note ?? '', updatedAt: now.toISOString() };
          return { records };
        }),
      setNote: (cveId, note, now = new Date()) =>
        set((state) => {
          const current = state.records[cveId];
          const text = note.slice(0, NOTE_MAX_LENGTH);
          if (text === (current?.note ?? '')) return state;
          const records = { ...state.records };
          const status = current?.status ?? 'new';
          // Same rule as setStatus: "new" with no note carries no information.
          if (status === 'new' && !text.trim()) delete records[cveId];
          else records[cveId] = { status, note: text, updatedAt: now.toISOString() };
          return { records };
        }),
      reset: () => set({ records: {} }),
    }),
    {
      name: 'exposure-radar/triage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ records: state.records }),
      // Storage is outside our control: keep only well-formed records, and let changes
      // made before hydration finished win over what was stored.
      merge: (persisted, current) => ({
        ...current,
        records: {
          ...sanitizeRecords((persisted as { records?: unknown } | undefined)?.records),
          ...current.records,
        },
      }),
    },
  ),
);

export function sanitizeRecords(value: unknown): Record<string, TriageRecord> {
  if (typeof value !== 'object' || value === null) return {};
  const records: Record<string, TriageRecord> = {};
  for (const [cveId, record] of Object.entries(value)) {
    if (!/^CVE-\d{4}-\d{4,}$/.test(cveId) || typeof record !== 'object' || record === null) continue;
    const { status, note, updatedAt } = record as Record<string, unknown>;
    if (!TRIAGE_STATUSES.includes(status as TriageStatus)) continue;
    records[cveId] = {
      status: status as TriageStatus,
      note: typeof note === 'string' ? note.slice(0, NOTE_MAX_LENGTH) : '',
      updatedAt: typeof updatedAt === 'string' ? updatedAt : '',
    };
  }
  return records;
}
