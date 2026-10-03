import { vi } from 'vitest';
import { getWorkingWeeksOfMonth } from './working-days';

describe('getWorkingWeeksOfMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 1, 15, 12, 0)); // Thu, Feb 15 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns only Mon-Fri days of the reference month', () => {
    const days = getWorkingWeeksOfMonth(new Date(2024, 1, 10)).flat();

    expect(days).toHaveLength(21);
    days.forEach((d) => {
      expect(d.date.getMonth()).toBe(1);
      expect(d.date.getDay()).toBeGreaterThanOrEqual(1);
      expect(d.date.getDay()).toBeLessThanOrEqual(5);
    });
  });

  it('splits days into weeks ending on Friday, with partial first/last weeks', () => {
    const weeks = getWorkingWeeksOfMonth(new Date(2024, 1, 1));

    expect(weeks.map((w) => w.length)).toEqual([2, 5, 5, 5, 4]);
    expect(weeks[0][0].date.getDate()).toBe(1);
    expect(weeks[4][3].date.getDate()).toBe(29);
  });

  it('assigns a continuous 1-based index across weeks', () => {
    const indexes = getWorkingWeeksOfMonth(new Date(2024, 1, 1))
      .flat()
      .map((d) => d.index);

    expect(indexes).toEqual(Array.from({ length: 21 }, (_, i) => i + 1));
  });

  it('flags today and past days relative to the current date', () => {
    const days = getWorkingWeeksOfMonth(new Date(2024, 1, 1)).flat();

    const today = days.filter((d) => d.isToday);
    expect(today).toHaveLength(1);
    expect(today[0].date.getDate()).toBe(15);
    expect(today[0].isPast).toBe(false);

    days.forEach((d) => {
      expect(d.isPast).toBe(d.date.getDate() < 15);
    });
  });

  it('marks no day as today or past for a future month', () => {
    const days = getWorkingWeeksOfMonth(new Date(2024, 5, 1)).flat();

    expect(days.some((d) => d.isToday || d.isPast)).toBe(false);
  });

  it('handles a month starting on Monday with full first week', () => {
    const weeks = getWorkingWeeksOfMonth(new Date(2024, 0, 1)); // Jan 2024

    expect(weeks[0]).toHaveLength(5);
    expect(weeks.flat()).toHaveLength(23);
  });
});

