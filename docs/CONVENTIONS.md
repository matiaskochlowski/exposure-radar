# Conventions

Short and enforceable. If a rule is not here, copy what the nearest existing file does.

## Files and naming

- Files are `kebab-case.ts(x)`. Components are `PascalCase` exports. Hooks start with `use`.
- Tests sit next to the code: `priority.ts` → `priority.test.ts`.
- Platform splits use Expo suffixes: `app-tabs.tsx` (native), `app-tabs.web.tsx` (web).
- Imports use the `@/` alias for `src/`. No deep relative paths (`../../..`).

## Layers

| Layer             | May import from                         | Must not                   |
| ----------------- | --------------------------------------- | -------------------------- |
| `src/domain/`     | other `domain/` files                   | React, React Native, fetch |
| `src/data/`       | `domain/`, React Query                  | components, stores         |
| `src/store/`      | `domain/`                               | components, data hooks     |
| `src/components/` | `domain/` types, `constants/`, `hooks/` | fetch, stores (take props) |
| `src/app/`        | everything                              | business rules inline      |

## Components

- Function components only. Props typed with a `type XProps = {...}` next to the component.
- Styles via `StyleSheet.create` at the bottom of the file. Colors come from `useTheme()`.
- Lists use `FlatList` / `SectionList` with a stable `keyExtractor` (the CVE id). Row
  components are wrapped in `memo`.
- Every `Pressable` has `accessibilityRole` and `accessibilityLabel`, and a hit area of at
  least 44×44 (use `hitSlop` when the visual is smaller).
- Severity is shown as text **and** color (e.g. a "CRITICAL 82" pill), never color alone.

## State

- Server state: React Query (`src/data/queries.ts`). Do not copy it into Zustand.
- Client state that must survive restarts: Zustand + `persist` (`src/store/`).
- Ephemeral UI state (search text, chips): `useState` in the screen.

## Time

Anything time-dependent takes `now: Date` as a parameter. Never call `new Date()` inside
`src/domain/`, because tests pin the clock by passing a date.

## Commits

Imperative subject under 72 characters, a body that says _why_, and a `Co-Authored-By`
trailer when an agent wrote the change.
