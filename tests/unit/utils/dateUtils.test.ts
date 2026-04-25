import { isDateInFuture, addMinutes, isSameDay, formatDate } from '../../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('isDateInFuture()', () => {
    it('returns true for a future date', () => {
      expect(isDateInFuture(new Date(Date.now() + 10000))).toBe(true);
    });

    it('returns false for a past date', () => {
      expect(isDateInFuture(new Date(Date.now() - 10000))).toBe(false);
    });
  });

  describe('addMinutes()', () => {
    it('adds minutes correctly', () => {
      const base = new Date('2025-01-01T10:00:00Z');
      const result = addMinutes(base, 30);
      expect(result.getTime()).toBe(base.getTime() + 30 * 60 * 1000);
    });
  });

  describe('isSameDay()', () => {
    it('returns true for the same calendar day', () => {
      const a = new Date('2025-06-15T08:00:00');
      const b = new Date('2025-06-15T20:00:00');
      expect(isSameDay(a, b)).toBe(true);
    });

    it('returns false for different days', () => {
      const a = new Date('2025-06-15T08:00:00');
      const b = new Date('2025-06-16T08:00:00');
      expect(isSameDay(a, b)).toBe(false);
    });
  });

  describe('formatDate()', () => {
    it('formats date as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2025-03-05T12:00:00'))).toBe('2025-03-05');
    });

    it('pads month and day with leading zeros', () => {
      expect(formatDate(new Date('2025-01-09T00:00:00'))).toBe('2025-01-09');
    });
  });
});
