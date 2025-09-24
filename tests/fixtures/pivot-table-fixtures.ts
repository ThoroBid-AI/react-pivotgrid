import type { PivotTable, PivotCell, AggregatedValues } from '../../src/components/pivot/types';

// Helper to create pivot table fixtures
export function createPivotTable<T extends Record<string, unknown> = Record<string, unknown>>(
  rowHeaders: string[][],
  columnHeaders: string[][],
  cellValues: AggregatedValues[][],
  options?: {
    rowTotals?: AggregatedValues[];
    columnTotals?: AggregatedValues[];
    grandTotal?: AggregatedValues;
  }
): PivotTable<T> {
  const cells: PivotCell<T>[][] = cellValues.map((rowData, rowIndex) =>
    rowData.map((cellValue, colIndex) => ({
      value: cellValue,
      rowKeys: rowHeaders[rowIndex] || [],
      columnKeys: columnHeaders[colIndex] || [],
      data: [] // Empty data for fixtures
    }))
  );

  return {
    rowHeaders,
    columnHeaders,
    cells,
    rowTotals: options?.rowTotals || [],
    columnTotals: options?.columnTotals || [],
    grandTotal: options?.grandTotal || {}
  };
}

// Simple pivot table with single row and column
export const simplePivotTable = createPivotTable(
  [['North'], ['South'], ['East']],
  [['A'], ['B'], ['C']],
  [
    [{ 'sales (sum)': 100 }, { 'sales (sum)': 150 }, { 'sales (sum)': 0 }],
    [{ 'sales (sum)': 200 }, { 'sales (sum)': 120 }, { 'sales (sum)': 180 }],
    [{ 'sales (sum)': 90 }, { 'sales (sum)': 110 }, { 'sales (sum)': 0 }]
  ],
  {
    rowTotals: [
      { 'sales (sum)': 250 },
      { 'sales (sum)': 500 },
      { 'sales (sum)': 200 }
    ],
    columnTotals: [
      { 'sales (sum)': 390 },
      { 'sales (sum)': 380 },
      { 'sales (sum)': 180 }
    ],
    grandTotal: { 'sales (sum)': 950 }
  }
);

// Pivot table with multiple nested fields
export const nestedPivotTable = createPivotTable(
  [
    ['North', 'Electronics'],
    ['North', 'Clothing'],
    ['South', 'Electronics'],
    ['South', 'Clothing']
  ],
  [
    ['A', 'High'],
    ['A', 'Low'],
    ['B', 'High'],
    ['B', 'Low']
  ],
  [
    // North Electronics
    [
      { 'sales (sum)': 1000, 'quantity (count)': 10 },
      { 'sales (sum)': 800, 'quantity (count)': 8 },
      { 'sales (sum)': 600, 'quantity (count)': 6 },
      { 'sales (sum)': 400, 'quantity (count)': 4 }
    ],
    // North Clothing
    [
      { 'sales (sum)': 500, 'quantity (count)': 15 },
      { 'sales (sum)': 300, 'quantity (count)': 12 },
      { 'sales (sum)': 200, 'quantity (count)': 8 },
      { 'sales (sum)': 100, 'quantity (count)': 5 }
    ],
    // South Electronics
    [
      { 'sales (sum)': 1200, 'quantity (count)': 12 },
      { 'sales (sum)': 900, 'quantity (count)': 9 },
      { 'sales (sum)': 700, 'quantity (count)': 7 },
      { 'sales (sum)': 500, 'quantity (count)': 5 }
    ],
    // South Clothing
    [
      { 'sales (sum)': 600, 'quantity (count)': 18 },
      { 'sales (sum)': 400, 'quantity (count)': 16 },
      { 'sales (sum)': 300, 'quantity (count)': 12 },
      { 'sales (sum)': 200, 'quantity (count)': 10 }
    ]
  ],
  {
    grandTotal: { 'sales (sum)': 8600, 'quantity (count)': 156 }
  }
);

// Empty pivot table
export const emptyPivotTable = createPivotTable([], [], []);

