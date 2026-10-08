import { useMemo } from 'react';

import { useEpssScores, useKevCatalog } from '@/data/queries';
import { joinExposures } from '@/domain/queue';
import type { Exposure } from '@/domain/types';
import { useToday } from '@/hooks/use-today';
import { useTriageStore } from '@/store/triage-store';

/** Every KEV entry joined with EPSS, priority and triage state. Unfiltered and unsorted. */
export function useExposures() {
  const kev = useKevCatalog();
  const epss = useEpssScores(kev.data?.catalog);
  const triage = useTriageStore((s) => s.records);
  const now = useToday();

  const exposures: Exposure[] = useMemo(
    () => (kev.data ? joinExposures(kev.data.catalog.entries, epss.data ?? new Map(), triage, now) : []),
    [kev.data, epss.data, triage, now],
  );

  return { kev, epss, exposures, now };
}
