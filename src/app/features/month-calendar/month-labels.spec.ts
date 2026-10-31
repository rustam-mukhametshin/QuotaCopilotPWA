import { describe, it, expect } from 'vitest';
import { formatMonthTitle, formatTabLabel } from './month-labels';

describe('month-labels', () => {
  describe('formatTabLabel', () => {
    it('formats month and year as short tab label for en locale', () => {
      const result = formatTabLabel(2026, 9, 'en');
      expect(result).toBe('Sep26');
    });

    it('formats with German locale', () => {
      const result = formatTabLabel(2026, 9, 'de');
      expect(result).toMatch(/26$/); // Should end with year digits
      expect(result).toContain('26');
    });

    it('formats first month correctly', () => {
      const result = formatTabLabel(2024, 1, 'en');
      expect(result).toBe('Jan24');
    });

    it('formats December correctly', () => {
      const result = formatTabLabel(2025, 12, 'en');
      expect(result).toBe('Dec25');
    });
  });

  describe('formatMonthTitle', () => {
    it('formats month and year as full title for en locale', () => {
      const result = formatMonthTitle(2026, 10, 'en');
      expect(result).toBe('October 2026');
    });

    it('formats with French locale', () => {
      const result = formatMonthTitle(2026, 10, 'fr');
      expect(result).toContain('2026');
      expect(result.length > 4).toBe(true); // Should contain more than just year
    });

    it('formats first month correctly', () => {
      const result = formatMonthTitle(2024, 1, 'en');
      expect(result).toBe('January 2024');
    });

    it('formats December correctly', () => {
      const result = formatMonthTitle(2025, 12, 'en');
      expect(result).toBe('December 2025');
    });
  });
});
