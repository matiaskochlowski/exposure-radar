# Exposure Radar: agent context

@AGENTS.md

Exposure Radar is a React Native (Expo) app that turns the CISA Known Exploited Vulnerabilities
(KEV) catalog plus FIRST EPSS scores into a prioritized triage queue. It is a demo, built
end-to-end with Claude Code. This file is the first thing an agent reads, so keep it short.
Details live in `docs/`.

## Commands

```bash
npm start            # Expo dev server (press w for web, i/a for simulators)
npm run web          # web only
npm run typecheck    # tsc --noEmit
npm run lint         # expo lint (eslint flat config)
npm test             # jest-expo, run once
npm run verify       # typecheck + lint + test, the definition of done
npm run snapshot     # refresh src/data/kev-snapshot.json from the live feeds
```

## Map

| Path              | What lives there                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| `src/app/`        | Expo Router routes only. Screens are thin: they compose hooks and components. |
| `src/domain/`     | Pure TypeScript: types, priority model, filters, link safety. No React.       |
| `src/data/`       | Feed clients (KEV, EPSS), React Query hooks, bundled offline snapshot.        |
| `src/store/`      | Zustand stores (triage state, persisted to AsyncStorage).                     |
| `src/components/` | Presentational components. Props in, JSX out.                                 |
| `src/constants/`  | Theme tokens (colors per scheme, spacing, fonts).                             |
| `docs/`           | Architecture, conventions, testing, security, glossary, ADRs, AI workflow.    |
| `.claude/`        | Skills, subagents, hooks and permissions used to build this repo.             |

## Rules

- **Domain logic is pure and tested first.** Anything that decides (scoring, filtering,
  parsing, link validation) goes in `src/domain/` or `src/data/*-client.ts` with a colocated
  `*.test.ts`. Screens must not contain business rules.
- **Feed data is untrusted input.** Parse it through `parseKevCatalog` / `parseEpssResponse`.
  Never render it as HTML and never open a URL from it without `extractSafeLinks`. See
  `docs/SECURITY.md`.
- **No secrets or LLM calls in the client.** An app bundle is public. See ADR 0003.
- **Do not change priority weights casually.** They are documented in ADR 0002 and shown to
  users on the About screen. Update the ADR, the tests and the About copy together.
- **Use theme tokens** from `src/constants/theme.ts`. No hard-coded colors in components.
- **Accessibility is part of done:** `accessibilityRole`, `accessibilityLabel` on anything
  pressable, 44pt minimum touch targets, and color is never the only signal.
- Install packages with `npx expo install`, never plain `npm install <pkg>`.
- Stop at a human gate before `git push`, opening a PR, or anything that publishes.

## Done means

`npm run verify` passes, new logic has tests, and docs/ADRs are updated when a decision
changed. The Stop hook in `.claude/settings.json` enforces the first part.
