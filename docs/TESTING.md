# Testing

Runner: `jest-expo` preset. Component tests: React Native Testing Library.

## What gets tested, and how hard

| Layer                  | Expectation                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `src/domain/*`         | Thorough: every branch, boundary dates, empty and bad input.      |
| `src/data/*-client.ts` | Parsers against good, malformed and hostile payloads. No network. |
| `src/store/*`          | State transitions through the public actions.                     |
| `src/components/*`     | Behavior and accessibility: what a user sees and can press.       |
| `src/app/*`            | Not unit-tested. Verified by running the app (web build in CI).   |

## Rules

- **Pin the clock.** Pass `now` explicitly. A test that depends on today's date is a bug.
- **No network in tests.** Clients are tested through their parse functions. `fetch` is
  never called for real.
- **Query by role and label** in component tests (`getByRole`, `getByLabelText`), not by test
  id. If a test cannot find an element by role, the element is probably not accessible.
- **Name tests after the behavior**: `it('treats an overdue due date as +20')`, not
  `it('works')`.
- Write the failing test first for domain changes (see the `domain-tdd` skill).

## Definition of done

`npm run verify` (typecheck, lint, test) is green locally. CI runs the same command, then
exports the web build.
