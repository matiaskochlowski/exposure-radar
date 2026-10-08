const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parses a YYYY-MM-DD string to a day number (midnight UTC of that date, used only for
 * day arithmetic). Returns NaN for anything malformed, including impossible dates.
 */
export function parseIsoDay(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) return NaN;
  return time;
}

/**
 * The user's local calendar day containing `now`, on the same scale as `parseIsoDay`.
 * KEV dates are calendar days, so "today" is whatever day it is where the user is.
 */
export function localDay(now: Date): number {
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole calendar days from `now` (local) to `isoDay`: 0 for today, negative for the past. */
export function daysFrom(now: Date, isoDay: string): number {
  return Math.round((parseIsoDay(isoDay) - localDay(now)) / MS_PER_DAY);
}

export function isIsoDay(value: string): boolean {
  return !Number.isNaN(parseIsoDay(value));
}
