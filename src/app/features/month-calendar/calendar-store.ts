import { Injectable, computed, signal } from '@angular/core';
import { getWorkingWeeksOfMonth, Week } from './working-days';
import { monthKey, calendarDb } from './calendar-db';

export interface MonthTab {
  key: string; // YYYY-MM format
  year: number;
  month: number; // 1-12
  label: string; // e.g. "Sep26"
  saved: boolean;
}

interface DraftState {
  totalAiCredits: number | null;
  dayNotes: Record<string, string>;
}

/** Shared state for the month calendar: reference month, AI credits budget, and derived values. */
@Injectable({ providedIn: 'root' })
export class CalendarStore {
  readonly reference = signal(new Date());
  readonly totalAiCredits = signal<number | null>(null);
  readonly dayNotes = signal<Record<string, string>>({});

  // Multi-month/tabs state
  readonly tabs = signal<MonthTab[]>([]);
  readonly activeKey = signal<string>('');

  private draftState = new Map<string, DraftState>();
  private initialized = false;

  readonly weeks = computed<Week[]>(() => getWorkingWeeksOfMonth(this.reference()));

  readonly totalWorkDays = computed<number>(() =>
    this.weeks().reduce((sum, week) => sum + week.length, 0),
  );

  readonly perDayCredits = computed<number | null>(() => {
    const total = this.totalAiCredits();
    const workDays = this.totalWorkDays();
    return total && workDays ? total / workDays : null;
  });

  readonly perDayCreditsRounded = computed<number | null>(() => {
    const value = this.perDayCredits();
    return value === null ? null : Math.round(value);
  });

  readonly monthLabel = computed<string>(() =>
    this.reference().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  readonly hasUnsavedChanges = computed<boolean>(() => {
    const key = this.activeKey();
    const draft = this.draftState.get(key);

    // No draft means there are unsaved changes (new or uninitialized state)
    if (!draft) {
      return true;
    }

    // Compare totalAiCredits
    if (this.totalAiCredits() !== draft.totalAiCredits) {
      return true;
    }

    // Deep compare dayNotes: check keys and values
    const currentNotes = this.dayNotes();
    const draftNotes = draft.dayNotes;
    const currentKeys = Object.keys(currentNotes).sort();
    const draftKeys = Object.keys(draftNotes).sort();

    if (currentKeys.length !== draftKeys.length) {
      return true;
    }

    for (let i = 0; i < currentKeys.length; i++) {
      if (
        currentKeys[i] !== draftKeys[i] ||
        currentNotes[currentKeys[i]] !== draftNotes[draftKeys[i]]
      ) {
        return true;
      }
    }

    return false;
  });

  setTotalAiCredits(value: string): void {
    const parsed = value.trim() === '' ? null : Number(value);
    this.totalAiCredits.set(parsed !== null && !Number.isNaN(parsed) ? parsed : null);
  }

  /**
   * Generate Excel-style label from year and month (e.g., "Sep26").
   */
  private generateTabLabel(year: number, month: number): string {
    const date = new Date(year, month - 1, 1);
    const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
    const yearStr = String(year).slice(-2);
    return `${monthStr}${yearStr}`;
  }

  /**
   * Initialize the store: load saved months from Dexie, set up tabs and draft state.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    const records = await calendarDb.months.toArray();

    if (records.length === 0) {
      // No saved records: create a fallback tab for today's month
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const key = monthKey(year, month);

      const fallbackTab: MonthTab = {
        key,
        year,
        month,
        label: this.generateTabLabel(year, month),
        saved: false,
      };

      this.tabs.set([fallbackTab]);
      this.draftState.set(key, {
        totalAiCredits: null,
        dayNotes: {},
      });
      this.activeKey.set(key);
      this.reference.set(new Date(year, month - 1, 1));
      return;
    }

    // Sort records by year/month chronologically (descending, most recent first)
    records.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Build tabs from records, all marked as saved: true
    const newTabs: MonthTab[] = records.map((record) => ({
      key: record.key,
      year: record.year,
      month: record.month,
      label: this.generateTabLabel(record.year, record.month),
      saved: true,
    }));

    this.tabs.set(newTabs);

    // Seed draftState with persisted data for each tab
    records.forEach((record) => {
      this.draftState.set(record.key, {
        totalAiCredits: record.totalAiCredits,
        dayNotes: record.dayNotes,
      });
    });

    // Activate the most recent tab (first in sorted array)
    const mostRecentKey = newTabs[0].key;
    this.activeKey.set(mostRecentKey);
    const mostRecentRecord = records[0];
    this.reference.set(new Date(mostRecentRecord.year, mostRecentRecord.month - 1, 1));
    this.totalAiCredits.set(mostRecentRecord.totalAiCredits);
    this.dayNotes.set({ ...mostRecentRecord.dayNotes });
  }

  /**
   * Switch to an existing tab, persisting current tab's state and loading target tab's state.
   */
  selectTab(key: string): void {
    const currentKey = this.activeKey();
    if (currentKey) {
      this.draftState.set(currentKey, {
        totalAiCredits: this.totalAiCredits(),
        dayNotes: { ...this.dayNotes() },
      });
    }

    const tab = this.tabs().find((t) => t.key === key);
    if (!tab) {
      return;
    }

    this.activeKey.set(key);
    const firstDay = new Date(tab.year, tab.month - 1, 1);
    this.reference.set(firstDay);

    const draft = this.draftState.get(key);
    if (draft) {
      this.totalAiCredits.set(draft.totalAiCredits);
      this.dayNotes.set(draft.dayNotes);
    } else {
      this.totalAiCredits.set(null);
      this.dayNotes.set({});
    }
  }

  /**
   * Add a new unsaved month tab (or switch to existing if already present).
   */
  addMonthTab(year: number, month: number): void {
    const key = monthKey(year, month);
    const existingTab = this.tabs().find((t) => t.key === key);
    if (existingTab) {
      this.selectTab(key);
      return;
    }

    const newTab: MonthTab = {
      key,
      year,
      month,
      label: this.generateTabLabel(year, month),
      saved: false,
    };

    this.tabs.update((tabs) => [...tabs, newTab]);
    this.draftState.set(key, {
      totalAiCredits: null,
      dayNotes: {},
    });
    this.selectTab(key);
  }

  /**
   * Save the currently active month's state to Dexie and mark the tab as saved.
   */
  async save(): Promise<void> {
    const activeKey = this.activeKey();
    if (!activeKey) {
      return;
    }

    const tab = this.tabs().find((t) => t.key === activeKey);
    if (!tab) {
      return;
    }

    // Build a MonthRecord from the current live state
    const record = {
      key: activeKey,
      year: tab.year,
      month: tab.month,
      totalAiCredits: this.totalAiCredits(),
      dayNotes: { ...this.dayNotes() },
    };

    // Write to Dexie
    await calendarDb.months.put(record);

    // Update draftState to match what was just saved
    this.draftState.set(activeKey, {
      totalAiCredits: record.totalAiCredits,
      dayNotes: record.dayNotes,
    });

    // Mark the tab as saved
    this.tabs.update((tabs) => tabs.map((t) => (t.key === activeKey ? { ...t, saved: true } : t)));
  }

  /**
   * Set or update a note for a specific day (identified by date key YYYY-MM-DD).
   * If text is empty, the note entry is removed.
   */
  setDayNote(dateKey: string, text: string): void {
    this.dayNotes.update((notes) => {
      const updated = { ...notes };
      if (text.trim() === '') {
        delete updated[dateKey];
      } else {
        updated[dateKey] = text;
      }
      return updated;
    });
  }
}
