'use client';

import type { PivotTable, FieldKey, AggregatedValues } from '../types';

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export interface TransformedChartData {
  data: ChartDataPoint[];
  series: ChartSeries[];
  categoryKey: string;
}

/**
 * Transform pivot table data into format suitable for recharts
 */
export function transformPivotToChartData<T extends Record<string, unknown>>(
  pivotData: PivotTable<T>,
  rowFields: FieldKey<T>[],
  columnFields: FieldKey<T>[],
  valueFields: FieldKey<T>[],
  orientation: 'vertical' | 'horizontal' = 'vertical'
): TransformedChartData {
  const { rowHeaders, columnHeaders, cells } = pivotData;

  // If no data, return empty
  if (!cells.length || !cells[0]?.length) {
    return {
      data: [],
      series: [],
      categoryKey: 'category'
    };
  }

  const chartData: ChartDataPoint[] = [];
  const seriesKeys = new Set<string>();

  // Handle case where there are no column fields (simple bar chart)
  if (columnHeaders.length === 0 || columnHeaders[0].length === 0) {
    // Simple bar chart - one series per value field
    rowHeaders.forEach((rowHeader, rowIndex) => {
      const categoryName = createCategoryName(rowHeader, rowFields);
      const dataPoint: ChartDataPoint = {
        category: categoryName
      };

      // Get the cell for this row (column index 0 since no columns)
      const cell = cells[rowIndex]?.[0];
      if (cell) {
        Object.entries(cell.value).forEach(([valueKey, value]) => {
          const seriesKey = valueKey;
          seriesKeys.add(seriesKey);
          dataPoint[seriesKey] = typeof value === 'number' ? value : 0;
        });
      }

      chartData.push(dataPoint);
    });
  } else {
    // Complex chart - columns become series
    rowHeaders.forEach((rowHeader, rowIndex) => {
      const categoryName = createCategoryName(rowHeader, rowFields);
      const dataPoint: ChartDataPoint = {
        category: categoryName
      };

      columnHeaders.forEach((columnHeader, columnIndex) => {
        const seriesKey = createSeriesKey(columnHeader, columnFields);
        seriesKeys.add(seriesKey);

        const cell = cells[rowIndex]?.[columnIndex];
        if (cell) {
          // Use the first value field or aggregate all values
          const cellValue = getCellDisplayValue(cell.value, valueFields);
          dataPoint[seriesKey] = cellValue;
        } else {
          dataPoint[seriesKey] = 0;
        }
      });

      chartData.push(dataPoint);
    });
  }

  // Create series configuration
  const series: ChartSeries[] = Array.from(seriesKeys).map((key, index) => ({
    key,
    name: key,
    color: `var(--chart-${(index % 5) + 1})`
  }));

  return {
    data: chartData,
    series,
    categoryKey: 'category'
  };
}

/**
 * Create a human-readable category name from row headers
 */
function createCategoryName<T extends Record<string, unknown>>(
  rowHeader: string[],
  rowFields: FieldKey<T>[]
): string {
  if (rowHeader.length === 1) {
    return rowHeader[0];
  }

  // For multiple row fields, combine them meaningfully
  return rowHeader.join(' - ');
}

/**
 * Create a series key from column headers
 */
function createSeriesKey<T extends Record<string, unknown>>(
  columnHeader: string[],
  columnFields: FieldKey<T>[]
): string {
  if (columnHeader.length === 1) {
    return columnHeader[0];
  }

  // For multiple column fields, combine them meaningfully
  return columnHeader.join(' - ');
}

/**
 * Extract a display value from aggregated cell values
 */
function getCellDisplayValue<T extends Record<string, unknown>>(
  aggregatedValues: AggregatedValues,
  valueFields: FieldKey<T>[]
): number {
  // Get all numeric values from the cell
  const numericValues = Object.values(aggregatedValues)
    .filter((value): value is number => typeof value === 'number');

  if (numericValues.length === 0) {
    return 0;
  }

  // If only one numeric value, return it
  if (numericValues.length === 1) {
    return numericValues[0];
  }

  // If multiple values, sum them (or we could return the first one)
  return numericValues.reduce((sum, value) => sum + value, 0);
}

/**
 * Transform data for horizontal bar charts
 * In horizontal mode, we swap the axes conceptually
 */
export function transformForHorizontalChart(
  transformedData: TransformedChartData
): TransformedChartData {
  // For horizontal charts, the data structure is the same,
  // but the chart component will render differently
  return transformedData;
}

/**
 * Generate chart configuration for shadcn charts
 */
export function generateChartConfig(series: ChartSeries[]) {
  const config: Record<string, { label: string; color: string }> = {};

  series.forEach((seriesItem, index) => {
    config[seriesItem.key] = {
      label: seriesItem.name,
      color: seriesItem.color || `var(--chart-${(index % 5) + 1})`
    };
  });

  return config;
}