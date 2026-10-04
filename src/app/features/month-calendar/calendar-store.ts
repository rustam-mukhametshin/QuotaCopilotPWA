import { Injectable, computed, signal } from '@angular/core';
import type { Week } from './working-days';
import { getWorkingWeeksOfMonth } from './working-days';
import { monthKey, calendarDb } from './calendar-db';

export const DEFAULT_TOTAL_AI_CREDITS = 10000;

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
  readonly isDefaultTotalAiCredits = signal(false);

  private draftState = new Map<string, DraftState>();
  private draftVersion = signal(0);
  private defaultCreditsKeys = new Set<string>();
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

  readonly elapsedWorkDays = computed<number>(() => {
    const allDays = this.weeks().flat();
    return allDays.filter((day) => day.isPast || day.isToday).length;
  });

  readonly plannedSpentCredits = computed<number | null>(() => {
    const perDay = this.perDayCredits();
    const elapsed = this.elapsedWorkDays();
    return perDay === null ? null : perDay * elapsed;
  });

  readonly remainingCredits = computed<number | null>(() => {
    const total = this.totalAiCredits();
    const spent = this.plannedSpentCredits();
    if (total === null || spent === null) {
      return null;
    }
    return Math.max(0, total - spent);
  });

  readonly remainingPercent = computed<number | null>(() => {
    const total = this.totalAiCredits();
    const remaining = this.remainingCredits();
    if (total === null || total === 0 || remaining === null) {
      return null;
    }
    const percent = (remaining / total) * 100;
    return Math.max(0, Math.min(100, percent));
  });

  readonly monthLabel = computed<string>(() =>
    this.reference().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  readonly hasUnsavedChanges = computed<boolean>(() => {
    this.draftVersion(); // Track draft state changes
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
     // User changed the value: remove from default credits and mark flag as false
     const activeKey = this.activeKey();
     this.defaultCreditsKeys.delete(activeKey);
     this.isDefaultTotalAiCredits.set(false);
   }

  private setDraft(key: string, state: DraftState): void {
    this.draftState.set(key, state);
    this.draftVersion.update((v) => v + 1);
  }

  private deleteDraft(key: string): void {
    this.draftState.delete(key);
    this.draftVersion.update((v) => v + 1);
  }

  /**
   * Apply credits for a tab: if value is null, use default and mark as default;
   * if key is already in defaultCreditsKeys, keep the flag true;
   * otherwise set value and mark flag as false.
   */
  private applyCreditsForTab(key: string, value: number | null): void {
    if (value === null) {
      this.totalAiCredits.set(DEFAULT_TOTAL_AI_CREDITS);
      this.defaultCreditsKeys.add(key);
      this.isDefaultTotalAiCredits.set(true);
    } else if (this.defaultCreditsKeys.has(key)) {
      // Default was set previously and not changed by user, keep flag true
      this.isDefaultTotalAiCredits.set(true);
    } else {
      this.totalAiCredits.set(value);
      this.isDefaultTotalAiCredits.set(false);
    }
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
   * Build an unsaved fallback tab for the current month without mutating any state.
   */
  private createFallbackTab(): MonthTab {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    return {
      key: monthKey(year, month),
      year,
      month,
      label: this.generateTabLabel(year, month),
      saved: false,
    };
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
       const fallbackTab = this.createFallbackTab();

       this.tabs.set([fallbackTab]);
       this.setDraft(fallbackTab.key, {
         totalAiCredits: null,
         dayNotes: {},
       });
       this.activeKey.set(fallbackTab.key);
       this.reference.set(new Date(fallbackTab.year, fallbackTab.month - 1, 1));
       this.applyCreditsForTab(fallbackTab.key, null);
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
      this.setDraft(record.key, {
        totalAiCredits: record.totalAiCredits,
        dayNotes: { ...record.dayNotes },
      });
    });

     // Activate the most recent tab (first in sorted array)
     const mostRecentKey = newTabs[0].key;
     this.activeKey.set(mostRecentKey);
     const mostRecentRecord = records[0];
     this.reference.set(new Date(mostRecentRecord.year, mostRecentRecord.month - 1, 1));
     this.dayNotes.set({ ...mostRecentRecord.dayNotes });
     this.applyCreditsForTab(mostRecentKey, mostRecentRecord.totalAiCredits);
  }

   /**
    * Switch to an existing tab, persisting current tab's state and loading target tab's state.
    */
   selectTab(key: string): void {
     const currentKey = this.activeKey();
     if (currentKey) {
       // When saving the departing tab: if it's marked as default, save null (not 10000)
       const creditsValue = this.defaultCreditsKeys.has(currentKey) ? null : this.totalAiCredits();
       this.setDraft(currentKey, {
         totalAiCredits: creditsValue,
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
     this.applyCreditsForTab(key, draft?.totalAiCredits ?? null);
     this.dayNotes.set(draft ? { ...draft.dayNotes } : {});
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
    this.setDraft(key, {
      totalAiCredits: null,
      dayNotes: {},
    });
    this.selectTab(key);
  }

   /**
    * Delete a month tab by key. Unknown keys are ignored.
    */
   async deleteTab(key: string): Promise<void> {
     const tab = this.tabs().find((t) => t.key === key);
     if (!tab) {
       return;
     }

     await calendarDb.months.delete(key);
     this.deleteDraft(key);
     this.defaultCreditsKeys.delete(key);
     this.tabs.update((tabs) => tabs.filter((t) => t.key !== key));

     if (this.activeKey() !== key) {
       return;
     }

     const remaining = this.tabs();
     if (remaining.length > 0) {
       // Clear the active key first so selectTab does not re-create a draft for the deleted tab
       this.activeKey.set('');
       this.selectTab(remaining[0].key);
       return;
     }

     // Last tab was removed: fall back to an empty tab for the current month
     const fallback = this.createFallbackTab();
     this.tabs.set([fallback]);
     this.setDraft(fallback.key, {
       totalAiCredits: null,
       dayNotes: {},
     });
     this.activeKey.set(fallback.key);
     this.reference.set(new Date(fallback.year, fallback.month - 1, 1));
     this.dayNotes.set({});
     this.applyCreditsForTab(fallback.key, null);
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
     this.setDraft(activeKey, {
       totalAiCredits: record.totalAiCredits,
       dayNotes: record.dayNotes,
     });

     // Mark the tab as saved
     this.tabs.update((tabs) => tabs.map((t) => (t.key === activeKey ? { ...t, saved: true } : t)));

     // After saving, the value is no longer considered default
     this.defaultCreditsKeys.delete(activeKey);
     this.isDefaultTotalAiCredits.set(false);
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
