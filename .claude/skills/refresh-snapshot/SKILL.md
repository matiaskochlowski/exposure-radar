---
name: refresh-snapshot
description: Refresh the bundled KEV + EPSS snapshot used for offline and web fallback, and sanity-check the result.
---

# Refresh the data snapshot

1. Run `npm run snapshot`. It asks for permission because it hits the network and rewrites a
   tracked file.
2. Sanity-check `src/data/kev-snapshot.json`:
   - `catalogVersion` moved forward and `entries.length` is 300
   - every entry has an EPSS score, or there is a reason it doesn't (very new CVEs may not be
     scored yet)
   - `git diff --stat` looks like a data update, not a format change
3. Run `npm test`. The parser tests also run against the snapshot.
4. Commit as `Refresh KEV/EPSS snapshot to <catalogVersion>`, with nothing else in the commit.
