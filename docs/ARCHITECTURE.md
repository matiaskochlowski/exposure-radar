# Architecture

## Data flow

```
CISA KEV JSON ──┐                          ┌─ Queue screen (FlatList, filters)
                ├─ parse (untrusted) ─┐    │
FIRST EPSS API ─┘                     ├─ buildQueue(entries, epss, triage, filters, now)
                                      │    │
bundled snapshot (fallback) ──────────┘    └─ Detail screen (score breakdown, links, triage)
                                                  │
                         Zustand triage store ◄───┘  (persisted to AsyncStorage)
```

1. **Fetch.** `useKevCatalog()` (React Query) fetches the live KEV feed on iOS and Android,
   and falls back to `src/data/kev-snapshot.json` if that fails. On web it uses the snapshot
   directly, because CISA sends no `Access-Control-Allow-Origin` header. It reports `source`
   so the UI can say which data it is showing.
2. **Enrich.** `useEpssScores(cveIds)` batches CVE ids (100 per request) against the EPSS API.
   The snapshot also carries the EPSS scores captured when it was made, so the app is fully
   usable offline.
3. **Decide.** `scoreExposure()` in `src/domain/priority.ts` is a pure function of
   `(entry, epss, now)`. It returns a 0–100 score, a band, and the list of reasons that
   produced it. `buildQueue()` in `src/domain/queue.ts` joins entries, scores and triage
   state, applies filters and sorts.
4. **Render.** Screens call the hooks, memoize `buildQueue`, and hand plain props to
   components.
5. **Persist.** Triage status and notes are local-only, in a Zustand store persisted to
   AsyncStorage. Nothing the user types leaves the device.

## Why this shape

- **Pure core, thin shell.** Every decision is a pure function, so it is unit-tested without
  rendering. That is also the part an agent is most likely to get subtly wrong, so it gets
  the strongest gate.
- **Explainable over clever.** A triage tool has to justify its ordering. The score is a sum
  of named contributions, not a black box (ADR 0002).
- **Offline-first demo.** The snapshot fallback means the web build on GitHub Pages works
  without any backend (ADR 0004).

## Routes

| Route       | File                        | Purpose                                      |
| ----------- | --------------------------- | -------------------------------------------- |
| `/`         | `src/app/(tabs)/index.tsx`  | Prioritized queue, search, filter chips      |
| `/triage`   | `src/app/(tabs)/triage.tsx` | Items you have acted on, grouped by status   |
| `/about`    | `src/app/(tabs)/about.tsx`  | Data sources, priority model, how it's built |
| `/cve/[id]` | `src/app/cve/[id].tsx`      | Detail, score breakdown, links, triage       |

Tabs use `NativeTabs` on iOS/Android and a custom tab bar on web (`app-tabs.web.tsx`).
