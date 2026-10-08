---
name: domain-tdd
description: Add or change a pure domain rule (scoring, filtering, parsing, link safety) test-first. Use for any change under src/domain/ or a *-client.ts parser.
---

# Domain change, test-first

1. **State the rule in one sentence** in your reply before touching code, e.g. "An entry due
   today counts as due within 7 days, not overdue."
2. **Write the failing test first**, colocated (`foo.ts` → `foo.test.ts`).
   - Pin the clock: build `now` with `new Date('2026-10-08T12:00:00Z')`. Never use the real date.
   - Cover the boundary on both sides (day 7 and day 8, `epss` of 0 and 1, empty strings).
   - Use the `makeEntry()` / `makeEpss()` builders in `src/domain/test-builders.ts`. Do not
     hand-roll fixtures.
3. Run `npx jest <file>` and **confirm it fails for the right reason**.
4. Implement the smallest change that makes it pass. Keep the function pure: no `Date.now()`,
   no I/O, no React.
5. Run `npm run verify`.
6. If the change touches priority weights or bands, also update
   `docs/adr/0002-explainable-priority-score.md`. The About screen renders from
   `PRIORITY_WEIGHTS`, so check that its copy still reads correctly.
