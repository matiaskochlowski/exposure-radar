import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TriageRecord, TriageStatus } from '@/domain/types';

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
          return {
            records: {
              ...state.records,
              [cveId]: {
                status: current?.status ?? 'new',
                note: note.slice(0, NOTE_MAX_LENGTH),
                updatedAt: now.toISOString(),
              },
            },
          };
        }),
      reset: () => set({ records: {} }),
    }),
    {
      name: 'exposure-radar/triage',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ records: state.records }),
    },
  ),
);
