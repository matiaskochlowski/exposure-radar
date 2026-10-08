# Dev log

An honest record of how the app was built: who decided what, and what went wrong.

## Session 1: 2026-10-08, from empty directory to public repo

**Setup:** one Claude Code session (Claude Opus 5.5) on macOS, directed by Matias
Kochlowski. The starting prompt:

> Create a public repo under matiaskochlowski that demonstrates my use of claude code to
> develop a demo front-end react native app showcasing ai-driven development

**Decisions made by the agent, within that brief.** These are listed so a reviewer can
challenge them:

- **Domain:** vulnerability triage on public, keyless data (CISA KEV + FIRST EPSS). It is
  real data with real security concerns (untrusted feeds, links), and needs no backend.
- **Stack:** Expo SDK 57 / React Native 0.86 / Expo Router, React Query for server state,
  Zustand for local triage state (ADR 0001).
- **No AI inside the app.** AI is how it was built, not a feature that would need an API key
  in the client (ADR 0003).

### What happened, in order

1. **Scaffold.** `create-expo-app` (default template). The template's demo screens and
   assets were removed. Its `AGENTS.md` was kept, because it tells agents to read versioned
   Expo docs instead of trusting training data.
2. **Context first.** `CLAUDE.md`, architecture, conventions, testing, security, glossary,
   four ADRs, then `.claude/`: settings (permissions + three hooks), six skills, three
   subagents. All of this was written before any app code.
3. **Domain, test-first.** Types, date helpers, priority model, queue, safe links, KEV and
   EPSS parsers, triage store, and their tests.
   - **Caught by the tests:** the first run had 4 failures. The shared test builder's
     default entry had a due date in the past, so every "neutral" fixture was quietly
     getting the overdue weight. The fix went into the builder, with a comment saying it is
     date-neutral. The assertions were left alone.
   - **Caught while writing:** a "caps the score at 100" test could never exercise the cap,
     because overdue and due-soon are mutually exclusive, so the maximum reachable score is 95. The test now states the real maximum, and the cap stays as a guard.
4. **Typecheck surprises.** TypeScript 6 no longer picks up ambient `@types/*`, so Jest
   globals and the CSS side-effect import failed. Fixed with explicit `types` in
   `tsconfig.json`.
5. **Lint.** The template's own `use-color-scheme.web.ts` failed the React Compiler lint rule
   (setState inside an effect). It was rewritten with `useSyncExternalStore`. Then the
   layering rules were added to `eslint.config.js` and **probed with a deliberate violation**
   (a React import and `new Date()` in `src/domain`) to confirm they fire.
6. **Hooks exercised.** Each hook was run by piping hook-shaped JSON into it: the secrets hook
   blocks a fake Anthropic key with exit 2 and passes clean content, the Stop hook skips when
   `stop_hook_active` is set and runs `verify` otherwise, and the formatter rewrites a file.
   _Note:_ this build session was started from a parent workspace, so the project's own
   hooks were not live during it. They take effect for anyone who opens Claude Code in this
   repo.
7. **UI.** Theme tokens (band colors with text labels, so color is never the only signal),
   queue, triage, about, detail screens, and native plus web tab bars. Component tests use
   React Native Testing Library v14 (async `render`, `userEvent`) and query by role. Jest
   needed a stub for the CSS import.
8. **Verified in a browser.** A Playwright flow over the exported web build went through
   queue → ransomware filter → search → detail → set status and note → triage tab →
   about, with an axe scan at the end.
   - **Found:** the console showed a CORS error. CISA's KEV feed sends no
     `Access-Control-Allow-Origin` header, so the browser could never read it. The app
     already fell back to the snapshot, but the error was noise and the request was
     pointless. **Fix:** the web build now goes straight to the snapshot, while native still
     tries live first. ADR 0004 and ARCHITECTURE were updated in the same change.
   - **Found in screenshot review:** awkward copy on the About screen ("low below.") and a
     data-source sentence that was no longer accurate for web. Both fixed.
9. **CI + Pages.** GitHub Actions runs `npm run verify`, exports the web build, and deploys it
   to GitHub Pages from `main`.

### Final state

- `npm run verify`: typecheck, lint and **79 tests in 9 suites**, all green.
- Web build: Playwright flow passes, and axe scans pass in both light and dark mode
  (dark mode checked by emulating `prefers-color-scheme: dark`).

### Not verified in this session

- **iOS and Android were not run.** The machine had no Xcode or Android emulator. The native
  tab bar (`NativeTabs`) and the live KEV fetch on native are type-checked but have not been
  seen running. Next step: `npx expo start` with Expo Go on a device.

### Human gates

Creating a **public** repository and pushing to it are outward-facing actions. The user
explicitly asked for both in the starting prompt. Everything else stayed local until then.