// Pivot table with only rows (no columns)
export const rowOnlyPivotTable = createPivotTable(
  [['North'], ['South'], ['East']],
  [[]],
  [
    [{ 'sales (sum)': 370, 'count (count)': 3 }],
    [{ 'sales (sum)': 500, 'count (count)': 3 }],
    [{ 'sales (sum)': 200, 'count (count)': 2 }]
  ]
);

// Pivot table with only columns (no rows)
export const columnOnlyPivotTable = createPivotTable(
  [[]],
  [['A'], ['B'], ['C']],
  [
    [{ 'sales (sum)': 390 }, { 'sales (sum)': 380 }, { 'sales (sum)': 180 }]
  ]
);

// Pivot table with multiple value fields
export const multiValuePivotTable = createPivotTable(
  [['North'], ['South']],
  [['A'], ['B']],
  [
    [
      {
        'sales (sum)': 100,
        'sales (average)': 50,
        'quantity (count)': 2,
        'quantity (sum)': 25
      },
      {
        'sales (sum)': 150,
        'sales (average)': 75,
        'quantity (count)': 2,
        'quantity (sum)': 30
      }
    ],
    [
      {
        'sales (sum)': 200,
        'sales (average)': 100,
        'quantity (count)': 2,
        'quantity (sum)': 40
      },
      {
        'sales (sum)': 120,
        'sales (average)': 60,
        'quantity (count)': 2,
        'quantity (sum)': 24
      }
    ]
  ]
);

// Pivot table with mixed value types
export const mixedValuesPivotTable = createPivotTable(
  [['Group1'], ['Group2']],
  [['Type1'], ['Type2']],
  [
    [
      {
        'sales (sum)': 100.5,
        'count (count)': 10,
        'first (first)': 'alpha',
        'list (listUnique)': ['a', 'b', 'c'],
        'minimum (minimum)': 5.2,
        'maximum (maximum)': 95.8
      },
      {
        'sales (sum)': 200.75,
        'count (count)': 15,
        'first (first)': 'beta',
        'list (listUnique)': ['x', 'y'],
        'minimum (minimum)': 2.1,
        'maximum (maximum)': 88.9
      }
    ],
    [
      {
        'sales (sum)': 150.25,
        'count (count)': 12,
        'first (first)': 'gamma',
        'list (listUnique)': ['p', 'q', 'r', 's'],
        'minimum (minimum)': 8.7,
        'maximum (maximum)': 76.3
      },
      {
        'sales (sum)': 300.00,
        'count (count)': 20,
        'first (first)': 'delta',
        'list (listUnique)': ['m', 'n'],
        'minimum (minimum)': 1.5,
        'maximum (maximum)': 99.2
      }
    ]
  ]
);

// Pivot table with null values
export const nullValuesPivotTable = createPivotTable(
  [['null'], ['North'], ['South']],
  [['null'], ['A'], ['B']],
  [
    [{ 'sales (sum)': 50 }, { 'sales (sum)': 0 }, { 'sales (sum)': 25 }],
    [{ 'sales (sum)': 0 }, { 'sales (sum)': 100 }, { 'sales (sum)': 150 }],
    [{ 'sales (sum)': 30 }, { 'sales (sum)': 200 }, { 'sales (sum)': 120 }]
  ]
);

// Large pivot table for performance testing
export function generateLargePivotTable(rowCount: number, columnCount: number): PivotTable {
  const rowHeaders = Array.from({ length: rowCount }, (_, i) => [`Row${i + 1}`]);
  const columnHeaders = Array.from({ length: columnCount }, (_, i) => [`Col${i + 1}`]);

  const cellValues = rowHeaders.map(() =>
    columnHeaders.map(() => ({
      'value (sum)': Math.round(Math.random() * 1000),
      'count (count)': Math.floor(Math.random() * 100) + 1
    }))
  );

  return createPivotTable(rowHeaders, columnHeaders, cellValues);
}

