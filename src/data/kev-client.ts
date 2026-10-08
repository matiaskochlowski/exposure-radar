import { isIsoDay } from '@/domain/dates';
import type { KevCatalog, KevEntry } from '@/domain/types';

export const KEV_FEED_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

const CVE_ID = /^CVE-\d{4}-\d{4,}$/;
const CWE_ID = /^CWE-\d+$/;
const LIMITS = { short: 200, long: 4000, entries: 5000, cwes: 10 } as const;

type Raw = Record<string, unknown>;

/**
 * Validates and normalizes the KEV feed. The payload is untrusted: types are checked at
 * runtime, strings are trimmed and length-capped, and malformed rows are dropped (and
 * counted) instead of crashing the app.
 */
export function parseKevCatalog(json: unknown): KevCatalog {
  if (!isObject(json) || !Array.isArray(json.vulnerabilities)) {
    throw new Error('KEV feed: expected an object with a "vulnerabilities" array');
  }

  const entries: KevEntry[] = [];
  let rejected = 0;
  for (const row of json.vulnerabilities.slice(0, LIMITS.entries)) {
    const entry = parseKevEntry(row);
    if (entry) entries.push(entry);
    else rejected += 1;
  }

  return {
    catalogVersion: text(json.catalogVersion, LIMITS.short) || 'unknown',
    dateReleased: text(json.dateReleased, LIMITS.short),
    entries,
    rejected,
  };
}

export function parseKevEntry(row: unknown): KevEntry | null {
  if (!isObject(row)) return null;

  const cveId = text(row.cveID, LIMITS.short).toUpperCase();
  const dateAdded = text(row.dateAdded, LIMITS.short);
  const dueDate = text(row.dueDate, LIMITS.short);
  if (!CVE_ID.test(cveId) || !isIsoDay(dateAdded) || !isIsoDay(dueDate)) return null;

  return {
    cveId,
    vendor: text(row.vendorProject, LIMITS.short) || 'Unknown vendor',
    product: text(row.product, LIMITS.short) || 'Unknown product',
    name: text(row.vulnerabilityName, LIMITS.short) || cveId,
    dateAdded,
    dueDate,
    description: text(row.shortDescription, LIMITS.long),
    requiredAction: text(row.requiredAction, LIMITS.long),
    knownRansomware: text(row.knownRansomwareCampaignUse, LIMITS.short).toLowerCase() === 'known',
    notes: text(row.notes, LIMITS.long),
    cwes: Array.isArray(row.cwes)
      ? row.cwes
          .map((c) => text(c, LIMITS.short).toUpperCase())
          .filter((c) => CWE_ID.test(c))
          .slice(0, LIMITS.cwes)
      : [],
  };
}

export async function fetchKevCatalog(signal?: AbortSignal): Promise<KevCatalog> {
  const res = await fetch(KEV_FEED_URL, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`KEV feed: HTTP ${res.status}`);
  return parseKevCatalog(await res.json());
}

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Strings only, whitespace collapsed, control characters removed, length-capped. */
function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
