import { describe, it, expect } from 'vitest';
import { aggregate, getAggregationLabel } from '../../src/components/pivot/utils/aggregations';

describe('aggregations', () => {
  const testData = [
    { value: 10 },
    { value: 20 },
    { value: 30 },
    { value: 40 },
    { value: 50 }
  ];
  const emptyData: Record<string, unknown>[] = [];

  describe('sum', () => {
    it('should calculate sum correctly', () => {
      expect(aggregate(testData, 'value', 'sum')).toBe(150);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate(emptyData, 'value', 'sum')).toBe(0);
    });

    it('should handle null values', () => {
      const dataWithNulls = [{ value: 10 }, { value: null }, { value: 20 }];
      expect(aggregate(dataWithNulls, 'value', 'sum')).toBe(30);
    });
  });

  describe('average', () => {
    it('should calculate average correctly', () => {
      expect(aggregate(testData, 'value', 'average')).toBe(30);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate(emptyData, 'value', 'average')).toBe(0);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(aggregate(testData, 'value', 'count')).toBe(5);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate(emptyData, 'value', 'count')).toBe(0);
    });
  });

  describe('minimum', () => {
    it('should return minimum value', () => {
      expect(aggregate(testData, 'value', 'minimum')).toBe(10);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate(emptyData, 'value', 'minimum')).toBe(0);
    });

    it('should handle null values', () => {
      const dataWithNulls = [{ value: null }, { value: 20 }, { value: 10 }, { value: null }];
      expect(aggregate(dataWithNulls, 'value', 'minimum')).toBe(10);
    });
  });

  describe('maximum', () => {
    it('should return maximum value', () => {
      expect(aggregate(testData, 'value', 'maximum')).toBe(50);
    });

    it('should return 0 for empty array', () => {
      expect(aggregate(emptyData, 'value', 'maximum')).toBe(0);
    });

    it('should handle null values', () => {
      const dataWithNulls = [{ value: null }, { value: 20 }, { value: 50 }, { value: null }];
      expect(aggregate(dataWithNulls, 'value', 'maximum')).toBe(50);
    });
  });

  describe('getAggregationLabel', () => {
    it('should return correct labels', () => {
      expect(getAggregationLabel('sum')).toBe('Sum');
      expect(getAggregationLabel('count')).toBe('Count');
      expect(getAggregationLabel('average')).toBe('Average');
      expect(getAggregationLabel('minimum')).toBe('Minimum');
      expect(getAggregationLabel('maximum')).toBe('Maximum');
    });
  });
});