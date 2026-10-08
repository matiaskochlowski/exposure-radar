import type { EpssScore } from '@/domain/types';

export const EPSS_API_URL = 'https://api.first.org/data/v1/epss';

/** CVE ids per request. Keeps the query string well under common URL length limits. */
export const EPSS_BATCH_SIZE = 100;
/** Requests in flight at once, to stay polite to a free public API. */
const CONCURRENCY = 3;

/** Validates an EPSS API response. Rows with non-numeric or out-of-range values are dropped. */
export function parseEpssResponse(json: unknown): EpssScore[] {
  if (typeof json !== 'object' || json === null || !Array.isArray((json as { data?: unknown }).data)) {
    throw new Error('EPSS API: expected an object with a "data" array');
  }

  const scores: EpssScore[] = [];
  for (const row of (json as { data: unknown[] }).data) {
    if (typeof row !== 'object' || row === null) continue;
    const { cve, epss, percentile, date } = row as Record<string, unknown>;
    const p = toNumber(epss);
    const pct = toNumber(percentile);
    if (typeof cve !== 'string' || !/^CVE-\d{4}-\d{4,}$/i.test(cve)) continue;
    if (!isProbability(p) || !isProbability(pct)) continue;
    scores.push({
      cveId: cve.toUpperCase(),
      epss: p,
      percentile: pct,
      date: typeof date === 'string' ? date : '',
    });
  }
  return scores;
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type EpssFetchResult = { scores: EpssScore[]; batches: number; failedBatches: number };

/**
 * Fetches scores in batches. A failed batch doesn't throw away the ones that succeeded:
 * the caller gets what arrived plus a failure count, so it can say the data is partial.
 */
export async function fetchEpssScores(
  cveIds: readonly string[],
  signal?: AbortSignal,
): Promise<EpssFetchResult> {
  const batches = chunk([...new Set(cveIds)], EPSS_BATCH_SIZE);
  const scores: EpssScore[] = [];
  let failedBatches = 0;
  for (const group of chunk(batches, CONCURRENCY)) {
    const results = await Promise.allSettled(
      group.map(async (batch) => {
        const url = `${EPSS_API_URL}?cve=${batch.map(encodeURIComponent).join(',')}&limit=${batch.length}`;
        const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`EPSS API: HTTP ${res.status}`);
        return parseEpssResponse(await res.json());
      }),
    );
    if (signal?.aborted) throw new Error('EPSS fetch aborted');
    for (const result of results) {
      if (result.status === 'fulfilled') scores.push(...result.value);
      else failedBatches += 1;
    }
  }
  return { scores, batches: batches.length, failedBatches };
}

/** Numbers, or decimal strings as the API sends them. Never `Number(null)` → 0. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+(\.\d+)?(e-?\d+)?$/i.test(value.trim())) return Number(value);
  return NaN;
}

function isProbability(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 1;
}
