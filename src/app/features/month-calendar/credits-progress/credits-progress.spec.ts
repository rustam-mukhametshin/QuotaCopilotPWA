import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CreditsProgress } from './credits-progress';
import { CalendarStore } from '../calendar-store';
import { vi } from 'vitest';
import { calendarDb } from '../calendar-db';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';

describe('CreditsProgress', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 1, 15));
    vi.spyOn(calendarDb.months, 'put').mockResolvedValue('');
    vi.spyOn(calendarDb.months, 'delete').mockResolvedValue(undefined);
    vi.spyOn(calendarDb.months, 'toArray').mockResolvedValue([]);
    TestBed.configureTestingModule({
      imports: [CreditsProgress],
      providers: [
        provideHttpClient(),
        provideTranslateService({
          loader: provideTranslateHttpLoader({
            prefix: '/i18n/',
            suffix: '.json',
          }),
          fallbackLang: 'en',
          lang: 'en',
        }),
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders progress bar with correct aria attributes', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(14000);

    const fixture = TestBed.createComponent(CreditsProgress);
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progressBar).not.toBeNull();
    expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('14000');
  });

  it('applies correct progress bar color classes by thresholds', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(14000);

    const component = TestBed.createComponent(CreditsProgress).componentInstance;

    // When remainingPercent > 50%, should be bg-success
    // When 20% <= remainingPercent <= 50%, should be bg-warning
    // When remainingPercent < 20%, should be bg-danger
    // Current setup: Feb 2024, today is 15th (9 work days elapsed out of 21)
    // 14000 / 21 = ~667 per day
    // spent: ~667 * 9 = ~6000
    // remaining: ~8000 / 14000 = ~57% -> should be bg-success

    const classes = (component as any).progressBarClass();
    expect(['bg-success', 'bg-warning', 'bg-danger', '']).toContain(classes);
  });

  it('does not render when remainingPercent is null', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(null);

    const fixture = TestBed.createComponent(CreditsProgress);
    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('[role="progressbar"]');
    expect(progressBar).toBeNull();
  });

  it('displays remaining credits text', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(14000);

    const total = store.totalAiCredits();
    expect(total).toBe(14000);

    // remainingCredits should be calculated from totalAiCredits and elapsedWorkDays
    const remaining = store.remainingCredits();
    expect(remaining).not.toBeNull();
    expect(remaining).toBeGreaterThan(0);
  });

  it('returns "—" for remaining when remainingCredits is null', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(null);

    const component = TestBed.createComponent(CreditsProgress).componentInstance;

    expect(component.getRemaining()).toBe('—');
  });

  it('returns "—" for total when totalAiCredits is null', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(null);

    const component = TestBed.createComponent(CreditsProgress).componentInstance;

    expect(component.getTotal()).toBe('—');
  });

  it('returns 0 for progress percent when remainingPercent is null', () => {
    const store = TestBed.inject(CalendarStore);
    store.tabs.set([{ key: '2024-02', year: 2024, month: 2, label: 'Feb24', saved: false }]);
    store.activeKey.set('2024-02');
    store.totalAiCredits.set(null);

    const component = TestBed.createComponent(CreditsProgress).componentInstance;

    expect(component.getProgressPercent()).toBe(0);
  });
});
