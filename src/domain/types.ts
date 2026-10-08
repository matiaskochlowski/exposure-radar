/** One row of the CISA KEV catalog, after parsing and normalization. */
export type KevEntry = {
  cveId: string;
  vendor: string;
  product: string;
  name: string;
  /** ISO date (YYYY-MM-DD) the CVE was added to KEV. */
  dateAdded: string;
  /** ISO date (YYYY-MM-DD) of the KEV remediation deadline. */
  dueDate: string;
  description: string;
  requiredAction: string;
  knownRansomware: boolean;
  notes: string;
  cwes: string[];
};

export type KevCatalog = {
  catalogVersion: string;
  dateReleased: string;
  entries: KevEntry[];
  /** Rows dropped by the parser because they were malformed. */
  rejected: number;
};

export type EpssScore = {
  cveId: string;
  /** Probability of exploitation activity in the next 30 days, 0–1. */
  epss: number;
  /** Rank among all scored CVEs, 0–1. */
  percentile: number;
  /** ISO date the score was computed. */
  date: string;
};

export type PriorityBand = 'critical' | 'high' | 'medium' | 'low';

export type PriorityReason = {
  code: 'epss' | 'epss-missing' | 'ransomware' | 'overdue' | 'due-7' | 'due-30' | 'new-30' | 'new-90';
  label: string;
  points: number;
};

export type Priority = {
  score: number;
  band: PriorityBand;
  reasons: PriorityReason[];
  /** Whole days until the due date. Negative when overdue. */
  daysUntilDue: number;
};

export const TRIAGE_STATUSES = ['new', 'investigating', 'mitigated', 'accepted'] as const;
export type TriageStatus = (typeof TRIAGE_STATUSES)[number];

export type TriageRecord = {
  status: TriageStatus;
  note: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
};

/** A KEV entry joined with its EPSS score, computed priority and the user's triage state. */
export type Exposure = {
  entry: KevEntry;
  epss: EpssScore | undefined;
  priority: Priority;
  triage: TriageRecord | undefined;
};
