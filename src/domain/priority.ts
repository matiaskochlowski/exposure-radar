import { daysFrom } from '@/domain/dates';
import type { EpssScore, KevEntry, Priority, PriorityBand, PriorityReason } from '@/domain/types';

/**
 * Single source of truth for the priority model (ADR 0002). The About screen renders from
 * this object, so in-app copy cannot drift from the code.
 */
export const PRIORITY_WEIGHTS = {
  epssMax: 45,
  epssMissing: 15,
  ransomware: 20,
  overdue: 20,
  dueWithin7: 15,
  dueWithin30: 8,
  addedWithin30: 10,
  addedWithin90: 5,
} as const;

export const BAND_THRESHOLDS: readonly { band: PriorityBand; min: number }[] = [
  { band: 'critical', min: 70 },
  { band: 'high', min: 50 },
  { band: 'medium', min: 30 },
  { band: 'low', min: 0 },
];

export function bandFor(score: number): PriorityBand {
  return BAND_THRESHOLDS.find((t) => score >= t.min)?.band ?? 'low';
}

/** Explainable 0–100 priority for one KEV entry. Pure: `now` is always passed in. */
export function scoreExposure(entry: KevEntry, epss: EpssScore | undefined, now: Date): Priority {
  const w = PRIORITY_WEIGHTS;
  const reasons: PriorityReason[] = [];

  if (epss) {
    const points = Math.round(epss.epss * w.epssMax);
    if (points > 0) {
      reasons.push({
        code: 'epss',
        label: `EPSS ${formatPercent(epss.epss)} chance of exploitation in 30 days`,
        points,
      });
    }
  } else {
    reasons.push({
      code: 'epss-missing',
      label: 'No EPSS score yet (neutral weight)',
      points: w.epssMissing,
    });
  }

  if (entry.knownRansomware) {
    reasons.push({ code: 'ransomware', label: 'Known use in ransomware campaigns', points: w.ransomware });
  }

  const daysUntilDue = daysFrom(now, entry.dueDate);
  if (daysUntilDue < 0) {
    reasons.push({ code: 'overdue', label: `KEV due date passed ${-daysUntilDue}d ago`, points: w.overdue });
  } else if (daysUntilDue <= 7) {
    reasons.push({ code: 'due-7', label: dueLabel(daysUntilDue), points: w.dueWithin7 });
  } else if (daysUntilDue <= 30) {
    reasons.push({ code: 'due-30', label: dueLabel(daysUntilDue), points: w.dueWithin30 });
  }

  const daysSinceAdded = -daysFrom(now, entry.dateAdded);
  if (daysSinceAdded <= 30) {
    reasons.push({ code: 'new-30', label: 'Added to KEV in the last 30 days', points: w.addedWithin30 });
  } else if (daysSinceAdded <= 90) {
    reasons.push({ code: 'new-90', label: 'Added to KEV in the last 90 days', points: w.addedWithin90 });
  }

  const score = Math.min(
    100,
    reasons.reduce((sum, r) => sum + r.points, 0),
  );
  return { score, band: bandFor(score), reasons, daysUntilDue };
}

export function formatPercent(probability: number): string {
  const pct = probability * 100;
  if (pct > 0 && pct < 0.1) return '<0.1%';
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
}

function dueLabel(days: number): string {
  if (days === 0) return 'KEV due date is today';
  return `KEV due date in ${days}d`;
}
