import { describe, it, expect } from 'vitest';
import {
  transformPivotToChartData,
  transformForHorizontalChart,
  generateChartConfig,
  type ChartSeries,
  type TransformedChartData
} from '../../src/components/pivot/utils/chart-data';
import type { PivotTable, AggregatedValues } from '../../src/components/pivot/types';

describe('chart-data utilities', () => {
  // Sample pivot table data
  const createSamplePivotTable = (
    rowHeaders: string[][],
    columnHeaders: string[][],
    cellValues: (AggregatedValues | null)[][]
  ): PivotTable => {
    const cells = cellValues.map((rowData, rowIndex) =>
      rowData.map((cellValue, colIndex) => {
        if (cellValue === null || cellValue === undefined) {
          return {
            value: {},
            rowKeys: rowHeaders[rowIndex] || [],
            columnKeys: columnHeaders[colIndex] || [],
            data: []
          };
        }
        return {
          value: cellValue,
          rowKeys: rowHeaders[rowIndex] || [],
          columnKeys: columnHeaders[colIndex] || [],
          data: []
        };
      })
    );

    return {
      rowHeaders,
      columnHeaders,
      cells,
      rowTotals: [],
      columnTotals: [],
      grandTotal: {}
    };
  };

  describe('transformPivotToChartData - Basic Functionality', () => {
    it('should transform simple pivot data with rows only', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South'], ['East']],
        [[]],
        [
          [{ 'sales (sum)': 100, 'quantity (count)': 10 }],
          [{ 'sales (sum)': 200, 'quantity (count)': 20 }],
          [{ 'sales (sum)': 150, 'quantity (count)': 15 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        [],
        ['sales'],
        'vertical'
      );

      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        category: 'North',
        'sales (sum)': 100,
        'quantity (count)': 10
      });
      expect(result.data[1]).toEqual({
        category: 'South',
        'sales (sum)': 200,
        'quantity (count)': 20
      });
      expect(result.data[2]).toEqual({
        category: 'East',
        'sales (sum)': 150,
        'quantity (count)': 15
      });

      expect(result.series).toHaveLength(2);
      expect(result.series[0].key).toBe('sales (sum)');
      expect(result.series[1].key).toBe('quantity (count)');
      expect(result.categoryKey).toBe('category');
    });

    it('should transform pivot data with both rows and columns', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A'], ['B'], ['C']],
        [
          [{ 'sales (sum)': 100 }, { 'sales (sum)': 150 }, { 'sales (sum)': 0 }],
          [{ 'sales (sum)': 200 }, { 'sales (sum)': 120 }, { 'sales (sum)': 180 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        category: 'North',
        'A': 100,
        'B': 150,
        'C': 0
      });
      expect(result.data[1]).toEqual({
        category: 'South',
        'A': 200,
        'B': 120,
        'C': 180
      });

      expect(result.series).toHaveLength(3);
      expect(result.series.map(s => s.key)).toEqual(['A', 'B', 'C']);
    });

    it('should handle multiple row fields', () => {
      const pivotTable = createSamplePivotTable(
        [['North', 'Electronics'], ['North', 'Clothing'], ['South', 'Electronics']],
        [['A'], ['B']],
        [
          [{ 'sales (sum)': 100 }, { 'sales (sum)': 150 }],
          [{ 'sales (sum)': 120 }, { 'sales (sum)': 80 }],
          [{ 'sales (sum)': 200 }, { 'sales (sum)': 160 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region', 'category'],
        ['product'],
        ['sales']
      );

      expect(result.data).toHaveLength(3);
      expect(result.data[0].category).toBe('North - Electronics');
      expect(result.data[1].category).toBe('North - Clothing');
      expect(result.data[2].category).toBe('South - Electronics');
    });

    it('should handle multiple column fields', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A', 'Small'], ['A', 'Large'], ['B', 'Small']],
        [
          [{ 'sales (sum)': 100 }, { 'sales (sum)': 150 }, { 'sales (sum)': 80 }],
          [{ 'sales (sum)': 200 }, { 'sales (sum)': 180 }, { 'sales (sum)': 120 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product', 'size'],
        ['sales']
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        category: 'North',
        'A - Small': 100,
        'A - Large': 150,
        'B - Small': 80
      });

      expect(result.series).toHaveLength(3);
      expect(result.series.map(s => s.key)).toEqual(['A - Small', 'A - Large', 'B - Small']);
    });
  });

  describe('transformPivotToChartData - Edge Cases', () => {
    it('should handle empty pivot table', () => {
      const emptyPivotTable = createSamplePivotTable([], [], []);

      const result = transformPivotToChartData(
        emptyPivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.data).toEqual([]);
      expect(result.series).toEqual([]);
      expect(result.categoryKey).toBe('category');
    });

    it('should handle pivot table with no cells', () => {
      const pivotTable = createSamplePivotTable([['North']], [['A']], []);

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.data).toEqual([]);
      expect(result.series).toEqual([]);
    });

    it('should handle missing cells gracefully', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A'], ['B']],
        [
          [{ 'sales (sum)': 100 }, null], // Missing cell
          [{ 'sales (sum)': 200 }, { 'sales (sum)': 150 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        category: 'North',
        'A': 100,
        'B': 0 // Missing cell should default to 0
      });
    });

    it('should handle non-numeric values in cells', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [[]],
        [
          [{ 'text (first)': 'hello', 'count (count)': 5, 'invalid': 'not a number' }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        [],
        ['sales']
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        category: 'North',
        'count (count)': 5, // Should only include numeric values
        'invalid': 0, // Non-numeric values become 0
        'text (first)': 0 // Non-numeric values become 0
      });
    });

    it('should handle cells with no numeric values', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [[]],
        [
          [{ 'text (first)': 'hello', 'list (listUnique)': ['a', 'b'] }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        [],
        ['text']
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        category: 'North',
        'list (listUnique)': 0, // Non-numeric values become 0
        'text (first)': 0 // Non-numeric values become 0
      });
    });
  });

  describe('transformPivotToChartData - Value Field Handling', () => {
    it('should handle single value field correctly', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [['A']],
        [
          [{ 'sales (sum)': 100, 'quantity (count)': 10 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales'] // Only specify sales
      );

      expect(result.data[0]['A']).toBe(110); // Should sum all numeric values: 100 + 10
    });

    it('should handle multiple value fields', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [[]],
        [
          [{ 'sales (sum)': 100, 'quantity (count)': 10, 'average (average)': 5.5 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        [],
        ['sales', 'quantity', 'average']
      );

      expect(result.data[0]).toEqual({
        category: 'North',
        'sales (sum)': 100,
        'quantity (count)': 10,
        'average (average)': 5.5
      });
    });

    it('should sum multiple numeric values when no specific value fields', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [['A']],
        [
          [{ 'value1': 100, 'value2': 50, 'value3': 25 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        []
      );

      expect(result.data[0]['A']).toBe(175); // 100 + 50 + 25
    });
  });

  describe('transformPivotToChartData - Series Generation', () => {
    it('should generate correct series for simple case', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [[]],
        [
          [{ 'sales (sum)': 100, 'quantity (count)': 10 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        [],
        ['sales', 'quantity']
      );

      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({
        key: 'sales (sum)',
        name: 'sales (sum)',
        color: 'var(--chart-1)'
      });
      expect(result.series[1]).toEqual({
        key: 'quantity (count)',
        name: 'quantity (count)',
        color: 'var(--chart-2)'
      });
    });

    it('should generate correct series for column-based chart', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [['A'], ['B'], ['C']],
        [
          [{ 'sales (sum)': 100 }, { 'sales (sum)': 150 }, { 'sales (sum)': 200 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.series).toHaveLength(3);
      expect(result.series.map(s => s.key)).toEqual(['A', 'B', 'C']);
      expect(result.series.map(s => s.color)).toEqual([
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)'
      ]);
    });

    it('should cycle colors for many series', () => {
      const pivotTable = createSamplePivotTable(
        [['North']],
        [['A'], ['B'], ['C'], ['D'], ['E'], ['F'], ['G']],
        [
          [
            { 'sales': 1 }, { 'sales': 2 }, { 'sales': 3 },
            { 'sales': 4 }, { 'sales': 5 }, { 'sales': 6 }, { 'sales': 7 }
          ]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.series).toHaveLength(7);
      expect(result.series[5].color).toBe('var(--chart-1)'); // Should cycle back to 1
      expect(result.series[6].color).toBe('var(--chart-2)'); // Should cycle to 2
    });
  });

  describe('transformPivotToChartData - Orientation', () => {
    it('should handle vertical orientation (default)', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A'], ['B']],
        [
          [{ 'sales': 100 }, { 'sales': 150 }],
          [{ 'sales': 200 }, { 'sales': 120 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales'],
        'vertical'
      );

      expect(result.data).toHaveLength(2);
      expect(result.categoryKey).toBe('category');
    });

    it('should handle horizontal orientation', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A'], ['B']],
        [
          [{ 'sales': 100 }, { 'sales': 150 }],
          [{ 'sales': 200 }, { 'sales': 120 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales'],
        'horizontal'
      );

      // For now, horizontal orientation doesn't change the data structure
      expect(result.data).toHaveLength(2);
      expect(result.categoryKey).toBe('category');
    });
  });

  describe('transformForHorizontalChart', () => {
    it('should return the same data structure', () => {
      const inputData: TransformedChartData = {
        data: [
          { category: 'North', A: 100, B: 150 },
          { category: 'South', A: 200, B: 120 }
        ],
        series: [
          { key: 'A', name: 'A', color: 'var(--chart-1)' },
          { key: 'B', name: 'B', color: 'var(--chart-2)' }
        ],
        categoryKey: 'category'
      };

      const result = transformForHorizontalChart(inputData);

      expect(result).toEqual(inputData);
    });

    it('should handle empty data', () => {
      const emptyData: TransformedChartData = {
        data: [],
        series: [],
        categoryKey: 'category'
      };

      const result = transformForHorizontalChart(emptyData);

      expect(result).toEqual(emptyData);
    });
  });

  describe('generateChartConfig', () => {
    it('should generate correct chart configuration', () => {
      const series: ChartSeries[] = [
        { key: 'sales', name: 'Sales Amount', color: 'var(--chart-1)' },
        { key: 'quantity', name: 'Quantity Count', color: 'var(--chart-2)' }
      ];

      const config = generateChartConfig(series);

      expect(config).toEqual({
        sales: {
          label: 'Sales Amount',
          color: 'var(--chart-1)'
        },
        quantity: {
          label: 'Quantity Count',
          color: 'var(--chart-2)'
        }
      });
    });

    it('should handle series without explicit colors', () => {
      const series: ChartSeries[] = [
        { key: 'sales', name: 'Sales' },
        { key: 'quantity', name: 'Quantity' }
      ];

      const config = generateChartConfig(series);

      expect(config).toEqual({
        sales: {
          label: 'Sales',
          color: 'var(--chart-1)'
        },
        quantity: {
          label: 'Quantity',
          color: 'var(--chart-2)'
        }
      });
    });

    it('should handle empty series array', () => {
      const config = generateChartConfig([]);

      expect(config).toEqual({});
    });

    it('should handle many series with color cycling', () => {
      const series: ChartSeries[] = Array.from({ length: 7 }, (_, i) => ({
        key: `series${i}`,
        name: `Series ${i}`
      }));

      const config = generateChartConfig(series);

      expect(config['series0'].color).toBe('var(--chart-1)');
      expect(config['series4'].color).toBe('var(--chart-5)');
      expect(config['series5'].color).toBe('var(--chart-1)'); // Cycles back
      expect(config['series6'].color).toBe('var(--chart-2)');
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle complex multi-dimensional pivot data', () => {
      const pivotTable = createSamplePivotTable(
        [
          ['North', 'Q1'], ['North', 'Q2'],
          ['South', 'Q1'], ['South', 'Q2']
        ],
        [
          ['Electronics', 'High'], ['Electronics', 'Low'],
          ['Clothing', 'High'], ['Clothing', 'Low']
        ],
        [
          // North Q1
          [
            { 'sales (sum)': 1000, 'quantity (count)': 100 },
            { 'sales (sum)': 800, 'quantity (count)': 120 },
            { 'sales (sum)': 600, 'quantity (count)': 80 },
            { 'sales (sum)': 400, 'quantity (count)': 60 }
          ],
          // North Q2
          [
            { 'sales (sum)': 1200, 'quantity (count)': 110 },
            { 'sales (sum)': 900, 'quantity (count)': 130 },
            { 'sales (sum)': 700, 'quantity (count)': 90 },
            { 'sales (sum)': 500, 'quantity (count)': 70 }
          ],
          // South Q1
          [
            { 'sales (sum)': 1100, 'quantity (count)': 105 },
            { 'sales (sum)': 850, 'quantity (count)': 125 },
            { 'sales (sum)': 650, 'quantity (count)': 85 },
            { 'sales (sum)': 450, 'quantity (count)': 65 }
          ],
          // South Q2
          [
            { 'sales (sum)': 1300, 'quantity (count)': 115 },
            { 'sales (sum)': 950, 'quantity (count)': 135 },
            { 'sales (sum)': 750, 'quantity (count)': 95 },
            { 'sales (sum)': 550, 'quantity (count)': 75 }
          ]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region', 'quarter'],
        ['category', 'priority'],
        ['sales']
      );

      expect(result.data).toHaveLength(4);
      expect(result.data[0].category).toBe('North - Q1');
      expect(result.data[0]['Electronics - High']).toBe(1100); // 1000 + 100 (sum of numeric values)
      expect(result.data[0]['Clothing - Low']).toBe(460); // 400 + 60 (sum of numeric values)

      expect(result.series).toHaveLength(4);
      expect(result.series.map(s => s.key)).toEqual([
        'Electronics - High',
        'Electronics - Low',
        'Clothing - High',
        'Clothing - Low'
      ]);
    });

    it('should handle pivot table with mixed value types', () => {
      const pivotTable = createSamplePivotTable(
        [['North'], ['South']],
        [['A']],
        [
          [{ 'sales (sum)': 100.5, 'count (count)': 10, 'first (first)': 'text', 'list (listUnique)': ['a', 'b'] }],
          [{ 'sales (sum)': 200.75, 'count (count)': 20, 'first (first)': 'text2', 'average (average)': 15.25 }]
        ]
      );

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales', 'count']
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]['A']).toBeCloseTo(110.5, 2); // 100.5 + 10 (sum of numeric values)
      expect(result.data[1]['A']).toBeCloseTo(236, 2); // 200.75 + 20 + 15.25 = 236
    });

    it('should maintain data integrity with large datasets', () => {
      const rowHeaders = Array.from({ length: 100 }, (_, i) => [`Region${i}`]);
      const columnHeaders = Array.from({ length: 50 }, (_, i) => [`Product${i}`]);
      const cellValues = rowHeaders.map(() =>
        columnHeaders.map(() => ({ 'sales (sum)': Math.random() * 1000 }))
      );

      const pivotTable = createSamplePivotTable(rowHeaders, columnHeaders, cellValues);

      const result = transformPivotToChartData(
        pivotTable,
        ['region'],
        ['product'],
        ['sales']
      );

      expect(result.data).toHaveLength(100);
      expect(result.series).toHaveLength(50);
      expect(result.data[0]).toHaveProperty('category', 'Region0');
      expect(result.data[99]).toHaveProperty('category', 'Region99');

      // Verify that all products are represented
      const productKeys = Object.keys(result.data[0]).filter(key => key !== 'category');
      expect(productKeys).toHaveLength(50);
    });
  });
});