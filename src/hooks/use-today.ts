import { useState } from 'react';

/**
 * The clock for the UI. Captured once per mount so scores don't shift between renders;
 * domain functions receive it as `now` (docs/CONVENTIONS.md, "Time").
 */
export function useToday(): Date {
  const [now] = useState(() => new Date());
  return now;
}
