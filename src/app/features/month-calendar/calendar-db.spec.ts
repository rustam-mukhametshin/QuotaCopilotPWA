import { describe, it, expect } from 'vitest';
import { monthKey, dayKey } from './calendar-db';

describe('calendar-db helpers', () => {
  describe('monthKey', () => {
    it('formats month key as YYYY-MM with zero-padded month', () => {
      expect(monthKey(2024, 1)).toBe('2024-01');
      expect(monthKey(2024, 9)).toBe('2024-09');
      expect(monthKey(2024, 12)).toBe('2024-12');
    });

    it('handles different years correctly', () => {
      expect(monthKey(2023, 5)).toBe('2023-05');
      expect(monthKey(2025, 11)).toBe('2025-11');
    });

    it('produces stable, consistent keys for the same inputs', () => {
      const key1 = monthKey(2024, 6);
      const key2 = monthKey(2024, 6);
      expect(key1).toBe(key2);
    });
  });

  describe('dayKey', () => {
    it('formats day key as YYYY-MM-DD with zero-padded components', () => {
      const date = new Date(2024, 1, 5); // February 5, 2024
      expect(dayKey(date)).toBe('2024-02-05');
    });

    it('handles single-digit days correctly', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      expect(dayKey(date)).toBe('2024-01-01');
    });

    it('handles double-digit days correctly', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      expect(dayKey(date)).toBe('2024-03-15');
    });

    it('handles end-of-month dates correctly', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      expect(dayKey(date)).toBe('2024-02-29');
    });

    it('produces stable, consistent keys for the same date', () => {
      const date = new Date(2024, 8, 15); // September 15, 2024
      const key1 = dayKey(date);
      const key2 = dayKey(date);
      expect(key1).toBe(key2);
    });

    it('produces different keys for different dates', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 2);
      expect(dayKey(date1)).not.toBe(dayKey(date2));
    });
  });
});
