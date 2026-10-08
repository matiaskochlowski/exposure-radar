---
name: new-screen
description: Add a new Expo Router screen or tab that follows the project's layering, theming and accessibility conventions.
---

# New screen

1. Read `docs/ARCHITECTURE.md` (routes table) and `docs/CONVENTIONS.md` (layers).
2. Put the route file under `src/app/`. Tabs go in `src/app/(tabs)/` **and** need a trigger in
   both `src/components/app-tabs.tsx` (native) and `app-tabs.web.tsx` (web).
3. Keep the screen thin:
   - data comes from hooks in `src/data/queries.ts`
   - decisions come from `src/domain/` (add them there first, with the `domain-tdd` skill)
   - presentation comes from `src/components/`
4. Use `Screen` from `src/components/screen.tsx` for the safe area, background and max width.
   Use `ThemedText` and `useTheme()` for every color.
5. Handle all three states: loading (`ActivityIndicator` with an `accessibilityLabel`),
   error (message plus a retry button), and empty (one sentence saying what to do next).
6. Add the route to the routes table in `docs/ARCHITECTURE.md`.
7. Run the `a11y-pass` skill on the new files, then `npm run verify`.
