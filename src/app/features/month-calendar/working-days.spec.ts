import { vi } from 'vitest';
import type { DayInfo } from './working-days';
import { getMonthWeeks, weekdayColumn } from './working-days';

const isSatOrSun = (d: DayInfo): boolean => d.date.getDay() === 0 || d.date.getDay() === 6;

describe('getMonthWeeks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 1, 15, 12, 0)); // Thu, Feb 15 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns every day of the reference month in order', () => {
    const days = getMonthWeeks(new Date(2024, 1, 10)).flat();

    expect(days).toHaveLength(29);
    expect(days.map((d) => d.date.getDate())).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
    days.forEach((d) => expect(d.date.getMonth()).toBe(1));
  });

  it('splits days into Mon-Sun weeks with partial first/last weeks', () => {
    const weeks = getMonthWeeks(new Date(2024, 1, 1)); // Feb 1 2024 is Thursday

    expect(weeks.map((w) => w.length)).toEqual([4, 7, 7, 7, 4]);
    weeks.slice(0, -1).forEach((w) => expect(w[w.length - 1].date.getDay()).toBe(0));
    weeks.slice(1).forEach((w) => expect(w[0].date.getDay()).toBe(1));
    expect(weeks[4][3].date.getDate()).toBe(29);
  });

  it('handles a month starting on Monday with a full first week', () => {
    const weeks = getMonthWeeks(new Date(2024, 0, 1)); // Jan 2024

    expect(weeks[0]).toHaveLength(7);
    expect(weeks.flat()).toHaveLength(31);
  });

  it('handles a month starting on Sunday with a one-day first week', () => {
    const weeks = getMonthWeeks(new Date(2024, 8, 1)); // Sep 1 2024 is Sunday

    expect(weeks[0]).toHaveLength(1);
    expect(weeks[0][0].date.getDay()).toBe(0);
  });

  it('flags only Saturdays and Sundays as weekends', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1)).flat();

    days.forEach((d) => expect(d.isWeekend).toBe(isSatOrSun(d)));
    expect(days.filter((d) => d.isWeekend)).toHaveLength(8);
  });

  it('defaults to excluding weekends from the index', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1)).flat();

    expect(days.filter((d) => d.isWeekend).every((d) => d.index === null)).toBe(true);
  });

  it('numbers weekdays 1..N consecutively and leaves weekends null when excluded', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1), false).flat();

    days.filter((d) => d.isWeekend).forEach((d) => expect(d.index).toBeNull());
    expect(days.filter((d) => !d.isWeekend).map((d) => d.index)).toEqual(
      Array.from({ length: 21 }, (_, i) => i + 1),
    );
  });

  it('numbers every day 1..days-in-month when weekends are included', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1), true).flat();

    expect(days.map((d) => d.index)).toEqual(Array.from({ length: 29 }, (_, i) => i + 1));
    expect(days.filter((d) => d.isWeekend).every((d) => d.index !== null)).toBe(true);
  });

  it('flags today and past days relative to the current date, including weekends', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1)).flat();

    const today = days.filter((d) => d.isToday);
    expect(today).toHaveLength(1);
    expect(today[0].date.getDate()).toBe(15);
    expect(today[0].isPast).toBe(false);

    days.forEach((d) => expect(d.isPast).toBe(d.date.getDate() < 15));
    // Sat Feb 10 is a past weekend, Sat Feb 17 is a future weekend
    expect(days[9]).toMatchObject({ isWeekend: true, isPast: true, isToday: false });
    expect(days[16]).toMatchObject({ isWeekend: true, isPast: false, isToday: false });
  });

  it('marks a weekend day as today', () => {
    vi.setSystemTime(new Date(2024, 1, 17, 12, 0)); // Sat, Feb 17 2024

    const today = getMonthWeeks(new Date(2024, 1, 1))
      .flat()
      .filter((d) => d.isToday);

    expect(today).toHaveLength(1);
    expect(today[0]).toMatchObject({ isWeekend: true, isPast: false, index: null });
    expect(today[0].date.getDate()).toBe(17);
  });

  it('marks no day as today or past for a future month', () => {
    const days = getMonthWeeks(new Date(2024, 5, 1)).flat();

    expect(days.some((d) => d.isToday || d.isPast)).toBe(false);
  });

  it('uses the explicit today date for isToday and isPast flags', () => {
    const days = getMonthWeeks(new Date(2024, 1, 1), false, new Date(2024, 1, 20, 23, 45)).flat();

    expect(days.find((day) => day.isToday)?.date.getDate()).toBe(20);
    expect(days.find((day) => day.date.getDate() === 19)?.isPast).toBe(true);
    expect(days.find((day) => day.date.getDate() === 21)?.isPast).toBe(false);
  });

  it('uses the current month when no reference is given', () => {
    const days = getMonthWeeks().flat();

    expect(days).toHaveLength(29);
    expect(days[0].date.getMonth()).toBe(1);
  });
});

describe('weekdayColumn', () => {
  it('maps Monday-first positions: Mon 0 … Sun 6', () => {
    // Feb 5..11 2024 is Mon..Sun
    const columns = [5, 6, 7, 8, 9, 10, 11].map((d) => weekdayColumn(new Date(2024, 1, d)));

    expect(columns).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('returns 0 for Monday, 4 for Friday, 5 for Saturday and 6 for Sunday', () => {
    expect(weekdayColumn(new Date(2024, 1, 5))).toBe(0);
    expect(weekdayColumn(new Date(2024, 1, 9))).toBe(4);
    expect(weekdayColumn(new Date(2024, 1, 10))).toBe(5);
    expect(weekdayColumn(new Date(2024, 1, 11))).toBe(6);
  });
});
