# ADR 0003: No LLM or secret-bearing calls from the client

**Status:** accepted · 2026-10-08

## Context

"AI-driven" invites adding an "explain this CVE with Claude" button. Calling a model API from
a mobile or web bundle means shipping the API key to every user.

## Decision

The app makes no LLM calls and holds no secrets. AI is used to **build** the app (see
`docs/AI_WORKFLOW.md`), not inside it.

## If we add it later

Put it behind a small backend that holds the key, authenticates the caller, rate-limits, and
treats model output as untrusted. Render it as plain text and never act on it automatically.
That needs its own ADR.
