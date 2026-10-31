import { Injectable, signal } from '@angular/core';

export const SHOW_WEEKENDS_STORAGE_KEY = 'show-weekends';
export const INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY = 'include-weekends-default';

function readBoolean(key: string, fallback: boolean): boolean {
  const saved = localStorage.getItem(key);
  if (saved === 'true') {
    return true;
  }
  if (saved === 'false') {
    return false;
  }
  return fallback;
}

function writeBoolean(key: string, value: boolean): void {
  localStorage.setItem(key, String(value));
}

/** Global weekend preferences persisted in localStorage. */
@Injectable({ providedIn: 'root' })
export class WeekendPreferences {
  /** Whether Saturdays and Sundays are shown in the calendar (visual only). */
  readonly showWeekends = signal<boolean>(readBoolean(SHOW_WEEKENDS_STORAGE_KEY, true));

  /** Whether weekends count in calculations for newly created months. */
  readonly defaultIncludeWeekends = signal<boolean>(
    readBoolean(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY, false),
  );

  setShowWeekends(value: boolean): void {
    this.showWeekends.set(value);
    writeBoolean(SHOW_WEEKENDS_STORAGE_KEY, value);
  }

  setDefaultIncludeWeekends(value: boolean): void {
    this.defaultIncludeWeekends.set(value);
    writeBoolean(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY, value);
  }
}
