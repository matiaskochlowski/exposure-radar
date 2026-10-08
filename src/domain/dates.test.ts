import { daysFrom, isIsoDay, parseIsoDay } from '@/domain/dates';

describe('timezone setup', () => {
  it('runs tests outside UTC', () => {
    expect(new Date('2026-10-08T12:00:00Z').getTimezoneOffset()).toBe(420);
  });
});

describe('daysFrom', () => {
  it('uses the local calendar day, not the UTC day', () => {
    // 17:30 on Oct 8 in Los Angeles is already Oct 9 in UTC.
    const laEvening = new Date('2026-10-09T00:30:00Z');
    expect(daysFrom(laEvening, '2026-10-08')).toBe(0);
    expect(daysFrom(laEvening, '2026-10-09')).toBe(1);
  });

  it('ignores the time of day within the local day', () => {
    expect(daysFrom(new Date(2026, 9, 8, 0, 0, 1), '2026-10-08')).toBe(0);
    expect(daysFrom(new Date(2026, 9, 8, 23, 59, 59), '2026-10-08')).toBe(0);
  });

  it('counts across a DST change without drifting', () => {
    // US DST ends 2026-11-01.
    expect(daysFrom(new Date(2026, 9, 31, 12), '2026-11-02')).toBe(2);
  });
});

describe('parseIsoDay', () => {
  it.each(['2024-02-31', '2026-13-01', '2026-00-10', '2026-10-8', '08/10/2026', ''])(
    'rejects %p',
    (value) => {
      expect(isIsoDay(value)).toBe(false);
      expect(parseIsoDay(value)).toBeNaN();
    },
  );

  it('accepts a leap day', () => {
    expect(isIsoDay('2024-02-29')).toBe(true);
  });
});
