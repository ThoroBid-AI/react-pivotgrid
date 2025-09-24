import { z } from 'zod';
import type { AggregationFunction } from '../utils/aggregations';

// ===========================
// Generic Data Types
// ===========================

/**
 * Represents a single data item/row in the dataset.
 * The generic T allows for type-safe access to field names and values.
 */
export type DataItem<T extends Record<string, unknown> = Record<string, unknown>> = T;

/**
 * Represents the value of a single field in a data item
 */
export type FieldValue = string | number | boolean | null | undefined | Date;

/**
 * Represents a field name/key in the data
 */
export type FieldKey<T extends Record<string, unknown> = Record<string, unknown>> = keyof T & string;

// ===========================
// Pivot Configuration Types
// ===========================

export interface PivotFieldState<T extends Record<string, unknown> = Record<string, unknown>> {
  availableFields: FieldKey<T>[];
  rows: FieldKey<T>[];
  columns: FieldKey<T>[];
  values: FieldKey<T>[];
}

export interface SortState<T extends Record<string, unknown> = Record<string, unknown>> {
  field: FieldKey<T>;
  order: 'asc' | 'desc' | 'original';
}

export interface PivotConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  rows: FieldKey<T>[];
  columns: FieldKey<T>[];
  values: ValueFieldConfig<T>[];
  filters: FilterConfig<T>[];
}

export interface ValueFieldConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  field: FieldKey<T>;
  aggregation: AggregationFunction;
}

export interface FilterConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  field: FieldKey<T>;
  values: string[];
}

// ===========================
// Pivot Table Result Types
// ===========================

export interface PivotCell<T extends Record<string, unknown> = Record<string, unknown>> {
  value: AggregatedValues;
  rowKeys: string[];
  columnKeys: string[];
  data: DataItem<T>[];
}

export interface AggregatedValues {
  [key: string]: number | string | string[];
}

export interface PivotTable<T extends Record<string, unknown> = Record<string, unknown>> {
  rowHeaders: string[][];
  columnHeaders: string[][];
  cells: PivotCell<T>[][];
  rowTotals: AggregatedValues[];
  columnTotals: AggregatedValues[];
  grandTotal: AggregatedValues;
}

// ===========================
// Component Props Types
// ===========================

export interface DragDropFieldsProps<T extends Record<string, unknown> = Record<string, unknown>> {
  fieldState: PivotFieldState<T>;
  onFieldStateChange: (state: PivotFieldState<T>) => void;
  data: DataItem<T>[];
  activeFilters: Record<FieldKey<T>, string[]>;
  onFilterChange: (field: FieldKey<T>, values: string[]) => void;
  pivotTable: PivotTable<T>;
  isComputing?: boolean;
  isPending?: boolean;
  aggregationType: AggregationFunction;
  onAggregationChange: (value: AggregationFunction) => void;
  selectedRendererId?: string;
  onRendererChange?: (rendererId: string) => void;
  pivotItemThreshold?: number;
  valueField: FieldKey<T>;
  onValueFieldChange: (field: FieldKey<T>) => void;
  fieldLabels?: Partial<Record<FieldKey<T>, string>>;
  mobileView?: boolean;
  showAdvanced?: boolean;
}

export interface PivotTableRendererProps<T extends Record<string, unknown> = Record<string, unknown>> {
  pivotData: PivotTable<T>;
  rowFields: FieldKey<T>[];
  columnFields: FieldKey<T>[];
  valueFields: FieldKey<T>[];
  rowSortState?: SortState<T>;
  columnSortState?: SortState<T>;
}

export interface DroppableZoneProps<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  title: string;
  fields: FieldKey<T>[];
  horizontal: boolean;
  className?: string;
  onRemove: (index: number) => void;
  data: DataItem<T>[];
  activeFilters: Record<FieldKey<T>, string[]>;
  onFilterChange: (field: FieldKey<T>, values: string[]) => void;
  fieldLabels?: Partial<Record<FieldKey<T>, string>>;
  dropIndicator?: {
    targetIndex: number;
    isOver: boolean;
  };
  sortState?: SortState<T>;
  onSort: () => void;
}

export interface DraggableFieldItemProps<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  field: FieldKey<T>;
  fieldLabel?: string;
  data: DataItem<T>[];
  removable: boolean;
  onRemove: () => void;
  activeFilters: Record<FieldKey<T>, string[]>;
  onFilterChange: (field: FieldKey<T>, values: string[]) => void;
}

export interface AvailableFieldItemProps<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  field: FieldKey<T>;
  fieldLabel?: string;
  data: DataItem<T>[];
  activeFilters: Record<FieldKey<T>, string[]>;
  onFilterChange: (field: FieldKey<T>, values: string[]) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export interface ControlPanelProps<T extends Record<string, unknown> = Record<string, unknown>> {
  selectedRendererId?: string;
  onRendererChange?: (rendererId: string) => void;
  aggregationType: AggregationFunction;
  onAggregationChange: (value: AggregationFunction) => void;
  valueField: FieldKey<T>;
  onValueFieldChange: (field: FieldKey<T>) => void;
  availableFields: FieldKey<T>[];
  data: DataItem<T>[];
}

