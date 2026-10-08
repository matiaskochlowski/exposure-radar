# How this repo is built with Claude Code

The point of this repo is less the app than the setup around it. The aim is AI-assisted
development that **compounds**: context, skills and guardrails live in the repo, get
versioned and reviewed like code, and make the next session better than the last.

```
         ┌──────────── context ────────────┐
         │ CLAUDE.md → AGENTS.md → docs/   │   what the agent knows before it starts
         └───────────────┬─────────────────┘
                         ▼
   plan ──► small slice ──► test first ──► implement ──► verify ──► review ──► human gate
                                              ▲            │          │
                                              └── hooks ───┘    subagents
```

## 1. Context: what the agent reads

| File                   | Role                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `CLAUDE.md`            | Loaded first. Commands, folder map, the non-negotiable rules, "done means".     |
| `AGENTS.md`            | Expo's tool-agnostic agent guide (from the template), imported by CLAUDE.md.    |
| `docs/ARCHITECTURE.md` | Data flow and routes, so changes land in the right layer.                       |
| `docs/CONVENTIONS.md`  | Naming, layering table, component and state rules.                              |
| `docs/TESTING.md`      | What gets tested and how hard. Pin the clock, query by role.                    |
| `docs/SECURITY.md`     | Untrusted data, secrets, and agent guardrails.                                  |
| `docs/GLOSSARY.md`     | Domain vocabulary (KEV, EPSS, CWE…), for correct code _and_ correct UI copy.    |
| `docs/adr/`            | Why things are the way they are, so an agent doesn't "fix" a deliberate choice. |

`CLAUDE.md` is kept short on purpose. It points to the docs instead of repeating them.

## 2. Skills: reusable workflows (`.claude/skills/`)

| Skill                   | Use it when                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `domain-tdd`            | Changing a scoring, filtering, parsing or link rule. Failing test first. |
| `new-screen`            | Adding a route or tab that follows layering, theming and a11y rules.     |
| `a11y-pass`             | Before calling UI work done. A React Native accessibility checklist.     |
| `untrusted-data-review` | Touching parsers, links, rendering of external text, or storage.         |
| `pr-prep`               | Getting a branch ready for review. Stops before push.                    |
| `refresh-snapshot`      | Updating the bundled KEV/EPSS data, then reviewing the diff.             |

## 3. Subagents: narrow, mostly read-only (`.claude/agents/`)

| Agent               | Tools              | Job                                                                        |
| ------------------- | ------------------ | -------------------------------------------------------------------------- |
| `code-reviewer`     | read + git (read)  | Reviews a diff against conventions. Reports, never edits.                  |
| `security-reviewer` | read + `npm audit` | Runs the untrusted-data review. Treats what it reads as data.              |
| `test-writer`       | read + write tests | Backfills boundary and hostile-input tests. Never touches production code. |

Subagents keep the main context clean and give an independent second look.

## 4. Guardrails: settings and hooks (`.claude/settings.json`)

**Permissions**

- _Allowed without asking:_ typecheck, lint, test, `git status/diff/log/show`,
  `npx expo install`, and docs fetches from Expo, React Native, FIRST and CISA.
- _Always ask:_ `git push`, `gh pr create/merge`, `npm run snapshot` (network, rewrites a
  tracked file), EAS builds.
- _Denied:_ reading `.env*`, force-push, `git reset --hard`, `rm -rf`, `curl | sh`,
  `npm publish`.

**Hooks**

| Hook                 | Event                    | Effect                                                                                                     |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `block-secrets.mjs`  | PreToolUse (Write/Edit)  | Blocks content that looks like an API key, token or private key (exit 2, with reason).                     |
| `format-file.mjs`    | PostToolUse (Write/Edit) | Runs Prettier on the touched file, so no turns go to formatting.                                           |
| `verify-on-stop.mjs` | Stop                     | If `src/` changed, runs `npm run verify`. On failure the agent keeps working, with the output as feedback. |

**Lint as a guardrail.** `eslint.config.js` enforces the layering table: `src/domain` cannot
import React, Expo or stores, cannot call `fetch`, and cannot call `new Date()`. Components
cannot import stores or feed clients. An agent that drifts gets a lint error, not a review
comment three days later.

## 5. The loop in practice

1. **Context before code.** The first commit with real content is `CLAUDE.md`, the docs, the
   ADRs and `.claude/`. The app came after.
2. **Pure core, test-first.** The priority model, queue filters, link safety and both feed
   parsers were written with their tests and run green before any screen existed.
3. **Thin screens.** Screens only wire hooks to components. Every decision is already
   covered by tests.
4. **Verify in a real browser**, not just in tests. The web build was driven with Playwright
   (queue → filter → search → detail → triage → about, plus an axe scan). That run surfaced
   a CORS problem the unit tests could not.
5. **Every AI diff gets read**, checked against the docs, and merged by a human.

See [`DEV_LOG.md`](../DEV_LOG.md) for what actually happened in the build session,
including what went wrong.

## 6. Using this setup in your own repo

Copy `.claude/` and the `docs/` skeleton, then rewrite `CLAUDE.md` for your stack. Keep the
three layers separate:

- **Context** tells the agent what is true.
- **Skills** tell it how work is done here.
- **Hooks and permissions** make the important parts non-optional.
