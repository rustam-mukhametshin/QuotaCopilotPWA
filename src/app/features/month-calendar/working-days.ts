/**
 * A single calendar day with today/past/weekend flags and a sequential index.
 * `index` is `null` for days that do not count towards calculations
 * (weekends when they are not included).
 */
export interface DayInfo {
  date: Date;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  index: number | null;
}

/** A week of consecutive days (Mon-Sun), may be partial at month bounds. */
export type Week = DayInfo[];

const SATURDAY = 6;
const SUNDAY = 0;

function isWeekendDay(date: Date): boolean {
  const day = date.getDay();
  return day === SATURDAY || day === SUNDAY;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDayInfo(date: Date, today: Date, isWeekend: boolean, index: number | null): DayInfo {
  return {
    date,
    isToday: isSameDay(date, today),
    isPast: date < today,
    isWeekend,
    index,
  };
}

/** Position of the day within a Monday-first week: Mon = 0 … Sun = 6. */
export function weekdayColumn(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Returns all days of the month containing `reference`, grouped into weeks
 * running Monday to Sunday; the first and last week of the month may be partial.
 * Each counted day carries a 1-based `index` from the start of the month,
 * independent of week boundaries. Weekdays are always counted; weekends are
 * counted only when `includeWeekends` is `true`, otherwise their `index` is `null`.
 */
export function getMonthWeeks(reference: Date = new Date(), includeWeekends = false): Week[] {
  const today = startOfDay(new Date());

  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: Week[] = [];
  let currentWeek: Week = [];
  let index = 0;

  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    const isWeekend = isWeekendDay(date);
    const counted = !isWeekend || includeWeekends;
    if (counted) {
      index += 1;
    }

    currentWeek.push(toDayInfo(new Date(date), today, isWeekend, counted ? index : null));

    if (date.getDay() === SUNDAY) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
