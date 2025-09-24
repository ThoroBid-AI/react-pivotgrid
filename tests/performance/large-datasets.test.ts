import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generatePivotTable } from '../../src/components/pivot/utils/pivot-data';
import { generatePivotTableAsync } from '../../src/components/pivot/utils/pivot-data-async';
import { aggregate } from '../../src/components/pivot/utils/aggregations';
import { transformPivotToChartData } from '../../src/components/pivot/utils/chart-data';
import { generateLargeDataset, generatePerformanceTestData } from '../fixtures/sample-data';
import { measurePerformance, measureMemoryUsage } from '../utils/test-helpers';
import type { PivotConfig, DataItem } from '../../src/components/pivot/types';

describe('Performance Tests - Large Datasets', () => {
  let memoryBefore: number | null;

  beforeEach(() => {
    memoryBefore = measureMemoryUsage();
  });

  afterEach(() => {
    // Force garbage collection if available (for memory leak detection)
    if (global.gc) {
      global.gc();
    }
  });

  describe('Aggregation Performance', () => {
    it('should handle aggregation of large datasets efficiently', async () => {
      const largeData = generateLargeDataset(10000);

      const { duration } = await measurePerformance(() => {
        return aggregate(largeData, 'sales', 'sum');
      }, 100); // Should complete in under 100ms

      expect(duration).toBeLessThan(100);

      // Verify the result is correct
      const result = aggregate(largeData, 'sales', 'sum');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should handle complex aggregations on large datasets', async () => {
      const largeData = generateLargeDataset(5000);

      const aggregationFunctions = ['sum', 'average', 'median', 'minimum', 'maximum', 'countUnique'] as const;

      for (const fn of aggregationFunctions) {
        const { duration } = await measurePerformance(() => {
          return aggregate(largeData, 'sales', fn);
        }, 200); // Allow more time for complex aggregations

        expect(duration).toBeLessThan(200);
      }
    });

    it('should maintain consistent performance across multiple runs', async () => {
      const data = generateLargeDataset(1000);
      const durations: number[] = [];

      // Run the same operation multiple times
      for (let i = 0; i < 10; i++) {
        const { duration } = await measurePerformance(() => {
          return aggregate(data, 'sales', 'sum');
        });
        durations.push(duration);
      }

      // Check that performance is consistent (no major degradation)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      // For very fast operations (< 5ms average), use absolute variance check
      // For slower operations, use relative variance check
      if (avgDuration < 5) {
        // Allow up to 10ms absolute variance for very fast operations
        expect(maxDuration - minDuration).toBeLessThan(10);
      } else {
        // No run should be 5x slower than average for normal operations
        expect(maxDuration).toBeLessThan(avgDuration * 5);
      }
    });
  });

  describe('Pivot Table Generation Performance', () => {
    it('should generate pivot table for large datasets efficiently', async () => {
      const largeData = generateLargeDataset(5000);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const { result, duration } = await measurePerformance(() => {
        return generatePivotTable(largeData, config);
      }, 1000); // Should complete in under 1 second

      expect(duration).toBeLessThan(1000);
      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.columnHeaders.length).toBeGreaterThan(0);
      expect(result.cells.length).toBe(result.rowHeaders.length);
    });

    it('should handle complex pivot configurations on large datasets', async () => {
      const largeData = generatePerformanceTestData(2000, 20, 15);

      const complexConfig: PivotConfig = {
        rows: ['row_field_1', 'row_field_2'],
        columns: ['col_field_1', 'col_field_2'],
        values: [
          { field: 'value_1', aggregation: 'sum' },
          { field: 'value_2', aggregation: 'average' },
          { field: 'value_3', aggregation: 'count' }
        ],
        filters: [
          { field: 'text_field', values: Array.from({ length: 50 }, (_, i) => `Text_${i}`) }
        ]
      };

      const { result, duration } = await measurePerformance(() => {
        return generatePivotTable(largeData, complexConfig);
      }, 5000); // Allow more time for complex operations

      expect(duration).toBeLessThan(5000);
      expect(result.cells.length).toBeGreaterThan(0);

      // Verify the result has expected structure
      if (result.cells.length > 0 && result.cells[0].length > 0) {
        const sampleCell = result.cells[0][0];
        expect(sampleCell.value).toHaveProperty('value_1 (sum)');
        expect(sampleCell.value).toHaveProperty('value_2 (average)');
        expect(sampleCell.value).toHaveProperty('value_3 (count)');
      }
    });

    it('should scale linearly with data size', async () => {
      const sizes = [1000, 2000, 4000];
      const durations: number[] = [];

      for (const size of sizes) {
        const data = generateLargeDataset(size);
        const config: PivotConfig = {
          rows: ['region'],
          columns: ['product'],
          values: [{ field: 'sales', aggregation: 'sum' }],
          filters: []
        };

        const { duration } = await measurePerformance(() => {
          return generatePivotTable(data, config);
        });

        durations.push(duration);
      }

      // Check that performance scales approximately linearly
      // (allowing for some variance due to overhead and timing precision)
      const ratio1 = durations[1] / durations[0]; // 2x data
      const ratio2 = durations[2] / durations[1]; // 2x data again

      // For very fast operations (< 10ms), use more relaxed scaling expectations
      // For normal operations, maintain tighter scaling requirements
      const maxRatio = durations[0] < 10 ? 10 : 5; // More lenient for sub-10ms operations

      expect(ratio1).toBeLessThan(maxRatio); // Should not be too much slower for 2x data
      expect(ratio2).toBeLessThan(maxRatio);

      // Also verify that the operations actually complete (no infinite duration)
      durations.forEach(duration => {
        expect(duration).toBeLessThan(5000); // Maximum 5 seconds for any single operation
        expect(duration).toBeGreaterThan(0); // Should not be zero or negative
      });
    });
  });

  describe('Async Pivot Table Performance', () => {
    it('should handle large datasets with async processing', async () => {
      const largeData = generateLargeDataset(8000);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const { result, duration } = await measurePerformance(async () => {
        return await generatePivotTableAsync(largeData, config, undefined, 50000);
      }, 3000); // Allow more time for async processing

      expect(duration).toBeLessThan(3000);
      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.cells.length).toBeGreaterThan(0);
    });

    it('should be interruptible with abort signal', async () => {
      const largeData = generateLargeDataset(10000);
      const abortController = new AbortController();

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product', 'category'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      // Start the operation
      const promise = generatePivotTableAsync(largeData, config, abortController.signal, 50000);

      // Abort after a short delay
      setTimeout(() => abortController.abort(), 50);

      await expect(promise).rejects.toThrow('Aborted');
    });

    it('should yield control during processing', async () => {
      const largeData = generateLargeDataset(3000);

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      let yieldCount = 0;
      const originalSetTimeout = global.setTimeout;

      // Mock setTimeout to count yields
      global.setTimeout = ((callback: (...args: unknown[]) => void, delay: number) => {
        if (delay === 0) {
          yieldCount++;
        }
        return originalSetTimeout(callback, delay);
      }) as typeof setTimeout;

      try {
        await generatePivotTableAsync(largeData, config, undefined, 50000);

        // Should have yielded control at least once for large datasets
        expect(yieldCount).toBeGreaterThan(0);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Chart Data Transformation Performance', () => {
    it('should transform large pivot tables to chart data efficiently', async () => {
      // First generate a large pivot table
      const largeData = generateLargeDataset(3000);
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const pivotTable = generatePivotTable(largeData, config);

      // Then transform it to chart data
      const { result, duration } = await measurePerformance(() => {
        return transformPivotToChartData(
          pivotTable,
          ['region'],
          ['product'],
          ['sales']
        );
      }, 500); // Should complete in under 500ms

      expect(duration).toBeLessThan(500);
      expect(result.data.length).toBe(pivotTable.rowHeaders.length);
      expect(result.series.length).toBe(pivotTable.columnHeaders.length);
    });

    it('should handle complex multi-dimensional transformations', async () => {
      const complexData = generatePerformanceTestData(1000, 10, 8);
      const config: PivotConfig = {
        rows: ['row_field_1', 'row_field_2'],
        columns: ['col_field_1', 'col_field_2'],
        values: [
          { field: 'value_1', aggregation: 'sum' },
          { field: 'value_2', aggregation: 'average' }
        ],
        filters: []
      };

      const pivotTable = generatePivotTable(complexData, config);

      const { result, duration } = await measurePerformance(() => {
        return transformPivotToChartData(
          pivotTable,
          ['row_field_1', 'row_field_2'],
          ['col_field_1', 'col_field_2'],
          ['value_1', 'value_2']
        );
      }, 1000);

      expect(duration).toBeLessThan(1000);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.series.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause significant memory leaks', async () => {
      if (!memoryBefore) {
        // Skip if memory measurement is not available
        return;
      }

      const initialMemory = measureMemoryUsage();

      // Perform multiple operations that should be garbage collected
      for (let i = 0; i < 10; i++) {
        const data = generateLargeDataset(1000);
        const config: PivotConfig = {
          rows: ['region'],
          columns: ['product'],
          values: [{ field: 'sales', aggregation: 'sum' }],
          filters: []
        };

        const pivotTable = generatePivotTable(data, config);
        const chartData = transformPivotToChartData(pivotTable, ['region'], ['product'], ['sales']);

        // Use the results to prevent optimization
        expect(chartData.data.length).toBeGreaterThanOrEqual(0);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = measureMemoryUsage();

      if (initialMemory && finalMemory) {
        // Memory usage should not have increased significantly
        const memoryIncrease = finalMemory - initialMemory;
        const maxAllowedIncrease = initialMemory * 0.5; // Allow 50% increase

        expect(memoryIncrease).toBeLessThan(maxAllowedIncrease);
      }
    });

    it('should handle extremely large datasets without crashing', async () => {
      // This test ensures the application doesn't crash with very large datasets
      const veryLargeData = generateLargeDataset(20000);

      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      expect(() => {
        const result = generatePivotTable(veryLargeData, config);
        expect(result).toBeDefined();
        expect(result.rowHeaders.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle high cardinality fields efficiently', async () => {
      // Generate data where each row has a unique value for a field
      const highCardinalityData = Array.from({ length: 2000 }, (_, i) => ({
        unique_id: `id_${i}`,
        region: `Region_${i % 10}`,
        value: Math.random() * 1000
      }));

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['unique_id'],
        values: [{ field: 'value', aggregation: 'sum' }],
        filters: []
      };

      const { duration } = await measurePerformance(() => {
        return generatePivotTable(highCardinalityData, config);
      }, 5000);

      expect(duration).toBeLessThan(5000);
    });

    it('should handle sparse data efficiently', async () => {
      // Generate data with many empty combinations
      const sparseData: DataItem[] = [];
      const regions = ['A', 'B', 'C', 'D', 'E'];
      const products = Array.from({ length: 20 }, (_, i) => `Product${i}`);

      // Only populate 10% of possible combinations
      for (let i = 0; i < 1000; i++) {
        sparseData.push({
          region: regions[i % 5],
          product: products[Math.floor(Math.random() * 20)],
          sales: Math.random() * 1000
        });
      }

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const { result, duration } = await measurePerformance(() => {
        return generatePivotTable(sparseData, config);
      }, 500);

      expect(duration).toBeLessThan(500);
      expect(result.rowHeaders.length).toBe(5); // All regions should be represented
      expect(result.columnHeaders.length).toBeLessThanOrEqual(20); // Products that have data
    });

    it('should handle deeply nested hierarchies efficiently', async () => {
      const nestedData: DataItem[] = [];

      // Create 4-level hierarchy: continent > country > state > city
      const continents = ['North America', 'Europe'];
      const countries = {
        'North America': ['USA', 'Canada'],
        'Europe': ['Germany', 'France']
      };
      const states = {
        'USA': ['California', 'New York', 'Texas'],
        'Canada': ['Ontario', 'Quebec'],
        'Germany': ['Bavaria', 'Berlin'],
        'France': ['Ile-de-France', 'Provence']
      };

      continents.forEach(continent => {
        countries[continent as keyof typeof countries].forEach(country => {
          states[country as keyof typeof states].forEach(state => {
            for (let i = 0; i < 50; i++) {
              nestedData.push({
                continent,
                country,
                state,
                city: `City${i}`,
                sales: Math.random() * 1000,
                id: nestedData.length + 1
              });
            }
          });
        });
      });

      const config: PivotConfig = {
        rows: ['continent', 'country', 'state'],
        columns: ['city'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const { result, duration } = await measurePerformance(() => {
        return generatePivotTable(nestedData, config);
      }, 1000);

      expect(duration).toBeLessThan(1000);
      expect(result.rowHeaders.length).toBeGreaterThan(0);
      expect(result.cells.length).toBe(result.rowHeaders.length);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent pivot operations', async () => {
      const datasets = Array.from({ length: 5 }, () => generateLargeDataset(500));

      const configs: PivotConfig[] = datasets.map((_, i) => ({
        rows: ['region'],
        columns: i % 2 === 0 ? ['product'] : ['category'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      }));

      const { result, duration } = await measurePerformance(async () => {
        const promises = datasets.map((data, i) =>
          generatePivotTableAsync(data, configs[i], undefined, 10000)
        );

        return await Promise.all(promises);
      }, 3000);

      expect(duration).toBeLessThan(3000);
      expect(result).toHaveLength(5);
      result.forEach(pivotTable => {
        expect(pivotTable.rowHeaders.length).toBeGreaterThan(0);
      });
    });
  });
});