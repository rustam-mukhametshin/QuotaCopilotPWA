import { TestBed } from '@angular/core/testing';
import { CalendarStore } from './calendar-store';
import type { MonthRecord } from './calendar-db';
import { calendarDb } from './calendar-db';
import { vi } from 'vitest';
import { WeekendPreferences } from '../../settings/weekend-preferences';
import { DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY } from '../../settings/credits-preferences';

interface DraftStateForTest {
  totalAiCredits: number | null;
  dayNotes: Record<string, string>;
  includeWeekends?: boolean;
}

/** Access to private members of CalendarStore for white-box tests. */
interface CalendarStoreInternals {
  draftState: Map<string, DraftStateForTest>;
  applyCreditsForTab(key: string, value: number | null): void;
}

function internals(store: CalendarStore): CalendarStoreInternals {
  return store as unknown as CalendarStoreInternals;
}

function drafts(store: CalendarStore): Map<string, DraftStateForTest> {
  return internals(store).draftState;
}

describe('CalendarStore', () => {
  beforeEach(() => {
    // 2024-02-15 is a Thursday; February 2024 has 21 working days.
    vi.setSystemTime(new Date(2024, 1, 15));
    localStorage.clear();
    // IndexedDB is not available in the test environment: stub Dexie table calls.
    vi.spyOn(calendarDb.months, 'put').mockResolvedValue('');
    vi.spyOn(calendarDb.months, 'delete').mockResolvedValue(undefined);
    vi.spyOn(calendarDb.months, 'toArray').mockResolvedValue([]);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function createStore(): CalendarStore {
    return TestBed.inject(CalendarStore);
  }

  it('returns null perDayCredits when totalAiCredits is unset', () => {
    const store = createStore();

    expect(store.perDayCredits()).toBeNull();
  });

  it('returns null perDayCredits when totalAiCredits is zero', () => {
    const store = createStore();
    store.totalAiCredits.set(0);

    expect(store.perDayCredits()).toBeNull();
  });

  it('returns the correct division result when both operands are set', () => {
    const store = createStore();
    store.totalAiCredits.set(29400);

    expect(store.totalWorkDays()).toBe(21);
    expect(store.perDayCredits()).toBe(1400);
  });

  it('reflects the reference month in monthLabel', () => {
    const store = createStore();

    expect(store.monthLabel()).toContain('2024');
  });

  describe('perDayCreditsRounded', () => {
    it('returns null when perDayCredits is null', () => {
      const store = createStore();
      expect(store.perDayCreditsRounded()).toBeNull();
    });

    it('rounds the perDayCredits value using Math.round', () => {
      const store = createStore();
      store.totalAiCredits.set(1363.6363636363637 * 21); // 28634.363636...

      const rounded = store.perDayCreditsRounded();
      expect(rounded).toBe(1364); // Rounded from 1363.636...
    });

    it('rounds down when fractional part is less than 0.5', () => {
      const store = createStore();
      store.totalAiCredits.set(1363.4 * 21); // 28631.4

      const rounded = store.perDayCreditsRounded();
      expect(rounded).toBe(1363); // Rounded down from 1363.4
    });

    it('rounds up when fractional part is 0.5 or greater', () => {
      const store = createStore();
      store.totalAiCredits.set(1363.5 * 21); // 28633.5

      const rounded = store.perDayCreditsRounded();
      expect(rounded).toBe(1364); // Rounded up from 1363.5
    });
  });

  describe('selectTab', () => {
    it('switches activeKey and reference to the target tab', () => {
      const store = createStore();
      store.tabs.set([
        {
          key: '2024-01',
          year: 2024,
          month: 1,
          label: 'Jan24',
          saved: true,
        },
        {
          key: '2024-02',
          year: 2024,
          month: 2,
          label: 'Feb24',
          saved: true,
        },
      ]);

      store.selectTab('2024-01');

      expect(store.activeKey()).toBe('2024-01');
      expect(store.reference().getFullYear()).toBe(2024);
      expect(store.reference().getMonth()).toBe(0); // January
    });

    it("restores the target tab's totalAiCredits and dayNotes from draftState", () => {
      const store = createStore();
      store.tabs.set([
        {
          key: '2024-01',
          year: 2024,
          month: 1,
          label: 'Jan24',
          saved: true,
        },
        {
          key: '2024-02',
          year: 2024,
          month: 2,
          label: 'Feb24',
          saved: true,
        },
      ]);

      // Manually set up draft state
      drafts(store).set('2024-01', {
        totalAiCredits: 1000,
        dayNotes: { '2024-01-15': 'Test note' },
      });

      store.selectTab('2024-01');

      expect(store.totalAiCredits()).toBe(1000);
      expect(store.dayNotes()['2024-01-15']).toBe('Test note');
    });

    it('preserves in-progress edits on the previously active tab in draftState', () => {
      const store = createStore();
      store.tabs.set([
        {
          key: '2024-01',
          year: 2024,
          month: 1,
          label: 'Jan24',
          saved: true,
        },
        {
          key: '2024-02',
          year: 2024,
          month: 2,
          label: 'Feb24',
          saved: true,
        },
      ]);

      drafts(store).set('2024-01', {
        totalAiCredits: null,
        dayNotes: {},
      });

      store.selectTab('2024-01');
      store.setTotalAiCredits('1500');
      store.setDayNote('2024-01-10', 'New note');

      store.selectTab('2024-02');
      store.selectTab('2024-01');

      expect(store.totalAiCredits()).toBe(1500);
      expect(store.dayNotes()['2024-01-10']).toBe('New note');
    });

    it('uses empty defaults when target tab has no draftState entry', () => {
      const store = createStore();
      store.tabs.set([
        {
          key: '2024-03',
          year: 2024,
          month: 3,
          label: 'Mar24',
          saved: false,
        },
      ]);

      store.selectTab('2024-03');

      // When no draft exists, applyCreditsForTab is called with null, so dефолт is applied
      expect(store.totalAiCredits()).toBe(10000);
      expect(store.dayNotes()).toEqual({});
    });
  });

  describe('addMonthTab', () => {
    it('creates a new unsaved tab with empty state and switches to it', () => {
      const store = createStore();
      store.tabs.set([]);

      store.addMonthTab(2024, 3);

      expect(store.tabs().length).toBe(1);
      expect(store.tabs()[0].key).toBe('2024-03');
      expect(store.tabs()[0].saved).toBe(false);
      expect(store.activeKey()).toBe('2024-03');
    });

    it('reuses an existing tab instead of duplicating when the key already exists', () => {
      const store = createStore();
      store.tabs.set([
        {
          key: '2024-03',
          year: 2024,
          month: 3,
          label: 'Mar24',
          saved: true,
        },
      ]);

      store.addMonthTab(2024, 3);

      expect(store.tabs().length).toBe(1);
      expect(store.activeKey()).toBe('2024-03');
    });
  });

  describe('save', () => {
    function createStoreWithFebTab(): CalendarStore {
      const store = createStore();
      store.addMonthTab(2024, 2);
      return store;
    }

    it('has unsaved changes right after a new tab is added', () => {
      const store = createStoreWithFebTab();

      // After adding tab, dефолт is applied and differs from draft (which stores null)
      expect(store.hasUnsavedChanges()).toBe(true);
    });

    it('writes the active month record to Dexie and marks the tab as saved', async () => {
      const store = createStoreWithFebTab();
      store.totalAiCredits.set(150);
      store.setDayNote('2024-02-01', 'Note');

      await store.save();

      expect(calendarDb.months.put).toHaveBeenCalledWith({
        key: '2024-02',
        year: 2024,
        month: 2,
        totalAiCredits: 150,
        dayNotes: { '2024-02-01': 'Note' },
        includeWeekends: false,
      });
      expect(store.tabs()[0].saved).toBe(true);
    });

    it('hasUnsavedChanges becomes false after save', async () => {
      const store = createStoreWithFebTab();
      store.totalAiCredits.set(150);
      expect(store.hasUnsavedChanges()).toBe(true);

      await store.save();

      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('hasUnsavedChanges is true after a change following save and false after reverting', async () => {
      const store = createStoreWithFebTab();
      store.totalAiCredits.set(150);
      await store.save();

      store.totalAiCredits.set(200);
      expect(store.hasUnsavedChanges()).toBe(true);

      store.totalAiCredits.set(150);
      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('hasUnsavedChanges becomes true after changing a day note following save', async () => {
      const store = createStoreWithFebTab();
      await store.save();
      expect(store.hasUnsavedChanges()).toBe(false);

      store.setDayNote('2024-02-01', 'Test note');

      expect(store.hasUnsavedChanges()).toBe(true);
    });

    it('saved snapshot is not affected by later note edits', async () => {
      const store = createStoreWithFebTab();
      store.setDayNote('2024-02-01', 'A');
      await store.save();

      store.setDayNote('2024-02-01', 'B');
      store.setDayNote('2024-02-01', 'A');

      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('does nothing when there is no active tab', async () => {
      const store = createStore();

      await store.save();

      expect(calendarDb.months.put).not.toHaveBeenCalled();
    });
  });

  describe('setTotalAiCredits', () => {
    it('parses a numeric string', () => {
      const store = createStore();

      store.setTotalAiCredits('5000');

      expect(store.totalAiCredits()).toBe(5000);
    });

    it('sets null for empty or non-numeric input', () => {
      const store = createStore();
      store.totalAiCredits.set(10);

      store.setTotalAiCredits('  ');
      expect(store.totalAiCredits()).toBeNull();

      store.setTotalAiCredits('abc');
      expect(store.totalAiCredits()).toBeNull();
    });
  });

  describe('deleteTab', () => {
    it('ignores unknown keys', async () => {
      const store = createStore();
      store.addMonthTab(2024, 2);

      await store.deleteTab('1999-01');

      expect(calendarDb.months.delete).not.toHaveBeenCalled();
      expect(store.tabs()).toHaveLength(1);
    });

    it('removes the tab from Dexie and switches to the first remaining tab when active', async () => {
      const store = createStore();
      store.addMonthTab(2024, 1);
      store.addMonthTab(2024, 3);

      await store.deleteTab('2024-03');

      expect(calendarDb.months.delete).toHaveBeenCalledWith('2024-03');
      expect(store.tabs().map((t) => t.key)).toEqual(['2024-01']);
      expect(store.activeKey()).toBe('2024-01');
    });

    it('keeps the active tab when deleting an inactive one', async () => {
      const store = createStore();
      store.addMonthTab(2024, 1);
      store.addMonthTab(2024, 3);

      await store.deleteTab('2024-01');

      expect(store.activeKey()).toBe('2024-03');
    });

    it('falls back to an empty current-month tab when the last tab is deleted', async () => {
      const store = createStore();
      store.addMonthTab(2023, 5);
      store.totalAiCredits.set(100);

      await store.deleteTab('2023-05');

      expect(store.tabs()).toEqual([
        { key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false },
      ]);
      expect(store.activeKey()).toBe('2024-02');
      // After fallback, applyCreditsForTab is called with null, so default is applied
      expect(store.totalAiCredits()).toBe(10000);
      expect(store.hasUnsavedChanges()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('creates an unsaved current-month tab when Dexie is empty', async () => {
      const store = createStore();

      await store.initialize();

      expect(store.tabs()).toEqual([
        { key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false },
      ]);
      expect(store.activeKey()).toBe('2024-02');
      // When no saved records, default is applied
      expect(store.totalAiCredits()).toBe(10000);
      expect(store.hasUnsavedChanges()).toBe(true);
    });

    it('loads saved records sorted newest first and activates the most recent', async () => {
      const records: MonthRecord[] = [
        { key: '2024-01', year: 2024, month: 1, totalAiCredits: 100, dayNotes: {} },
        {
          key: '2024-03',
          year: 2024,
          month: 3,
          totalAiCredits: 300,
          dayNotes: { '2024-03-01': 'x' },
        },
        { key: '2023-12', year: 2023, month: 12, totalAiCredits: null, dayNotes: {} },
      ];
      vi.mocked(calendarDb.months.toArray).mockResolvedValue(records);
      const store = createStore();

      await store.initialize();

      expect(store.tabs().map((t) => t.key)).toEqual(['2024-03', '2024-01', '2023-12']);
      expect(store.tabs().every((t) => t.saved)).toBe(true);
      expect(store.activeKey()).toBe('2024-03');
      expect(store.totalAiCredits()).toBe(300);
      expect(store.dayNotes()).toEqual({ '2024-03-01': 'x' });
      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('runs only once', async () => {
      const store = createStore();

      await store.initialize();
      await store.initialize();

      expect(calendarDb.months.toArray).toHaveBeenCalledTimes(1);
    });
  });

  describe('setDayNote', () => {
    it('updates dayNotes immutably and sets the note for the given day', () => {
      const store = createStore();

      store.setDayNote('2024-02-10', 'Test note');

      expect(store.dayNotes()['2024-02-10']).toBe('Test note');
    });

    it('removes the entry when text is empty', () => {
      const store = createStore();
      store.dayNotes.set({ '2024-02-10': 'Existing note' });

      store.setDayNote('2024-02-10', '');

      expect(store.dayNotes()['2024-02-10']).toBeUndefined();
    });

    it('does not affect other day notes when updating one', () => {
      const store = createStore();
      store.dayNotes.set({
        '2024-02-10': 'Note 1',
        '2024-02-11': 'Note 2',
      });

      store.setDayNote('2024-02-10', 'Updated note 1');

      expect(store.dayNotes()['2024-02-10']).toBe('Updated note 1');
      expect(store.dayNotes()['2024-02-11']).toBe('Note 2');
    });

    it('trims whitespace-only text when removing notes', () => {
      const store = createStore();
      store.dayNotes.set({ '2024-02-10': 'Existing note' });

      store.setDayNote('2024-02-10', '   ');

      expect(store.dayNotes()['2024-02-10']).toBeUndefined();
    });
  });

  describe('elapsedWorkDays', () => {
    it('counts working days with isPast || isToday in current month', () => {
      const store = createStore();
      // 2024-02-15 is a Thursday; all working days before/on it are elapsed
      expect(store.elapsedWorkDays()).toBeGreaterThan(0);
      expect(store.elapsedWorkDays()).toBeLessThanOrEqual(store.totalWorkDays());
    });

    it('returns totalWorkDays for past months', () => {
      const store = createStore();
      store.reference.set(new Date(2024, 0, 15)); // January 2024 is in the past

      expect(store.elapsedWorkDays()).toBe(store.totalWorkDays());
    });

    it('returns 0 for future months', () => {
      const store = createStore();
      store.reference.set(new Date(2025, 0, 15)); // January 2025 is in the future

      expect(store.elapsedWorkDays()).toBe(0);
    });
  });

  describe('plannedSpentCredits', () => {
    it('returns null when perDayCredits is null', () => {
      const store = createStore();
      store.totalAiCredits.set(null);

      expect(store.plannedSpentCredits()).toBeNull();
    });

    it('calculates perDayCredits × elapsedWorkDays correctly', () => {
      const store = createStore();
      store.totalAiCredits.set(29400); // 1400 per day for February 2024 (21 work days)

      const planned = store.plannedSpentCredits();
      const elapsed = store.elapsedWorkDays();
      const expected = 1400 * elapsed;

      expect(planned).toBe(expected);
    });
  });

  describe('remainingCredits', () => {
    it('returns null when totalAiCredits is null', () => {
      const store = createStore();
      store.totalAiCredits.set(null);

      expect(store.remainingCredits()).toBeNull();
    });

    it('returns max(0, total - spent)', () => {
      const store = createStore();
      store.totalAiCredits.set(29400);

      const remaining = store.remainingCredits();
      const total = store.totalAiCredits();
      const spent = store.plannedSpentCredits();

      expect(remaining).toBe(Math.max(0, total! - spent!));
    });

    it('returns 0 when spent >= total', () => {
      const store = createStore();
      // Set reference to past month so elapsedWorkDays = totalWorkDays
      store.reference.set(new Date(2024, 0, 15));
      store.totalAiCredits.set(100);

      // spent will be 100 * 21 = 2100, total is 100
      const remaining = store.remainingCredits();
      expect(remaining).toBe(0);
    });
  });

  describe('remainingPercent', () => {
    it('returns null when totalAiCredits is null', () => {
      const store = createStore();
      store.totalAiCredits.set(null);

      expect(store.remainingPercent()).toBeNull();
    });

    it('returns null when totalAiCredits is 0', () => {
      const store = createStore();
      store.totalAiCredits.set(0);

      expect(store.remainingPercent()).toBeNull();
    });

    it('calculates (remaining / total) × 100', () => {
      const store = createStore();
      store.totalAiCredits.set(29400);

      const percent = store.remainingPercent();
      const total = store.totalAiCredits()!;
      const remaining = store.remainingCredits()!;

      expect(percent).toBe((remaining / total) * 100);
    });

    it('is bounded between 0 and 100', () => {
      const store = createStore();
      store.totalAiCredits.set(29400);

      const percent = store.remainingPercent();
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });

    it('returns 0 for past months', () => {
      const store = createStore();
      store.reference.set(new Date(2024, 0, 15)); // Past month
      store.totalAiCredits.set(1000);

      expect(store.remainingPercent()).toBe(0);
    });

    it('returns 100 for future months', () => {
      const store = createStore();
      store.reference.set(new Date(2025, 0, 15)); // Future month
      store.totalAiCredits.set(1000);

      expect(store.remainingPercent()).toBe(100);
    });
  });

  describe('isDefaultTotalAiCredits and applyCreditsForTab', () => {
    it('applies default when value is null', () => {
      const store = createStore();
      store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
      store.activeKey.set('2024-02');

      internals(store).applyCreditsForTab('2024-02', null);

      expect(store.totalAiCredits()).toBe(10000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('keeps flag true when key already in defaultCreditsKeys', () => {
      const store = createStore();
      store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
      store.activeKey.set('2024-02');

      internals(store).applyCreditsForTab('2024-02', null);
      internals(store).applyCreditsForTab('2024-02', 10000);

      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('sets flag to false when value is not null and key not in defaultCreditsKeys', () => {
      const store = createStore();
      store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
      store.activeKey.set('2024-02');

      internals(store).applyCreditsForTab('2024-02', 5000);

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });

    it('resets flag when setTotalAiCredits is called', () => {
      const store = createStore();
      store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
      store.activeKey.set('2024-02');

      internals(store).applyCreditsForTab('2024-02', null);
      expect(store.isDefaultTotalAiCredits()).toBe(true);

      store.setTotalAiCredits('3000');

      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });

    it('resets flag when save completes', async () => {
      const store = createStore();
      store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
      store.activeKey.set('2024-02');

      internals(store).applyCreditsForTab('2024-02', null);
      expect(store.isDefaultTotalAiCredits()).toBe(true);

      await store.save();

      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });

    it('applies default when initialize loads tab with null totalAiCredits', async () => {
      const records: MonthRecord[] = [
        { key: '2024-02', year: 2024, month: 2, totalAiCredits: null, dayNotes: {} },
      ];
      vi.mocked(calendarDb.months.toArray).mockResolvedValue(records);
      const store = createStore();

      await store.initialize();

      expect(store.totalAiCredits()).toBe(10000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('does not apply default when initialize loads tab with a value', async () => {
      const records: MonthRecord[] = [
        { key: '2024-02', year: 2024, month: 2, totalAiCredits: 5000, dayNotes: {} },
      ];
      vi.mocked(calendarDb.months.toArray).mockResolvedValue(records);
      const store = createStore();

      await store.initialize();

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });
  });

  describe('configurable default credits', () => {
    function setPreference(value: number): void {
      localStorage.setItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY, String(value));
    }

    it('defaultTotalAiCredits falls back to 10000 when the setting is not set', () => {
      const store = createStore();

      expect(store.defaultTotalAiCredits()).toBe(10000);
    });

    it('defaultTotalAiCredits equals the setting when it is set', () => {
      setPreference(5000);
      const store = createStore();

      expect(store.defaultTotalAiCredits()).toBe(5000);
    });

    it('initialize without records uses the setting', async () => {
      setPreference(5000);
      const store = createStore();

      await store.initialize();

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('addMonthTab shows the setting for a new month', () => {
      setPreference(5000);
      const store = createStore();

      store.addMonthTab(2024, 3);

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('a saved record with null totalAiCredits shows the setting', async () => {
      setPreference(5000);
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([
        { key: '2024-02', year: 2024, month: 2, totalAiCredits: null, dayNotes: {} },
      ]);
      const store = createStore();

      await store.initialize();

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('setDefaultTotalAiCredits updates the active default tab immediately', () => {
      const store = createStore();
      store.addMonthTab(2024, 2);

      store.setDefaultTotalAiCredits(7000);

      expect(store.totalAiCredits()).toBe(7000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
      expect(localStorage.getItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY)).toBe('7000');
    });

    it('setDefaultTotalAiCredits(null) restores 10000 on the active default tab', () => {
      setPreference(5000);
      const store = createStore();
      store.addMonthTab(2024, 2);

      store.setDefaultTotalAiCredits(null);

      expect(store.totalAiCredits()).toBe(10000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('setDefaultTotalAiCredits does not change a user-entered value', () => {
      const store = createStore();
      store.addMonthTab(2024, 2);
      store.setTotalAiCredits('3000');

      store.setDefaultTotalAiCredits(7000);

      expect(store.totalAiCredits()).toBe(3000);
      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });

    it('setDefaultTotalAiCredits does not change a tab saved with a number', async () => {
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([
        { key: '2024-02', year: 2024, month: 2, totalAiCredits: 5000, dayNotes: {} },
      ]);
      const store = createStore();
      await store.initialize();

      store.setDefaultTotalAiCredits(7000);

      expect(store.totalAiCredits()).toBe(5000);
      expect(store.isDefaultTotalAiCredits()).toBe(false);
    });

    it('an inactive default tab shows the new setting after selectTab', () => {
      const store = createStore();
      store.addMonthTab(2024, 1);
      store.addMonthTab(2024, 2);
      store.setTotalAiCredits('3000');

      store.setDefaultTotalAiCredits(7000);
      store.selectTab('2024-01');

      expect(store.totalAiCredits()).toBe(7000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
    });

    it('selectTab from a default tab still drafts totalAiCredits as null', () => {
      setPreference(5000);
      const store = createStore();
      store.addMonthTab(2024, 1);
      store.addMonthTab(2024, 2);

      expect(drafts(store).get('2024-01')?.totalAiCredits).toBeNull();
    });
  });
  describe('weekends', () => {
    function record(key: string, extra: Partial<MonthRecord> = {}): MonthRecord {
      const [year, month] = key.split('-').map(Number);
      return { key, year, month, totalAiCredits: 2100, dayNotes: {}, ...extra };
    }

    it('counts only weekdays when weekends are excluded', () => {
      const store = createStore();
      store.totalAiCredits.set(2100);

      expect(store.includeWeekends()).toBe(false);
      expect(store.totalWorkDays()).toBe(21);
      expect(store.perDayCredits()).toBe(100);
    });

    it('counts every day of the month when weekends are included', () => {
      const store = createStore();
      store.totalAiCredits.set(2900);

      store.includeWeekends.set(true);

      expect(store.totalWorkDays()).toBe(29);
      expect(store.perDayCredits()).toBe(100);
    });

    it('counts elapsed weekend days only when weekends are included', () => {
      const store = createStore();
      // Feb 1..15 2024: 11 weekdays + 4 weekend days
      expect(store.elapsedWorkDays()).toBe(11);

      store.includeWeekends.set(true);

      expect(store.elapsedWorkDays()).toBe(15);
    });

    it('visibleWeeks contains weekends when they are shown', () => {
      const store = createStore();

      const days = store.visibleWeeks().flat();

      expect(days).toHaveLength(29);
      expect(days.some((d) => d.isWeekend)).toBe(true);
    });

    it('visibleWeeks drops weekends and empty weeks when they are hidden', () => {
      vi.setSystemTime(new Date(2024, 8, 15)); // Sep 2024 starts on Sunday
      const store = createStore();
      const prefs = TestBed.inject(WeekendPreferences);

      prefs.setShowWeekends(false);

      const weeks = store.visibleWeeks();
      expect(weeks.flat().some((d) => d.isWeekend)).toBe(false);
      expect(weeks.flat()).toHaveLength(21);
      expect(weeks.every((w) => w.length > 0)).toBe(true);
      expect(weeks[0][0].date.getDate()).toBe(2);
    });

    it('calculations do not depend on showWeekends', () => {
      const store = createStore();
      const prefs = TestBed.inject(WeekendPreferences);
      store.totalAiCredits.set(2100);

      prefs.setShowWeekends(false);

      expect(store.weeks().flat()).toHaveLength(29);
      expect(store.totalWorkDays()).toBe(21);
      expect(store.perDayCredits()).toBe(100);
    });

    it('setIncludeWeekends changes the active flag, leaves it unsaved and updates the default', async () => {
      const store = createStore();
      const prefs = TestBed.inject(WeekendPreferences);
      store.addMonthTab(2024, 2);
      await store.save();
      expect(store.hasUnsavedChanges()).toBe(false);

      store.setIncludeWeekends(true);

      expect(store.includeWeekends()).toBe(true);
      expect(store.hasUnsavedChanges()).toBe(true);
      expect(prefs.defaultIncludeWeekends()).toBe(true);
      expect(calendarDb.months.put).toHaveBeenCalledTimes(1);
    });

    it('hasUnsavedChanges is false again after reverting the flag', async () => {
      const store = createStore();
      store.addMonthTab(2024, 2);
      await store.save();

      store.setIncludeWeekends(true);
      store.setIncludeWeekends(false);

      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('save writes includeWeekends to Dexie and clears unsaved changes', async () => {
      const store = createStore();
      store.addMonthTab(2024, 2);
      store.setTotalAiCredits('2900');
      store.setIncludeWeekends(true);

      await store.save();

      expect(calendarDb.months.put).toHaveBeenCalledWith(
        expect.objectContaining({ key: '2024-02', includeWeekends: true }),
      );
      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('initialize reads the flag from the most recent record', async () => {
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([
        record('2024-01'),
        record('2024-02', { includeWeekends: true }),
      ]);
      const store = createStore();

      await store.initialize();

      expect(store.activeKey()).toBe('2024-02');
      expect(store.includeWeekends()).toBe(true);
      expect(store.totalWorkDays()).toBe(29);
      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('initialize treats a record without the flag as excluding weekends', async () => {
      localStorage.setItem('include-weekends-default', 'true');
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([record('2024-02')]);
      const store = createStore();

      await store.initialize();

      expect(store.includeWeekends()).toBe(false);
      expect(store.totalWorkDays()).toBe(21);
      expect(store.hasUnsavedChanges()).toBe(false);
    });

    it('initialize uses defaultIncludeWeekends for the fallback tab', async () => {
      localStorage.setItem('include-weekends-default', 'true');
      const store = createStore();

      await store.initialize();

      expect(store.includeWeekends()).toBe(true);
      expect(drafts(store).get('2024-02')?.includeWeekends).toBe(true);
    });

    it('switching tabs keeps the unsaved flag in the draft and restores each tab flag', async () => {
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([
        record('2024-01'),
        record('2024-02'),
      ]);
      const store = createStore();
      await store.initialize();

      store.setIncludeWeekends(true);
      store.selectTab('2024-01');

      expect(store.includeWeekends()).toBe(false);
      expect(store.totalWorkDays()).toBe(23);

      store.selectTab('2024-02');

      expect(store.includeWeekends()).toBe(true);
      expect(store.totalWorkDays()).toBe(29);
      expect(calendarDb.months.put).not.toHaveBeenCalled();
    });

    it('does not change the flag of another saved month', async () => {
      vi.mocked(calendarDb.months.toArray).mockResolvedValue([
        record('2024-01', { includeWeekends: true }),
        record('2024-02'),
      ]);
      const store = createStore();
      await store.initialize();

      store.setIncludeWeekends(true);
      await store.save();
      store.setIncludeWeekends(false);
      store.selectTab('2024-01');

      expect(store.includeWeekends()).toBe(true);
      expect(calendarDb.months.put).toHaveBeenCalledTimes(1);
      expect(calendarDb.months.put).toHaveBeenCalledWith(
        expect.objectContaining({ key: '2024-02', includeWeekends: true }),
      );
    });

    it('selectTab falls back to defaultIncludeWeekends when the target has no draft', () => {
      const store = createStore();
      TestBed.inject(WeekendPreferences).setDefaultIncludeWeekends(true);
      store.tabs.set([{ key: '2024-03', year: 2024, month: 3, label: 'Mar24', saved: false }]);

      store.selectTab('2024-03');

      expect(store.includeWeekends()).toBe(true);
    });

    it('addMonthTab uses defaultIncludeWeekends for the new month', () => {
      const store = createStore();
      store.addMonthTab(2024, 1);
      expect(store.includeWeekends()).toBe(false);

      store.setIncludeWeekends(true);
      store.addMonthTab(2024, 3);

      expect(store.activeKey()).toBe('2024-03');
      expect(store.includeWeekends()).toBe(true);
    });

    it('fallback tab after deleting the last tab uses defaultIncludeWeekends', async () => {
      const store = createStore();
      store.addMonthTab(2023, 5);
      TestBed.inject(WeekendPreferences).setDefaultIncludeWeekends(true);

      await store.deleteTab('2023-05');

      expect(store.activeKey()).toBe('2024-02');
      expect(store.includeWeekends()).toBe(true);
      expect(drafts(store).get('2024-02')?.includeWeekends).toBe(true);
    });

    it('fallback tab after deleting the last tab excludes weekends by default', async () => {
      const store = createStore();
      store.addMonthTab(2023, 5);
      store.includeWeekends.set(true);

      await store.deleteTab('2023-05');

      expect(store.includeWeekends()).toBe(false);
    });

    it('keeps default credits drafted as null when the flag is toggled and tabs switch', () => {
      const store = createStore();
      store.addMonthTab(2024, 1);
      store.addMonthTab(2024, 2);
      expect(store.isDefaultTotalAiCredits()).toBe(true);

      store.setIncludeWeekends(true);
      store.selectTab('2024-01');

      expect(drafts(store).get('2024-02')).toEqual({
        totalAiCredits: null,
        dayNotes: {},
        includeWeekends: true,
      });

      store.selectTab('2024-02');

      expect(store.totalAiCredits()).toBe(10000);
      expect(store.isDefaultTotalAiCredits()).toBe(true);
      expect(store.includeWeekends()).toBe(true);
    });
  });
});
