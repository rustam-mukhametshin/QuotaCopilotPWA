import Dexie, { Table } from 'dexie';

export interface MonthRecord {
  key: string; // YYYY-MM format (zero-padded)
  year: number;
  month: number; // 1-12
  totalAiCredits: number | null;
  dayNotes: Record<string, string>; // YYYY-MM-DD -> note text
}

export class CalendarDb extends Dexie {
  months!: Table<MonthRecord, string>;

  constructor() {
    super('CalendarDB');
    this.version(1).stores({
      months: 'key',
    });
  }
}

export const calendarDb = new CalendarDb();

/**
 * Format month key as YYYY-MM (zero-padded).
 */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Format day key as YYYY-MM-DD (zero-padded).
 */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
