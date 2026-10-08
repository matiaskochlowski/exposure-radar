# ADR 0001: Expo SDK 57 with Expo Router

**Status:** accepted · 2026-10-08

## Context

The demo has to run on iOS, Android and web from one codebase, with no local Xcode or Android
Studio needed to review it.

## Decision

Use Expo SDK 57 (React Native 0.86, React 19.2) from `create-expo-app`, with Expo Router for
file-based navigation, `NativeTabs` on native, and a custom tab bar on web. The React Compiler
experiment stays enabled from the template.

## Consequences

- Reviewers can run it in Expo Go or open the web build on GitHub Pages.
- Expo changes quickly, and model training data lags behind it. `AGENTS.md` (from the
  template) tells the agent to read the versioned docs instead of trusting memory.
- With the React Compiler on, manual `useMemo` is only kept where it documents intent
  (`buildQueue`).
