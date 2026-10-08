---
name: a11y-pass
description: Accessibility review of React Native components or screens. Use before calling UI work done, or when asked to audit accessibility.
---

# Accessibility pass

Check each item against the files in scope. Fix what you can, and list what you could not.

- [ ] Every `Pressable` / `TouchableOpacity` has `accessibilityRole` (`button`, `link`, `tab`,
      `checkbox`, `radio`) and an `accessibilityLabel` that makes sense out of context
      ("Open CVE-2024-3400", not "Open").
- [ ] Toggles and selections expose state: `accessibilityState={{ selected }}` or `{ checked }`.
- [ ] Touch targets are at least 44×44pt. Use `hitSlop` for small visuals.
- [ ] Meaning is never color-only. Severity pills say "CRITICAL", overdue says "Overdue".
- [ ] Text uses theme tokens with enough contrast in **both** light and dark schemes
      (WCAG AA: 4.5:1 for body text, 3:1 for large text).
- [ ] No fixed heights on text containers, so Dynamic Type / font scaling doesn't clip text.
- [ ] Headings use `accessibilityRole="header"`.
- [ ] Loading indicators have a label. Errors are announced (`accessibilityLiveRegion="polite"`
      on Android, a focused message on iOS).
- [ ] Lists: each row reads as one sentence (set `accessible` on the row and give it a
      composed `accessibilityLabel`).

Component tests should find elements with `getByRole` / `getByLabelText`. If that is hard,
the component is probably not accessible yet.