// ===========================
// Drag and Drop Types
// ===========================

export interface DraggedField<T extends Record<string, unknown> = Record<string, unknown>> {
  zone: 'available' | 'rows' | 'columns' | 'values';
  field: FieldKey<T>;
}

export interface DropIndicator {
  targetIndex: number;
  isOver: boolean;
}

export type DropIndicatorState = {
  rows?: DropIndicator;
  columns?: DropIndicator;
  values?: DropIndicator;
};

// ===========================
// Table Row Types
// ===========================

export interface TableRow<T extends Record<string, unknown> = Record<string, unknown>> {
  rowHeaders: string[];
  cells: PivotCell<T>[];
  rowTotal: AggregatedValues;
  originalIndex?: number;
  isTotalsRow?: boolean;
}

// ===========================
// Zod Schemas for Validation
// ===========================

// Schema for field values
export const fieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
  z.date(),
]);

// Schema for a data item (generic record)
export const dataItemSchema = z.record(z.string(), fieldValueSchema);

// Schema for aggregated values
export const aggregatedValuesSchema = z.record(
  z.string(),
  z.union([z.number(), z.string(), z.array(z.string())])
);

// Schema for aggregation functions
export const aggregationFunctionSchema = z.enum([
  'count',
  'countUnique',
  'listUnique',
  'sum',
  'integerSum',
  'average',
  'median',
  'sampleVariance',
  'sampleStandardDeviation',
  'minimum',
  'maximum',
  'first',
  'last',
]);

// Schema for sort order
export const sortOrderSchema = z.enum(['asc', 'desc', 'original']);

// Schema for sort state
export const sortStateSchema = z.object({
  field: z.string(),
  order: sortOrderSchema,
});

// Schema for pivot field state
export const pivotFieldStateSchema = z.object({
  availableFields: z.array(z.string()),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  values: z.array(z.string()),
});

// Schema for value field configuration
export const valueFieldConfigSchema = z.object({
  field: z.string(),
  aggregation: aggregationFunctionSchema,
});

// Schema for filter configuration
export const filterConfigSchema = z.object({
  field: z.string(),
  values: z.array(z.string()),
});

// Schema for pivot configuration
export const pivotConfigSchema = z.object({
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  values: z.array(valueFieldConfigSchema),
  filters: z.array(filterConfigSchema),
});

// Schema for pivot cell
export const pivotCellSchema = z.object({
  value: aggregatedValuesSchema,
  rowKeys: z.array(z.string()),
  columnKeys: z.array(z.string()),
  data: z.array(dataItemSchema),
});

// Schema for pivot table
export const pivotTableSchema = z.object({
  rowHeaders: z.array(z.array(z.string())),
  columnHeaders: z.array(z.array(z.string())),
  cells: z.array(z.array(pivotCellSchema)),
  rowTotals: z.array(aggregatedValuesSchema),
  columnTotals: z.array(aggregatedValuesSchema),
  grandTotal: aggregatedValuesSchema,
});

// Schema for render mode
export const renderModeSchema = z.enum(['table', 'chart']);

// Schema for drop indicator
export const dropIndicatorSchema = z.object({
  targetIndex: z.number(),
  isOver: z.boolean(),
});

// Schema for drop indicator state
export const dropIndicatorStateSchema = z.object({
  rows: dropIndicatorSchema.optional(),
  columns: dropIndicatorSchema.optional(),
  values: dropIndicatorSchema.optional(),
});

// ===========================
// Type Guards
// ===========================

export function isValidFieldValue(value: unknown): value is FieldValue {
  return fieldValueSchema.safeParse(value).success;
}

export function isValidDataItem<T extends Record<string, unknown>>(
  value: unknown
): value is DataItem<T> {
  return dataItemSchema.safeParse(value).success;
}

export function isValidPivotTable<T extends Record<string, unknown>>(
  value: unknown
): value is PivotTable<T> {
  return pivotTableSchema.safeParse(value).success;
}

// ===========================
// Renderer Types
// ===========================

export * from './renderer';

// ===========================
// Utility Types
// ===========================

/**
 * Extract field keys from data array
 */
export function extractFieldKeys<T extends Record<string, unknown>>(
  data: DataItem<T>[]
): FieldKey<T>[] {
  if (!data || data.length === 0) return [];

  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys) as FieldKey<T>[];
}

/**
 * Get unique values for a field with proper typing
 */
export function getUniqueFieldValues<T extends Record<string, unknown>>(
  data: DataItem<T>[],
  field: FieldKey<T>
): string[] {
  const uniqueValues = new Set<string>();
  data.forEach(item => {
    const value = item[field];
    uniqueValues.add(String(value ?? 'null'));
  });
  return Array.from(uniqueValues).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b, undefined, { numeric: true });
  });
}