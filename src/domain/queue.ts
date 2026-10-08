import { daysFrom } from '@/domain/dates';
import { scoreExposure } from '@/domain/priority';
import type { EpssScore, Exposure, KevEntry, TriageRecord, TriageStatus } from '@/domain/types';

export type QueueFilters = {
  search: string;
  ransomwareOnly: boolean;
  /** Overdue or due within 7 days. */
  dueSoonOnly: boolean;
  /** Added to KEV within the last 30 days. */
  newOnly: boolean;
  /** Include mitigated and risk-accepted items. */
  showClosed: boolean;
};

export const DEFAULT_FILTERS: QueueFilters = {
  search: '',
  ransomwareOnly: false,
  dueSoonOnly: false,
  newOnly: false,
  showClosed: false,
};

export const CLOSED_STATUSES: readonly TriageStatus[] = ['mitigated', 'accepted'];

export function isClosed(triage: TriageRecord | undefined): boolean {
  return triage !== undefined && CLOSED_STATUSES.includes(triage.status);
}

export function joinExposures(
  entries: readonly KevEntry[],
  epssById: ReadonlyMap<string, EpssScore>,
  triageById: Readonly<Record<string, TriageRecord>>,
  now: Date,
): Exposure[] {
  return entries.map((entry) => {
    const epss = epssById.get(entry.cveId);
    return { entry, epss, priority: scoreExposure(entry, epss, now), triage: triageById[entry.cveId] };
  });
}

export function matchesFilters(exposure: Exposure, filters: QueueFilters, now: Date): boolean {
  const { entry, priority, triage } = exposure;
  if (!filters.showClosed && isClosed(triage)) return false;
  if (filters.ransomwareOnly && !entry.knownRansomware) return false;
  if (filters.dueSoonOnly && priority.daysUntilDue > 7) return false;
  if (filters.newOnly && -daysFrom(now, entry.dateAdded) > 30) return false;

  const query = filters.search.trim().toLowerCase();
  if (!query) return true;
  return [entry.cveId, entry.vendor, entry.product, entry.name].some((field) =>
    field.toLowerCase().includes(query),
  );
}

/** Highest score first; ties go to the earlier due date, then the newer KEV addition. */
export function compareExposures(a: Exposure, b: Exposure): number {
  return (
    b.priority.score - a.priority.score ||
    a.priority.daysUntilDue - b.priority.daysUntilDue ||
    b.entry.dateAdded.localeCompare(a.entry.dateAdded) ||
    a.entry.cveId.localeCompare(b.entry.cveId)
  );
}

/** Filters and orders already-joined exposures. Returns a new array. */
export function applyQueue(exposures: readonly Exposure[], filters: QueueFilters, now: Date): Exposure[] {
  return exposures.filter((exposure) => matchesFilters(exposure, filters, now)).sort(compareExposures);
}

export function buildQueue(
  entries: readonly KevEntry[],
  epssById: ReadonlyMap<string, EpssScore>,
  triageById: Readonly<Record<string, TriageRecord>>,
  filters: QueueFilters,
  now: Date,
): Exposure[] {
  return applyQueue(joinExposures(entries, epssById, triageById, now), filters, now);
}
