import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/**
 * One app-wide clock for the UI. It changes only when the local calendar day changes
 * (checked every minute and whenever the app returns to the foreground), so every screen
 * scores against the same day and nothing goes stale overnight. Domain functions receive
 * it as `now` (docs/CONVENTIONS.md, "Time").
 */
let today = new Date();
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function refresh() {
  const now = new Date();
  if (dayKey(now) === dayKey(today)) return;
  today = now;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stop) {
    const timer = setInterval(refresh, 60_000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    stop = () => {
      clearInterval(timer);
      sub.remove();
      stop = undefined;
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stop?.();
  };
}

export function useToday(): Date {
  return useSyncExternalStore(subscribe, () => today);
}
