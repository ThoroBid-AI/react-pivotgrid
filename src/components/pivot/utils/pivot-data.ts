import { aggregate, AggregationFunction } from './aggregations';
import type {
  DataItem,
  FieldKey,
  PivotConfig,
  PivotCell,
  PivotTable,
  AggregatedValues,
  ValueFieldConfig,
  FilterConfig,
} from '../types';

function getNestedKeys<T extends Record<string, unknown>>(
  data: DataItem<T>[],
  fields: FieldKey<T>[]
): string[][] {
  if (fields.length === 0) return [[]];

  const uniqueValues = new Map<string, Set<string>>();

  // Get unique values for each field
  fields.forEach(field => {
    const values = new Set<string>();
    data.forEach(item => {
      const value = item[field] ?? 'null';
      values.add(String(value));
    });
    uniqueValues.set(field, values);
  });

  // Smart sort function that handles numbers and strings
  const smartSort = (a: string, b: string): number => {
    // Check if both values are numeric
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (!isNaN(numA) && !isNaN(numB)) {
      // Both are numbers, sort numerically
      return numA - numB;
    }

    // At least one is not a number, sort as strings
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  };

  // Generate all combinations
  const generateCombinations = (fieldIndex: number): string[][] => {
    if (fieldIndex >= fields.length) return [[]];

    const field = fields[fieldIndex];
    const values = Array.from(uniqueValues.get(field) || []).sort(smartSort);
    const subCombinations = generateCombinations(fieldIndex + 1);

    const combinations: string[][] = [];
    values.forEach(value => {
      subCombinations.forEach(subCombo => {
        combinations.push([value, ...subCombo]);
      });
    });

    return combinations;
  };

  return generateCombinations(0);
}

function filterData<T extends Record<string, unknown>>(
  data: DataItem<T>[],
  filters: FilterConfig<T>[]
): DataItem<T>[] {
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

export function generatePivotTable<T extends Record<string, unknown> = Record<string, unknown>>(
  data: DataItem<T>[],
  config: PivotConfig<T>
): PivotTable<T> {
  // Apply filters
  const filteredData = filterData(data, config.filters);

  // Get unique combinations for rows and columns
  const rowKeys = getNestedKeys(filteredData, config.rows);
  const columnKeys = getNestedKeys(filteredData, config.columns);

  // Initialize the pivot table structure
  const cells: PivotCell<T>[][] = [];
  const rowTotals: AggregatedValues[] = [];
  const columnTotals: AggregatedValues[] = [];

  // Generate cells
  rowKeys.forEach((rowKey, rowIndex) => {
    const row: PivotCell<T>[] = [];

    columnKeys.forEach((colKey) => {
      const subsetData = getSubsetData(
        filteredData,
        rowKey,
        colKey,
        config.rows,
        config.columns
      );

      const cellValue: AggregatedValues = {};
      if (config.values.length === 0) {
        // If no value fields, just count
        cellValue['Count'] = subsetData.length;
      } else {
        config.values.forEach(valueConfig => {
          const key = `${valueConfig.field} (${valueConfig.aggregation})`;
          cellValue[key] = aggregate(subsetData, valueConfig.field as string, valueConfig.aggregation);
        });
      }

      row.push({
        value: cellValue,
        rowKeys: rowKey,
        columnKeys: colKey,
        data: subsetData,
      });
    });

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
      config.values.forEach(valueConfig => {
        const key = `${valueConfig.field} (${valueConfig.aggregation})`;
        rowTotal[key] = aggregate(rowData, valueConfig.field as string, valueConfig.aggregation);
      });
    }
    rowTotals.push(rowTotal);
  });

  // Calculate column totals
  columnKeys.forEach((colKey) => {
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
      config.values.forEach(valueConfig => {
        const key = `${valueConfig.field} (${valueConfig.aggregation})`;
        colTotal[key] = aggregate(colData, valueConfig.field as string, valueConfig.aggregation);
      });
    }
    columnTotals.push(colTotal);
  });

  // Calculate grand total
  const grandTotal: AggregatedValues = {};
  if (config.values.length === 0) {
    grandTotal['Count'] = filteredData.length;
  } else {
    config.values.forEach(valueConfig => {
      const key = `${valueConfig.field} (${valueConfig.aggregation})`;
      grandTotal[key] = aggregate(filteredData, valueConfig.field as string, valueConfig.aggregation);
    });
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