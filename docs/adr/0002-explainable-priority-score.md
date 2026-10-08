# ADR 0002: An explainable, additive priority score

**Status:** accepted · 2026-10-08

## Context

KEV has well over a thousand entries, and every one of them is "known exploited". A team
needs an order to work in, and has to be able to defend that order.

## Decision

Priority is a 0–100 sum of named contributions, computed by `scoreExposure(entry, epss, now)`:

| Signal                           | Points                        |
| -------------------------------- | ----------------------------- |
| EPSS probability                 | `round(epss × 45)` (0–45)     |
| EPSS missing                     | 15 (neutral, flagged as such) |
| Known ransomware use             | +20                           |
| KEV due date passed              | +20                           |
| Due in ≤ 7 days                  | +15                           |
| Due in ≤ 30 days                 | +8                            |
| Added to KEV in the last 30 days | +10                           |
| Added in the last 90 days        | +5                            |

The total is capped at 100. Bands: **Critical** ≥ 70, **High** ≥ 50, **Medium** ≥ 30,
otherwise **Low**. Every non-zero contribution is returned as a `reason` and shown on the
detail screen.

**Days are the user's local calendar days.** KEV dates are plain calendar dates, so
"due today" means today where the user is, not today in UTC. Without this, someone in
California at 5pm on the due date would already see "Overdue 1d". The test suite runs in
`America/Los_Angeles` (`jest.global-setup.js`) so a UTC/local mix-up fails in CI.

## Alternatives considered

- **CVSS base score.** It measures severity, not likelihood, and isn't in the KEV feed.
- **A learned model.** Not explainable, and not something you can justify in a change review.

## Consequences

- Weights live in one exported constant, `PRIORITY_WEIGHTS`. The About screen renders from
  it, so the in-app explanation cannot drift from the code.
- Changing a weight means updating this ADR, the tests, and the constant together
  (`CLAUDE.md` rule).
