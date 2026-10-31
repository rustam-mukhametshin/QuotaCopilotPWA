import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Today } from './today';

describe('Today', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates its date at midnight', () => {
    vi.setSystemTime(new Date(2024, 1, 15, 23, 59, 59));
    TestBed.configureTestingModule({ providers: [Today] });

    const today = TestBed.inject(Today);
    expect(today.date()).toEqual(new Date(2024, 1, 15));

    vi.advanceTimersByTime(1000);

    expect(today.date()).toEqual(new Date(2024, 1, 16));
  });

  it('updates its date when the document becomes visible after a day change', () => {
    vi.setSystemTime(new Date(2024, 1, 15, 12));
    TestBed.configureTestingModule({ providers: [Today] });

    const today = TestBed.inject(Today);
    vi.setSystemTime(new Date(2024, 1, 16, 12));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(today.date()).toEqual(new Date(2024, 1, 16));
  });

  it('does not change the date when visibility is restored on the same day', () => {
    vi.setSystemTime(new Date(2024, 1, 15, 12));
    TestBed.configureTestingModule({ providers: [Today] });

    const today = TestBed.inject(Today);
    const currentDate = today.date();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(today.date()).toBe(currentDate);
  });
});
