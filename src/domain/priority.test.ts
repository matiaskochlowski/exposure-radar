import { bandFor, formatPercent, PRIORITY_WEIGHTS, scoreExposure } from '@/domain/priority';
import { makeEntry, makeEpss, TEST_NOW } from '@/domain/test-builders';

const codes = (p: ReturnType<typeof scoreExposure>) => p.reasons.map((r) => r.code);

describe('scoreExposure', () => {
  it('scales EPSS linearly up to the EPSS weight', () => {
    expect(scoreExposure(makeEntry(), makeEpss({ epss: 1 }), TEST_NOW).score).toBe(PRIORITY_WEIGHTS.epssMax);
    expect(scoreExposure(makeEntry(), makeEpss({ epss: 0.5 }), TEST_NOW).score).toBe(23);
  });

  it('omits the EPSS reason when the rounded contribution is zero', () => {
    const p = scoreExposure(makeEntry(), makeEpss({ epss: 0.001 }), TEST_NOW);
    expect(p.score).toBe(0);
    expect(p.reasons).toEqual([]);
  });

  it('gives a neutral weight, flagged as such, when EPSS is missing', () => {
    const p = scoreExposure(makeEntry(), undefined, TEST_NOW);
    expect(codes(p)).toEqual(['epss-missing']);
    expect(p.score).toBe(PRIORITY_WEIGHTS.epssMissing);
  });

  it('adds the ransomware weight for known ransomware use', () => {
    const p = scoreExposure(makeEntry({ knownRansomware: true }), makeEpss({ epss: 0 }), TEST_NOW);
    expect(codes(p)).toEqual(['ransomware']);
    expect(p.score).toBe(PRIORITY_WEIGHTS.ransomware);
  });

  describe('due date', () => {
    const due = (dueDate: string) => scoreExposure(makeEntry({ dueDate }), makeEpss({ epss: 0 }), TEST_NOW);

    it('treats yesterday as overdue', () => {
      expect(codes(due('2026-10-07'))).toEqual(['overdue']);
      expect(due('2026-10-07').daysUntilDue).toBe(-1);
    });

    it('treats today as due within 7 days, not overdue', () => {
      const p = due('2026-10-08');
      expect(codes(p)).toEqual(['due-7']);
      expect(p.daysUntilDue).toBe(0);
      expect(p.reasons[0].label).toBe('KEV due date is today');
    });

    it('switches from the 7-day to the 30-day weight between day 7 and day 8', () => {
      expect(codes(due('2026-10-15'))).toEqual(['due-7']);
      expect(codes(due('2026-10-16'))).toEqual(['due-30']);
    });

    it('adds nothing for due dates more than 30 days out', () => {
      expect(codes(due('2026-11-07'))).toEqual(['due-30']);
      expect(codes(due('2026-11-08'))).toEqual([]);
    });

    it("counts the user's local day: 5pm on the due date in California is not overdue", () => {
      const laEvening = new Date('2026-10-09T00:00:00Z');
      const p = scoreExposure(makeEntry({ dueDate: '2026-10-08' }), undefined, laEvening);
      expect(p.daysUntilDue).toBe(0);
      expect(p.reasons.map((r) => r.code)).toContain('due-7');
    });
  });

  describe('recency', () => {
    const added = (dateAdded: string) =>
      scoreExposure(makeEntry({ dateAdded, dueDate: '2027-01-01' }), makeEpss({ epss: 0 }), TEST_NOW);

    it('rewards entries added in the last 30 days', () => {
      expect(codes(added('2026-09-08'))).toEqual(['new-30']);
    });

    it('gives a smaller bonus between 31 and 90 days', () => {
      expect(codes(added('2026-09-07'))).toEqual(['new-90']);
      expect(codes(added('2026-07-10'))).toEqual(['new-90']);
    });

    it('gives nothing after 90 days', () => {
      expect(codes(added('2026-07-09'))).toEqual([]);
    });
  });

  it('stays within 0–100 with every signal at its maximum', () => {
    const p = scoreExposure(
      makeEntry({ knownRansomware: true, dateAdded: '2026-10-01', dueDate: '2026-10-01' }),
      makeEpss({ epss: 1 }),
      TEST_NOW,
    );
    // epss 45 + ransomware 20 + overdue 20 + new 10. Overdue and due-soon are exclusive.
    expect(p.score).toBe(95);
    expect(p.band).toBe('critical');
  });

  it('reports every non-zero contribution so the score can be explained', () => {
    const p = scoreExposure(
      makeEntry({ knownRansomware: true, dateAdded: '2026-10-01', dueDate: '2026-10-10' }),
      makeEpss({ epss: 0.9 }),
      TEST_NOW,
    );
    expect(codes(p)).toEqual(['epss', 'ransomware', 'due-7', 'new-30']);
    expect(p.score).toBe(p.reasons.reduce((s, r) => s + r.points, 0));
    expect(p.band).toBe('critical');
  });
});

describe('bandFor', () => {
  it.each([
    [100, 'critical'],
    [70, 'critical'],
    [69, 'high'],
    [50, 'high'],
    [49, 'medium'],
    [30, 'medium'],
    [29, 'low'],
    [0, 'low'],
  ])('maps %i to %s', (score, band) => {
    expect(bandFor(score)).toBe(band);
  });
});

describe('formatPercent', () => {
  it.each([
    [0.94321, '94%'],
    [0.0512, '5.1%'],
    [0.0004, '<0.1%'],
    [0, '0.0%'],
  ])('formats %f as %s', (p, text) => {
    expect(formatPercent(p)).toBe(text);
  });
});
