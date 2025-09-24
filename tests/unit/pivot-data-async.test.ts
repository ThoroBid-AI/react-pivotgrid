import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePivotTableAsync, PivotValidationError } from '../../src/components/pivot/utils/pivot-data-async';
import type { PivotConfig } from '../../src/components/pivot/types';

describe('pivot-data-async', () => {
  beforeEach(() => {
    // No need to mock setTimeout - let the async function work naturally
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Sample test data
  const sampleData = [
    { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics' },
    { region: 'North', product: 'B', sales: 150, quantity: 15, category: 'Electronics' },
    { region: 'South', product: 'A', sales: 200, quantity: 20, category: 'Electronics' },
    { region: 'South', product: 'B', sales: 120, quantity: 12, category: 'Electronics' },
    { region: 'East', product: 'A', sales: 90, quantity: 9, category: 'Electronics' },
    { region: 'West', product: 'C', sales: 160, quantity: 16, category: 'Electronics' }
  ];

  // Large dataset for testing thresholds
  const createLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      region: `Region${i % 100}`,
      product: `Product${i % 50}`,
      category: `Category${i % 10}`,
      sales: Math.random() * 1000,
      quantity: Math.floor(Math.random() * 100),
      id: i
    }));
  };

  describe('generatePivotTableAsync - Basic Functionality', () => {
    it('should generate a pivot table asynchronously', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync(sampleData, config);

      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.columnHeaders.length).toBeGreaterThan(0);
      expect(result.cells.length).toBe(result.rowHeaders.length);
      expect(result.grandTotal['sales (sum)']).toBe(820); // Sum of all sales
    });

    it('should handle empty data asynchronously', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync([], config);

      expect(result.rowHeaders).toEqual([]);
      expect(result.columnHeaders).toEqual([]);
      expect(result.cells).toEqual([]);
      expect(result.rowTotals).toEqual([]);
      expect(result.columnTotals).toEqual([]);
      expect(result.grandTotal).toEqual({ 'sales (sum)': 0 });
    });

    it('should apply filters before generating pivot table', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: [{ field: 'region', values: ['North', 'South'] }]
      };

      const result = await generatePivotTableAsync(sampleData, config);

      // Should only include North and South regions
      const regionHeaders = result.rowHeaders.map(header => header[0]);
      expect(regionHeaders).toEqual(['North', 'South']);
      expect(result.grandTotal['sales (sum)']).toBe(570); // North: 250 + South: 320
    });

    it('should handle multiple value fields asynchronously', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' },
          { field: 'sales', aggregation: 'count' }
        ],
        filters: []
      };

      const result = await generatePivotTableAsync(sampleData, config);

      const sampleCell = result.cells[0][0];
      expect(sampleCell.value).toHaveProperty('sales (sum)');
      expect(sampleCell.value).toHaveProperty('quantity (average)');
      expect(sampleCell.value).toHaveProperty('sales (count)');
    });
  });

  describe('generatePivotTableAsync - Abort Signal', () => {
    it('should abort when signal is aborted', async () => {
      const abortController = new AbortController();
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Abort immediately
      abortController.abort();

      await expect(
        generatePivotTableAsync(sampleData, config, abortController.signal)
      ).rejects.toThrow('Aborted');
    });

    it('should abort during processing when signal is aborted', async () => {
      const abortController = new AbortController();
      const largeData = createLargeDataset(200);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Start the async operation
      const promise = generatePivotTableAsync(largeData, config, abortController.signal);

      // Abort after a microtask delay to ensure the operation has started
      await new Promise(resolve => setTimeout(resolve, 1));
      abortController.abort();

      await expect(promise).rejects.toThrow('Aborted');
    });

    it('should complete successfully when signal is not aborted', async () => {
      const abortController = new AbortController();
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync(sampleData, config, abortController.signal);

      expect(result).toBeDefined();
      expect(result.rowHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('generatePivotTableAsync - Pivot Item Threshold Validation', () => {
    it('should throw PivotValidationError when row threshold is exceeded', async () => {
      // Create data that will exceed the threshold for rows
      const thresholdData = createLargeDataset(100);
      // Each item has unique region, so we'll have 100 unique regions

      const config: PivotConfig = {
        rows: ['region'], // This will create 100 unique row combinations
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const lowThreshold = 50; // Lower than the unique region count

      await expect(
        generatePivotTableAsync(thresholdData, config, undefined, lowThreshold)
      ).rejects.toThrow(PivotValidationError);

      try {
        await generatePivotTableAsync(thresholdData, config, undefined, lowThreshold);
      } catch (error) {
        expect(error).toBeInstanceOf(PivotValidationError);
        if (error instanceof PivotValidationError) {
          expect(error.fieldType).toBe('row');
          expect(error.fieldName).toBe('region');
          expect(error.distinctCount).toBeGreaterThan(lowThreshold);
        }
      }
    });

    it('should throw PivotValidationError when column threshold is exceeded', async () => {
      // Create data that will exceed the threshold for columns
      const thresholdData = createLargeDataset(80);

      const config: PivotConfig = {
        rows: [],
        columns: ['product'], // This will create 50 unique column combinations
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const lowThreshold = 30; // Lower than the unique product count

      await expect(
        generatePivotTableAsync(thresholdData, config, undefined, lowThreshold)
      ).rejects.toThrow(PivotValidationError);

      try {
        await generatePivotTableAsync(thresholdData, config, undefined, lowThreshold);
      } catch (error) {
        expect(error).toBeInstanceOf(PivotValidationError);
        if (error instanceof PivotValidationError) {
          expect(error.fieldType).toBe('column');
          expect(error.fieldName).toBe('product');
          expect(error.distinctCount).toBeGreaterThan(lowThreshold);
        }
      }
    });

    it('should succeed when threshold is not exceeded', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const highThreshold = 10000; // Much higher than our data will generate

      const result = await generatePivotTableAsync(sampleData, config, undefined, highThreshold);

      expect(result).toBeDefined();
      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.columnHeaders.length).toBeGreaterThan(0);
    });

    it('should use default threshold when not provided', async () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Should not throw with default threshold (1000) for small dataset
      const result = await generatePivotTableAsync(sampleData, config);

      expect(result).toBeDefined();
    });
  });

  describe('generatePivotTableAsync - Chunked Processing', () => {
    it('should yield control during processing of large datasets', async () => {
      const largeData = createLargeDataset(500);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync(largeData, config, undefined, 10000);

      // Verify the function completed successfully with chunked processing
      expect(result).toBeDefined();
      expect(result.rowHeaders.length).toBeGreaterThan(0);
    });

    it('should maintain data integrity with chunked processing', async () => {
      const testData = [
        { region: 'A', product: 'X', sales: 100 },
        { region: 'A', product: 'Y', sales: 200 },
        { region: 'B', product: 'X', sales: 300 },
        { region: 'B', product: 'Y', sales: 400 }
      ];

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync(testData, config, undefined, 10000);

      expect(result.grandTotal['sales (sum)']).toBe(1000);
      expect(result.cells[0][0].value['sales (sum)']).toBe(100); // A+X
      expect(result.cells[0][1].value['sales (sum)']).toBe(200); // A+Y
      expect(result.cells[1][0].value['sales (sum)']).toBe(300); // B+X
      expect(result.cells[1][1].value['sales (sum)']).toBe(400); // B+Y
    });
  });

  describe('generatePivotTableAsync - Error Handling', () => {
    it('should handle PivotValidationError with proper error properties', async () => {
      const largeUniqueData = Array.from({ length: 100 }, (_, i) => ({
        uniqueField: `unique_${i}`,
        value: i
      }));

      const config: PivotConfig = {
        rows: ['uniqueField'],
        columns: [],
        values: [{ field: 'value', aggregation: 'sum' }],
        filters: []
      };

      try {
        await generatePivotTableAsync(largeUniqueData, config, undefined, 50);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PivotValidationError);
        if (error instanceof PivotValidationError) {
          expect(error.name).toBe('PivotValidationError');
          expect(error.fieldName).toBe('uniqueField');
          expect(error.fieldType).toBe('row');
          expect(error.distinctCount).toBe(100);
          expect(error.message).toContain('uniqueField');
          expect(error.message).toContain('100');
          expect(error.message).toContain('too many unique values');
        }
      }
    });

    it('should handle nested field validation errors', async () => {
      const nestedData = createLargeDataset(200);

      const config: PivotConfig = {
        rows: ['region', 'category'], // Multiple fields
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      try {
        await generatePivotTableAsync(nestedData, config, undefined, 50);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PivotValidationError);
        if (error instanceof PivotValidationError) {
          expect(error.fieldType).toBe('row');
          expect(['region', 'category']).toContain(error.fieldName);
        }
      }
    });

    it('should handle mixed threshold violations', async () => {
      const mixedData = createLargeDataset(300);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Low threshold should trigger validation on rows first (since they're processed first)
      try {
        await generatePivotTableAsync(mixedData, config, undefined, 80);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(PivotValidationError);
        if (error instanceof PivotValidationError) {
          expect(error.fieldType).toBe('row'); // Should fail on rows first
        }
      }
    });
  });

  describe('generatePivotTableAsync - Performance and Async Behavior', () => {
    it('should complete within reasonable time for moderately large datasets', async () => {
      const performanceData = createLargeDataset(1000);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' }
        ],
        filters: []
      };

      const startTime = performance.now();
      const result = await generatePivotTableAsync(performanceData, config, undefined, 10000);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result.cells.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should be interruptible and resumable', async () => {
      const largeData = createLargeDataset(500);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Test that the function can be called multiple times without interference
      const results = await Promise.all([
        generatePivotTableAsync(largeData, config, undefined, 10000),
        generatePivotTableAsync(largeData.slice(0, 250), config, undefined, 10000)
      ]);

      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(Number(results[0].grandTotal['sales (sum)'])).toBeGreaterThan(Number(results[1].grandTotal['sales (sum)']));
    });
  });

  describe('generatePivotTableAsync - Complex Scenarios', () => {
    it('should handle complex multi-dimensional pivot with async processing', async () => {
      const complexData = createLargeDataset(200);

      const config: PivotConfig = {
        rows: ['region', 'category'],
        columns: ['product'],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' },
          { field: 'sales', aggregation: 'count' }
        ],
        filters: [
          { field: 'region', values: complexData.slice(0, 100).map(d => d.region) }
        ]
      };

      const result = await generatePivotTableAsync(complexData, config, undefined, 10000);

      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.columnHeaders.length).toBeGreaterThan(0);
      expect(result.cells.length).toBe(result.rowHeaders.length);
      expect(result.cells[0].length).toBe(result.columnHeaders.length);

      // Verify that each cell has all three value fields
      const sampleCell = result.cells[0][0];
      expect(sampleCell.value).toHaveProperty('sales (sum)');
      expect(sampleCell.value).toHaveProperty('quantity (average)');
      expect(sampleCell.value).toHaveProperty('sales (count)');
    });

    it('should maintain referential integrity across async operations', async () => {
      const referenceData = [
        { id: 1, region: 'North', product: 'A', sales: 100 },
        { id: 2, region: 'North', product: 'B', sales: 200 },
        { id: 3, region: 'South', product: 'A', sales: 150 }
      ];

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = await generatePivotTableAsync(referenceData, config);

      // Verify that the original data references are maintained in cells
      const northACell = result.cells
        .find(row => row[0].rowKeys[0] === 'North')
        ?.find(cell => cell.columnKeys[0] === 'A');

      expect(northACell).toBeDefined();
      if (northACell) {
        expect(northACell.data.length).toBe(1);
        expect(northACell.data[0].id).toBe(1);
        expect(northACell.data[0]).toBe(referenceData[0]); // Same reference
      }
    });
  });
});