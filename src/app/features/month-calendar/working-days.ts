/** A single working day within the calendar, with a today flag, past flag, and sequential index. */
export interface DayInfo {
  date: Date;
  isToday: boolean;
  isPast: boolean;
  index: number;
}

/** A week made up of consecutive working days (Mon-Fri), may be partial at month bounds. */
export type Week = DayInfo[];

const MONDAY = 1;
const FRIDAY = 5;

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day >= MONDAY && day <= FRIDAY;
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

function toDayInfo(date: Date, today: Date, index: number): DayInfo {
  return {
    date,
    isToday: isSameDay(date, today),
    isPast: date < today,
    index,
  };
}

/**
 * Returns the working days (Mon-Fri) of the month containing `reference`,
 * grouped into weeks. A week is a consecutive run of working days from
 * Monday to Friday; the first and last week of the month may be partial.
 * Each day carries a 1-based `index` counting working days from the start
 * of the month, independent of week boundaries.
 */
export function getWorkingWeeksOfMonth(reference: Date = new Date()): Week[] {
  const today = startOfDay(new Date());

  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const weeks: Week[] = [];
  let currentWeek: Week = [];
  let index = 0;

  for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
    if (!isWorkingDay(date)) {
      continue;
    }

    index += 1;
    currentWeek.push(toDayInfo(new Date(date), today, index));

    if (date.getDay() === FRIDAY) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