// Pivot table with hierarchical data
export const hierarchicalPivotTable = createPivotTable(
  [
    ['North America', 'USA', 'California'],
    ['North America', 'USA', 'New York'],
    ['North America', 'Canada', 'Ontario'],
    ['Europe', 'Germany', 'Bavaria'],
    ['Europe', 'France', 'Ile-de-France'],
    ['Asia', 'Japan', 'Tokyo']
  ],
  [
    ['Electronics', 'Computers'],
    ['Electronics', 'Mobile'],
    ['Clothing', 'Mens'],
    ['Clothing', 'Womens']
  ],
  [
    // North America > USA > California
    [
      { 'sales (sum)': 5000, 'units (sum)': 50 },
      { 'sales (sum)': 3000, 'units (sum)': 100 },
      { 'sales (sum)': 1500, 'units (sum)': 30 },
      { 'sales (sum)': 2000, 'units (sum)': 40 }
    ],
    // North America > USA > New York
    [
      { 'sales (sum)': 4500, 'units (sum)': 45 },
      { 'sales (sum)': 3500, 'units (sum)': 120 },
      { 'sales (sum)': 1800, 'units (sum)': 35 },
      { 'sales (sum)': 2200, 'units (sum)': 45 }
    ],
    // North America > Canada > Ontario
    [
      { 'sales (sum)': 3000, 'units (sum)': 30 },
      { 'sales (sum)': 2000, 'units (sum)': 80 },
      { 'sales (sum)': 1200, 'units (sum)': 25 },
      { 'sales (sum)': 1500, 'units (sum)': 30 }
    ],
    // Europe > Germany > Bavaria
    [
      { 'sales (sum)': 4000, 'units (sum)': 40 },
      { 'sales (sum)': 2500, 'units (sum)': 90 },
      { 'sales (sum)': 1600, 'units (sum)': 32 },
      { 'sales (sum)': 1900, 'units (sum)': 38 }
    ],
    // Europe > France > Ile-de-France
    [
      { 'sales (sum)': 3500, 'units (sum)': 35 },
      { 'sales (sum)': 2800, 'units (sum)': 95 },
      { 'sales (sum)': 1400, 'units (sum)': 28 },
      { 'sales (sum)': 1700, 'units (sum)': 35 }
    ],
    // Asia > Japan > Tokyo
    [
      { 'sales (sum)': 6000, 'units (sum)': 60 },
      { 'sales (sum)': 4000, 'units (sum)': 150 },
      { 'sales (sum)': 1000, 'units (sum)': 20 },
      { 'sales (sum)': 1200, 'units (sum)': 25 }
    ]
  ]
);

// Time series pivot table
export const timeSeriesPivotTable = createPivotTable(
  [['2023-01'], ['2023-02'], ['2023-03'], ['2023-04'], ['2023-05'], ['2023-06']],
  [['Online'], ['Retail'], ['Wholesale']],
  [
    [
      { 'sales (sum)': 10000, 'orders (count)': 100 },
      { 'sales (sum)': 8000, 'orders (count)': 80 },
      { 'sales (sum)': 5000, 'orders (count)': 25 }
    ],
    [
      { 'sales (sum)': 12000, 'orders (count)': 110 },
      { 'sales (sum)': 8500, 'orders (count)': 85 },
      { 'sales (sum)': 5500, 'orders (count)': 28 }
    ],
    [
      { 'sales (sum)': 15000, 'orders (count)': 125 },
      { 'sales (sum)': 9000, 'orders (count)': 90 },
      { 'sales (sum)': 6000, 'orders (count)': 30 }
    ],
    [
      { 'sales (sum)': 13000, 'orders (count)': 115 },
      { 'sales (sum)': 8800, 'orders (count)': 88 },
      { 'sales (sum)': 5800, 'orders (count)': 29 }
    ],
    [
      { 'sales (sum)': 14000, 'orders (count)': 120 },
      { 'sales (sum)': 9200, 'orders (count)': 92 },
      { 'sales (sum)': 6200, 'orders (count)': 31 }
    ],
    [
      { 'sales (sum)': 16000, 'orders (count)': 130 },
      { 'sales (sum)': 9500, 'orders (count)': 95 },
      { 'sales (sum)': 6500, 'orders (count)': 33 }
    ]
  ]
);

export default {
  createPivotTable,
  simplePivotTable,
  nestedPivotTable,
  emptyPivotTable,
  rowOnlyPivotTable,
  columnOnlyPivotTable,
  multiValuePivotTable,
  mixedValuesPivotTable,
  nullValuesPivotTable,
  hierarchicalPivotTable,
  timeSeriesPivotTable,
  generateLargePivotTable
};