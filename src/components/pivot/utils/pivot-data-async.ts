import { aggregate } from './aggregations';
import type { PivotConfig, PivotCell, PivotTable, DataItem, FieldKey, FilterConfig, AggregatedValues } from '../types';

// Custom error for validation failures
export class PivotValidationError extends Error {
  constructor(
    message: string,
    public fieldName: string,
    public fieldType: 'row' | 'column',
    public distinctCount: number
  ) {
    super(message);
    this.name = 'PivotValidationError';
  }
}

/**
 * Async version of generatePivotTable that yields control back to the browser
 * periodically to keep the UI responsive
 */
export async function generatePivotTableAsync<T extends Record<string, unknown> = Record<string, unknown>>(
  data: DataItem<T>[],
  config: PivotConfig<T>,
  signal?: AbortSignal,
  pivotItemThreshold: number = 1000
): Promise<PivotTable<T>> {
  const CHUNK_SIZE = 100; // Process 100 rows at a time

  // Helper to yield control back to browser
  const yieldControl = () => new Promise(resolve => {
    setTimeout(resolve, 0);
  });

  // Apply filters
  const filteredData = filterData(data, config.filters);

  // Check abort signal
  if (signal?.aborted) throw new Error('Aborted');

  // Get unique combinations for rows and columns
  const rowKeys = await getNestedKeysAsync(filteredData, config.rows, signal, 'row', pivotItemThreshold);
  await yieldControl();

  const columnKeys = await getNestedKeysAsync(filteredData, config.columns, signal, 'column', pivotItemThreshold);
  await yieldControl();

  // Check abort signal
  if (signal?.aborted) throw new Error('Aborted');

  // Initialize the pivot table structure
  const cells: PivotCell<T>[][] = [];
  const rowTotals: AggregatedValues[] = [];
  const columnTotals: AggregatedValues[] = [];

  // Generate cells in chunks
  for (let rowIndex = 0; rowIndex < rowKeys.length; rowIndex++) {
    if (rowIndex % CHUNK_SIZE === 0) {
      await yieldControl(); // Yield control every CHUNK_SIZE rows
      if (signal?.aborted) throw new Error('Aborted');
    }

    const rowKey = rowKeys[rowIndex];
    const row: PivotCell<T>[] = [];

    for (const colKey of columnKeys) {
      const subsetData = getSubsetData(
        filteredData,
        rowKey,
        colKey,
        config.rows,
        config.columns
      );

      const cellValue: AggregatedValues = {};
      if (config.values.length === 0) {
        cellValue['Count'] = subsetData.length;
      } else {
        for (const valueConfig of config.values) {
          const key = `${valueConfig.field} (${valueConfig.aggregation})`;
          cellValue[key] = aggregate(subsetData, valueConfig.field, valueConfig.aggregation);
        }
      }

      row.push({
        value: cellValue,
        rowKeys: rowKey,
        columnKeys: colKey,
        data: subsetData,
      });
    }

    cells.push(row);

    // Calculate row totals
    const rowData = getSubsetData(
      filteredData,
      rowKey,
      [],
      config.rows,
      []
    );

    const rowTotal: AggregatedValues = {};
    if (config.values.length === 0) {
      rowTotal['Count'] = rowData.length;
    } else {
      for (const valueConfig of config.values) {
        const key = `${valueConfig.field} (${valueConfig.aggregation})`;
        rowTotal[key] = aggregate(rowData, valueConfig.field, valueConfig.aggregation);
      }
    }
    rowTotals.push(rowTotal);
  }

  // Check abort signal
  if (signal?.aborted) throw new Error('Aborted');

  // Calculate column totals
  for (let colIndex = 0; colIndex < columnKeys.length; colIndex++) {
    if (colIndex % CHUNK_SIZE === 0) {
      await yieldControl();
      if (signal?.aborted) throw new Error('Aborted');
    }

    const colKey = columnKeys[colIndex];
    const colData = getSubsetData(
      filteredData,
      [],
      colKey,
      [],
      config.columns
    );

    const colTotal: AggregatedValues = {};
    if (config.values.length === 0) {
      colTotal['Count'] = colData.length;
    } else {
      for (const valueConfig of config.values) {
        const key = `${valueConfig.field} (${valueConfig.aggregation})`;
        colTotal[key] = aggregate(colData, valueConfig.field, valueConfig.aggregation);
      }
    }
    columnTotals.push(colTotal);
  }

  // Calculate grand total
  const grandTotal: AggregatedValues = {};
  if (config.values.length === 0) {
    grandTotal['Count'] = filteredData.length;
  } else {
    for (const valueConfig of config.values) {
      const key = `${valueConfig.field} (${valueConfig.aggregation})`;
      grandTotal[key] = aggregate(filteredData, valueConfig.field, valueConfig.aggregation);
    }
  }

  return {
    rowHeaders: rowKeys,
    columnHeaders: columnKeys,
    cells,
    rowTotals,
    columnTotals,
    grandTotal,
  };
}

async function getNestedKeysAsync<T extends Record<string, unknown>>(
  data: DataItem<T>[],
  fields: FieldKey<T>[],
  signal?: AbortSignal,
  fieldType?: 'row' | 'column',
  pivotItemThreshold: number = 1000
): Promise<string[][]> {
  if (fields.length === 0) return [[]];

  const uniqueValues = new Map<string, Set<string>>();

  // Get unique values for each field and validate
  for (const field of fields) {
    const values = new Set<string>();
    for (const item of data) {
      const value = item[field] ?? 'null';
      values.add(String(value));
    }
    uniqueValues.set(field, values);

    // Validate that distinct count doesn't exceed threshold
    if (values.size > pivotItemThreshold && fieldType) {
      throw new PivotValidationError(
        `Field "${field}" has too many unique values (${values.size.toLocaleString()})`,
        field,
        fieldType,
        values.size
      );
    }
  }

  // Smart sort function that handles numbers and strings
  const smartSort = (a: string, b: string): number => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  };

  // Generate all combinations
  const generateCombinations = (fieldIndex: number): string[][] => {
    if (fieldIndex >= fields.length) return [[]];

    const field = fields[fieldIndex];
    const values = Array.from(uniqueValues.get(field) || []).sort(smartSort);
    const subCombinations = generateCombinations(fieldIndex + 1);

    const combinations: string[][] = [];
    for (const value of values) {
      for (const subCombo of subCombinations) {
        combinations.push([value, ...subCombo]);
      }
    }

    return combinations;
  };

  return generateCombinations(0);
}

function filterData<T extends Record<string, unknown>>(data: DataItem<T>[], filters: FilterConfig<T>[]): DataItem<T>[] {
  return data.filter(item => {
    return filters.every(filter => {
      if (filter.values.length === 0) return true;
      const itemValue = String(item[filter.field] ?? 'null');
      return filter.values.includes(itemValue);
    });
  });
}

function getSubsetData<T extends Record<string, unknown>>(
  data: DataItem<T>[],
  rowKeys: string[],
  columnKeys: string[],
  rowFields: FieldKey<T>[],
  columnFields: FieldKey<T>[]
): DataItem<T>[] {
  return data.filter(item => {
    const rowMatch = rowKeys.every((key, index) => {
      const itemValue = String(item[rowFields[index]] ?? 'null');
      return itemValue === key;
    });

    const columnMatch = columnKeys.every((key, index) => {
      const itemValue = String(item[columnFields[index]] ?? 'null');
      return itemValue === key;
    });

    return rowMatch && columnMatch;
  });
}