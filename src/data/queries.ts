import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { fetchEpssScores, parseEpssResponse } from '@/data/epss-client';
import { fetchKevCatalog, parseKevCatalog } from '@/data/kev-client';
import snapshot from '@/data/kev-snapshot.json';
import type { EpssScore, KevCatalog } from '@/domain/types';

export type DataSource = 'live' | 'snapshot';
export type KevResult = { catalog: KevCatalog; source: DataSource; error?: string };

const HOUR = 60 * 60 * 1000;

export const SNAPSHOT_GENERATED_AT = snapshot.generatedAt;

let snapshotCache: { catalog: KevCatalog; epss: EpssScore[] } | undefined;
/** The bundled snapshot, parsed once on first use. */
export function loadSnapshot() {
  snapshotCache ??= { catalog: parseKevCatalog(snapshot.kev), epss: parseEpssResponse(snapshot.epss) };
  return snapshotCache;
}

/** CISA sends no CORS headers, so a browser can never read the live KEV feed (ADR 0004). */
const CAN_FETCH_LIVE_KEV = Platform.OS !== 'web';

/** Live KEV catalog, falling back to the bundled snapshot when the feed is unreachable. */
export function useKevCatalog() {
  return useQuery<KevResult>({
    queryKey: ['kev'],
    staleTime: 6 * HOUR,
    queryFn: async ({ signal }) => {
      if (!CAN_FETCH_LIVE_KEV) return { catalog: loadSnapshot().catalog, source: 'snapshot' };
      try {
        return { catalog: await fetchKevCatalog(signal), source: 'live' };
      } catch (err) {
        if (signal.aborted) throw err;
        return { catalog: loadSnapshot().catalog, source: 'snapshot', error: errorMessage(err) };
      }
    },
  });
}

/**
 * EPSS scores keyed by CVE id. Starts from the snapshot's scores so the queue is ranked
 * immediately, then overlays live scores when the API answers.
 */
export function useEpssScores(catalog: KevCatalog | undefined) {
  return useQuery<Map<string, EpssScore>>({
    queryKey: ['epss', catalog?.catalogVersion, catalog?.entries.length],
    enabled: catalog !== undefined,
    staleTime: 12 * HOUR,
    placeholderData: () => toMap(loadSnapshot().epss),
    queryFn: async ({ signal }) => {
      const byId = toMap(loadSnapshot().epss);
      const cveIds = catalog?.entries.map((e) => e.cveId) ?? [];
      try {
        for (const score of await fetchEpssScores(cveIds, signal)) byId.set(score.cveId, score);
      } catch (err) {
        if (signal.aborted) throw err;
      }
      return byId;
    },
  });
}

function toMap(scores: EpssScore[]): Map<string, EpssScore> {
  return new Map(scores.map((s) => [s.cveId, s]));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
