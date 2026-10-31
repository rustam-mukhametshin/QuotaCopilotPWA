import { TestBed } from '@angular/core/testing';
import { CreditsPreferences, DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY } from './credits-preferences';

describe('CreditsPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  function create(): CreditsPreferences {
    return TestBed.inject(CreditsPreferences);
  }

  it('uses the storage key "default-total-ai-credits"', () => {
    expect(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY).toBe('default-total-ai-credits');
  });

  it('is null when nothing is stored', () => {
    expect(create().defaultTotalAiCredits()).toBeNull();
  });

  it('reads a stored positive number', () => {
    localStorage.setItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY, '5000');

    expect(create().defaultTotalAiCredits()).toBe(5000);
  });

  it.each(['abc', '0', '-5', 'Infinity', 'NaN'])('is null for invalid stored value %j', (raw) => {
    localStorage.setItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY, raw);

    expect(create().defaultTotalAiCredits()).toBeNull();
  });

  it('setDefaultTotalAiCredits persists the value and updates the signal', () => {
    const prefs = create();

    prefs.setDefaultTotalAiCredits(5000);

    expect(prefs.defaultTotalAiCredits()).toBe(5000);
    expect(localStorage.getItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY)).toBe('5000');
  });

  it('setDefaultTotalAiCredits(null) removes the key and resets the signal', () => {
    const prefs = create();
    prefs.setDefaultTotalAiCredits(5000);

    prefs.setDefaultTotalAiCredits(null);

    expect(prefs.defaultTotalAiCredits()).toBeNull();
    expect(localStorage.getItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY)).toBeNull();
  });

  it.each([0, -3, NaN, Infinity])('treats invalid value %s like null', (value) => {
    const prefs = create();
    prefs.setDefaultTotalAiCredits(5000);

    prefs.setDefaultTotalAiCredits(value);

    expect(prefs.defaultTotalAiCredits()).toBeNull();
    expect(localStorage.getItem(DEFAULT_TOTAL_AI_CREDITS_STORAGE_KEY)).toBeNull();
  });
});
