#!/usr/bin/env node
// Writes src/data/kev-snapshot.json: the most recent KEV entries plus their EPSS scores at
// snapshot time. The app falls back to it when the live feed is unreachable (ADR 0004).
// Rows are stored raw, so the app's own parser validates them at runtime and in tests.
import { writeFile } from 'node:fs/promises';

const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const EPSS_URL = 'https://api.first.org/data/v1/epss';
const SIZE = Number(process.env.SNAPSHOT_SIZE ?? 300);
const OUT = new URL('../src/data/kev-snapshot.json', import.meta.url);

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

const kev = await getJson(KEV_URL);
const recent = [...kev.vulnerabilities]
  .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded) || b.cveID.localeCompare(a.cveID))
  .slice(0, SIZE);

const epss = [];
for (let i = 0; i < recent.length; i += 100) {
  const ids = recent.slice(i, i + 100).map((v) => v.cveID);
  const body = await getJson(`${EPSS_URL}?cve=${ids.join(',')}&limit=${ids.length}`);
  epss.push(...body.data);
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: { kev: KEV_URL, epss: EPSS_URL },
  kev: {
    title: kev.title,
    catalogVersion: kev.catalogVersion,
    dateReleased: kev.dateReleased,
    count: recent.length,
    vulnerabilities: recent,
  },
  epss: { data: epss },
};

await writeFile(OUT, `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(
  `Wrote ${recent.length} KEV entries (catalog ${kev.catalogVersion}) and ${epss.length} EPSS scores to ${OUT.pathname}`,
);
