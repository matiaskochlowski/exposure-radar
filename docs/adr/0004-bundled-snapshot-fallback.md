# ADR 0004: Bundled data snapshot as a fallback

**Status:** accepted · 2026-10-08

## Context

The CISA KEV feed does not send CORS headers, so a browser cannot fetch it directly. The web
build on GitHub Pages has no backend to proxy it. Demos also get opened on bad conference
Wi-Fi.

## Decision

`scripts/snapshot.mjs` writes `src/data/kev-snapshot.json`: the most recent 300 KEV entries,
plus their EPSS scores at snapshot time. On iOS and Android the app tries the live feed first
and falls back to the snapshot. On web it uses the snapshot directly, because the live
request can only fail there. EPSS stays live on every platform, since FIRST does send CORS
headers. The queue header always says which source it is showing (`Live` or
`Offline snapshot`, with the catalog version).

## Consequences

- The web demo always works, with clearly labelled data.
- The snapshot goes stale. `npm run snapshot` refreshes it, and the `refresh-snapshot` skill
  covers the review step.
- KEV and EPSS data are public. KEV is a US Government work, and EPSS is published by FIRST
  for public use with attribution, which the About screen provides.
