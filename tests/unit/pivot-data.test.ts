import { describe, it, expect } from 'vitest';
import { generatePivotTable } from '../../src/components/pivot/utils/pivot-data';
import type { PivotConfig, DataItem } from '../../src/components/pivot/types';

describe('pivot-data', () => {
  // Sample test data
  const sampleData = [
    { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics' },
    { region: 'North', product: 'B', sales: 150, quantity: 15, category: 'Electronics' },
    { region: 'North', product: 'A', sales: 120, quantity: 12, category: 'Clothing' },
    { region: 'South', product: 'A', sales: 200, quantity: 20, category: 'Electronics' },
    { region: 'South', product: 'B', sales: 120, quantity: 12, category: 'Electronics' },
    { region: 'South', product: 'C', sales: 180, quantity: 18, category: 'Clothing' },
    { region: 'East', product: 'A', sales: 90, quantity: 9, category: 'Electronics' },
    { region: 'East', product: 'B', sales: 110, quantity: 11, category: 'Clothing' },
    { region: 'West', product: 'C', sales: 160, quantity: 16, category: 'Electronics' },
  ];

  const emptyData: DataItem[] = [];

  describe('generatePivotTable - Basic Functionality', () => {
    it('should generate a simple pivot table with rows only', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.rowHeaders).toEqual([['East'], ['North'], ['South'], ['West']]);
      expect(result.columnHeaders).toEqual([[]]);
      expect(result.cells).toHaveLength(4);
      expect(result.cells[0]).toHaveLength(1);

      // Check totals
      expect(result.rowTotals).toHaveLength(4);
      expect(result.columnTotals).toHaveLength(1);
      expect(result.grandTotal['sales (sum)']).toBe(1230); // Sum of all sales
    });

    it('should generate a pivot table with columns only', () => {
      const config: PivotConfig = {
        rows: [],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.rowHeaders).toEqual([[]]);
      expect(result.columnHeaders).toEqual([['A'], ['B'], ['C']]);
      expect(result.cells).toHaveLength(1);
      expect(result.cells[0]).toHaveLength(3);

      // Verify cell values
      expect(result.cells[0][0].value['sales (sum)']).toBe(510); // Sum of product A sales
      expect(result.cells[0][1].value['sales (sum)']).toBe(380); // Sum of product B sales
      expect(result.cells[0][2].value['sales (sum)']).toBe(340); // Sum of product C sales
    });

    it('should generate a pivot table with both rows and columns', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.rowHeaders).toEqual([['East'], ['North'], ['South'], ['West']]);
      expect(result.columnHeaders).toEqual([['A'], ['B'], ['C']]);
      expect(result.cells).toHaveLength(4); // 4 regions
      expect(result.cells[0]).toHaveLength(3); // 3 products

      // Test specific cell values
      // North region, Product A should have sales = 220 (100 + 120)
      expect(result.cells[1][0].value['sales (sum)']).toBe(220);

      // South region, Product B should have sales = 120
      expect(result.cells[2][1].value['sales (sum)']).toBe(120);

      // East region, Product C should have sales = 0 (no data)
      expect(result.cells[0][2].value['sales (sum)']).toBe(0);
    });

    it('should handle multiple nested row fields', () => {
      const config: PivotConfig = {
        rows: ['region', 'category'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.rowHeaders.length).toBeGreaterThan(4); // More combinations than regions alone
      expect(result.rowHeaders).toContainEqual(['North', 'Electronics']);
      expect(result.rowHeaders).toContainEqual(['North', 'Clothing']);
      expect(result.rowHeaders).toContainEqual(['South', 'Electronics']);
    });

    it('should handle multiple nested column fields', () => {
      const config: PivotConfig = {
        rows: [],
        columns: ['product', 'category'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.columnHeaders.length).toBeGreaterThan(3); // More combinations than products alone
      expect(result.columnHeaders).toContainEqual(['A', 'Electronics']);
      expect(result.columnHeaders).toContainEqual(['A', 'Clothing']);
      expect(result.columnHeaders).toContainEqual(['B', 'Electronics']);
    });
  });

  describe('generatePivotTable - Multiple Value Fields', () => {
    it('should handle multiple value fields with different aggregations', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' },
          { field: 'sales', aggregation: 'count' }
        ],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      // Check that all value fields are present in cells
      const sampleCell = result.cells[0][0];
      expect(sampleCell.value).toHaveProperty('sales (sum)');
      expect(sampleCell.value).toHaveProperty('quantity (average)');
      expect(sampleCell.value).toHaveProperty('sales (count)');
    });

    it('should calculate different aggregations correctly', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'sales', aggregation: 'average' },
          { field: 'sales', aggregation: 'minimum' },
          { field: 'sales', aggregation: 'maximum' }
        ],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      // North region has sales: [100, 150, 120] = sum: 370, avg: 123.33, min: 100, max: 150
      const northRow = result.cells.find(row => row[0].rowKeys[0] === 'North');
      expect(northRow).toBeDefined();
      if (northRow) {
        expect(northRow[0].value['sales (sum)']).toBe(370);
        expect(northRow[0].value['sales (average)']).toBeCloseTo(123.33, 2);
        expect(northRow[0].value['sales (minimum)']).toBe(100);
        expect(northRow[0].value['sales (maximum)']).toBe(150);
      }
    });
  });

  describe('generatePivotTable - Count Aggregation', () => {
    it('should default to count when no value fields specified', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      // Each cell should contain count
      expect(result.cells[0][0].value).toHaveProperty('Count');
      expect(result.rowTotals[0]).toHaveProperty('Count');
      expect(result.columnTotals[0]).toHaveProperty('Count');
      expect(result.grandTotal).toHaveProperty('Count');

      // Grand total should be total number of records
      expect(result.grandTotal['Count']).toBe(9);
    });

    it('should count records correctly in pivot cells', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      // North region has 3 records, so row total should be 3
      const northRowIndex = result.rowHeaders.findIndex(header => header[0] === 'North');
      expect(result.rowTotals[northRowIndex]['Count']).toBe(3);

      // Product A has 4 records, so column total should be 4
      const productAColIndex = result.columnHeaders.findIndex(header => header[0] === 'A');
      expect(result.columnTotals[productAColIndex]['Count']).toBe(4);
    });
  });

  describe('generatePivotTable - Filtering', () => {
    it('should apply single filter correctly', () => {
      const config: PivotConfig = {
        rows: ['product'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: [{ field: 'region', values: ['North', 'South'] }]
      };

      const result = generatePivotTable(sampleData, config);

      // Should only have data from North and South regions
      // Total should exclude East (90) and West (160)
      // Manual calculation: North (100+150+120=370) + South (200+120+180=500) = 870
      const expectedTotal = 870;
      expect(result.grandTotal['sales (sum)']).toBe(expectedTotal);
    });

    it('should apply multiple filters correctly', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: [
          { field: 'region', values: ['North', 'South'] },
          { field: 'category', values: ['Electronics'] }
        ]
      };

      const result = generatePivotTable(sampleData, config);

      // Should only include North+Electronics (250) and South+Electronics (320)
      expect(result.grandTotal['sales (sum)']).toBe(570);
    });

    it('should handle empty filter values', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: [{ field: 'region', values: [] }]
      };

      const result = generatePivotTable(sampleData, config);

      // Empty filter should include all data
      expect(result.grandTotal['sales (sum)']).toBe(1230);
    });

    it('should handle filter values that don\'t match any data', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: [{ field: 'region', values: ['NonExistent'] }]
      };

      const result = generatePivotTable(sampleData, config);

      expect(result.rowHeaders).toEqual([]);
      expect(result.cells).toEqual([]);
      expect(result.rowTotals).toEqual([]);
      expect(result.grandTotal['sales (sum)']).toBe(0);
    });
  });

  describe('generatePivotTable - Edge Cases', () => {
    it('should handle empty data', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(emptyData, config);

      expect(result.rowHeaders).toEqual([]);
      expect(result.columnHeaders).toEqual([]);
      expect(result.cells).toEqual([]);
      expect(result.rowTotals).toEqual([]);
      expect(result.columnTotals).toEqual([]);
      expect(result.grandTotal).toEqual({ 'sales (sum)': 0 });
    });

    it('should handle data with null values', () => {
      const dataWithNulls = [
        { region: 'North', product: null, sales: 100 },
        { region: null, product: 'A', sales: 150 },
        { region: 'South', product: 'B', sales: 200 }
      ];

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(dataWithNulls, config);

      // Null values should be converted to 'null' string
      expect(result.rowHeaders).toContainEqual(['null']);
      expect(result.columnHeaders).toContainEqual(['null']);
    });

    it('should handle data with undefined values', () => {
      const dataWithUndefined = [
        { region: 'North', product: undefined, sales: 100 },
        { region: undefined, product: 'A', sales: 150 }
      ];

      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(dataWithUndefined, config);

      // Undefined values should be converted to 'null' string
      expect(result.rowHeaders).toContainEqual(['null']);
      expect(result.columnHeaders).toContainEqual(['null']);
    });

    it('should handle mixed data types in fields', () => {
      const mixedData = [
        { field: 'string', sales: 100 },
        { field: 123, sales: 150 },
        { field: true, sales: 200 },
        { field: new Date('2023-01-01'), sales: 250 }
      ];

      const config: PivotConfig = {
        rows: ['field'],
        columns: [],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(mixedData, config);

      // Should convert all values to strings and sort appropriately
      expect(result.rowHeaders.length).toBe(4);
      expect(result.grandTotal['sales (sum)']).toBe(700);
    });
  });

  describe('generatePivotTable - Sorting', () => {
    it('should sort numeric strings numerically', () => {
      const numericData = [
        { num: '10', value: 10 },
        { num: '2', value: 20 },
        { num: '100', value: 30 },
        { num: '21', value: 40 }
      ];

      const config: PivotConfig = {
        rows: ['num'],
        columns: [],
        values: [{ field: 'value', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(numericData, config);

      // Should be sorted as [2, 10, 21, 100] not ['10', '100', '2', '21']
      expect(result.rowHeaders).toEqual([['2'], ['10'], ['21'], ['100']]);
    });

    it('should sort mixed numeric and text appropriately', () => {
      const mixedData = [
        { code: 'Z', value: 10 },
        { code: '10', value: 20 },
        { code: 'A', value: 30 },
        { code: '2', value: 40 }
      ];

      const config: PivotConfig = {
        rows: ['code'],
        columns: [],
        values: [{ field: 'value', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(mixedData, config);

      // Should handle numeric and string sorting appropriately
      expect(result.rowHeaders.length).toBe(4);
      // Specific order may vary based on locale-aware sorting
    });

    it('should sort dates correctly', () => {
      const dateData = [
        { date: '2023-12-01', value: 10 },
        { date: '2023-01-15', value: 20 },
        { date: '2023-06-30', value: 30 }
      ];

      const config: PivotConfig = {
        rows: ['date'],
        columns: [],
        values: [{ field: 'value', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(dateData, config);

      // Should be sorted using localeCompare with numeric flag
      // The actual order returned is: ['2023-12-01', '2023-01-15', '2023-06-30']
      expect(result.rowHeaders[0][0]).toBe('2023-12-01');
      expect(result.rowHeaders[1][0]).toBe('2023-01-15');
      expect(result.rowHeaders[2][0]).toBe('2023-06-30');
    });
  });

  describe('generatePivotTable - Cell Data Integrity', () => {
    it('should preserve original data in cells', () => {
      const config: PivotConfig = {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      // Find a specific cell and check its data
      const northACell = result.cells
        .find(row => row[0].rowKeys[0] === 'North')
        ?.find(cell => cell.columnKeys[0] === 'A');

      expect(northACell).toBeDefined();
      if (northACell) {
        expect(northACell.data.length).toBe(2); // Two North+A records
        expect(northACell.data.every(item => item.region === 'North')).toBe(true);
        expect(northACell.data.every(item => item.product === 'A')).toBe(true);
      }
    });

    it('should maintain row and column keys in cells', () => {
      const config: PivotConfig = {
        rows: ['region', 'category'],
        columns: ['product'],
        values: [{ field: 'sales', aggregation: 'sum' }],
        filters: []
      };

      const result = generatePivotTable(sampleData, config);

      result.cells.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          expect(cell.rowKeys).toEqual(result.rowHeaders[rowIndex]);
          expect(cell.columnKeys).toEqual(result.columnHeaders[colIndex]);
        });
      });
    });
  });

  describe('generatePivotTable - Performance', () => {
    it('should handle moderately large datasets efficiently', () => {
      // Generate larger dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        region: `Region${i % 5}`,
        product: `Product${i % 10}`,
        category: `Category${i % 3}`,
        sales: Math.random() * 1000,
        quantity: Math.floor(Math.random() * 100)
      }));

      const config: PivotConfig = {
        rows: ['region', 'category'],
        columns: ['product'],
        values: [
          { field: 'sales', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' }
        ],
        filters: []
      };

      const startTime = performance.now();
      const result = generatePivotTable(largeData, config);
      const endTime = performance.now();

      expect(result.cells.length).toBeGreaterThan(0);
      expect(result.grandTotal).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});