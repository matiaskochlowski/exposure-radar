const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parses a YYYY-MM-DD string as a UTC calendar day. Returns NaN for anything else. */
export function parseIsoDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? NaN : time;
}

/** Start of the UTC day containing `now`. */
export function startOfUtcDay(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Whole calendar days from `now` to `isoDay`: 0 for today, negative for the past. */
export function daysFrom(now: Date, isoDay: string): number {
  return Math.round((parseIsoDay(isoDay) - startOfUtcDay(now)) / MS_PER_DAY);
}

export function isIsoDay(value: string): boolean {
  return !Number.isNaN(parseIsoDay(value));
}
