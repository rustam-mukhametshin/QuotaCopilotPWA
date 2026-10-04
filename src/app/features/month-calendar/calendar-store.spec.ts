import { TestBed } from '@angular/core/testing';
import { CalendarStore } from './calendar-store';
import type { MonthRecord } from './calendar-db';
import { calendarDb } from './calendar-db';
import { vi } from 'vitest';

describe('CalendarStore', () => {
  beforeEach(() => {
    // 2024-02-15 is a Thursday; February 2024 has 21 working days.
    vi.setSystemTime(new Date(2024, 1, 15));
    // IndexedDB is not available in the test environment: stub Dexie table calls.
    vi.spyOn(calendarDb.months, 'put').mockResolvedValue('');
    vi.spyOn(calendarDb.months, 'delete').mockResolvedValue(undefined);
    vi.spyOn(calendarDb.months, 'toArray').mockResolvedValue([]);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
      (store as any).draftState.set('2024-01', {
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

      (store as any).draftState.set('2024-01', {
        totalAiCredits: null,
        dayNotes: {},
      });

      store.selectTab('2024-01');
      store.totalAiCredits.set(1500);
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

      expect(store.totalAiCredits()).toBeNull();
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

    it('has no unsaved changes right after a new tab is added', () => {
      const store = createStoreWithFebTab();

      expect(store.hasUnsavedChanges()).toBe(false);
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
      expect(store.totalAiCredits()).toBeNull();
      expect(store.hasUnsavedChanges()).toBe(false);
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
      expect(store.hasUnsavedChanges()).toBe(false);
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
});
