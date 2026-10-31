import { TestBed } from '@angular/core/testing';
import {
  INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY,
  SHOW_WEEKENDS_STORAGE_KEY,
  WeekendPreferences,
} from './weekend-preferences';

describe('WeekendPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  function create(): WeekendPreferences {
    return TestBed.inject(WeekendPreferences);
  }

  it('shows weekends and excludes them from calculations when nothing is stored', () => {
    const prefs = create();

    expect(prefs.showWeekends()).toBe(true);
    expect(prefs.defaultIncludeWeekends()).toBe(false);
  });

  it('reads stored values from localStorage', () => {
    localStorage.setItem(SHOW_WEEKENDS_STORAGE_KEY, 'false');
    localStorage.setItem(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY, 'true');

    const prefs = create();

    expect(prefs.showWeekends()).toBe(false);
    expect(prefs.defaultIncludeWeekends()).toBe(true);
  });

  it.each(['', 'yes', '1', 'TRUE', 'null'])(
    'falls back to defaults for invalid value %j',
    (raw) => {
      localStorage.setItem(SHOW_WEEKENDS_STORAGE_KEY, raw);
      localStorage.setItem(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY, raw);

      const prefs = create();

      expect(prefs.showWeekends()).toBe(true);
      expect(prefs.defaultIncludeWeekends()).toBe(false);
    },
  );

  it('setShowWeekends updates the signal and persists the value', () => {
    const prefs = create();

    prefs.setShowWeekends(false);
    expect(prefs.showWeekends()).toBe(false);
    expect(localStorage.getItem(SHOW_WEEKENDS_STORAGE_KEY)).toBe('false');

    prefs.setShowWeekends(true);
    expect(prefs.showWeekends()).toBe(true);
    expect(localStorage.getItem(SHOW_WEEKENDS_STORAGE_KEY)).toBe('true');
  });

  it('setDefaultIncludeWeekends updates the signal and persists the value', () => {
    const prefs = create();

    prefs.setDefaultIncludeWeekends(true);
    expect(prefs.defaultIncludeWeekends()).toBe(true);
    expect(localStorage.getItem(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY)).toBe('true');

    prefs.setDefaultIncludeWeekends(false);
    expect(prefs.defaultIncludeWeekends()).toBe(false);
    expect(localStorage.getItem(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY)).toBe('false');
  });

  it('setters do not affect each other', () => {
    const prefs = create();

    prefs.setShowWeekends(false);

    expect(prefs.defaultIncludeWeekends()).toBe(false);
    expect(localStorage.getItem(INCLUDE_WEEKENDS_DEFAULT_STORAGE_KEY)).toBeNull();
  });
});
