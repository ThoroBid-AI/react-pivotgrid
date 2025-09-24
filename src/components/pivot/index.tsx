'use client';

import React, { useState, useMemo, useTransition, useCallback } from 'react';
import { DragDropFields } from './drag-drop-fields';
import type {
  PivotFieldState,
  PivotConfig,
  DataItem,
  FieldKey
} from './types';
import { AggregationFunction } from './utils/aggregations';
import { useDebouncedPivot } from './utils/use-debounced-pivot';
import { PivotValidationError } from './utils/pivot-data-async';
import { Table, Loader2 } from 'lucide-react';

interface ReactPivotGridProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: DataItem<T>[];
  initialConfig?: {
    rows?: FieldKey<T>[];
    columns?: FieldKey<T>[];
    values?: FieldKey<T>[];
    aggregation?: AggregationFunction;
    filters?: Partial<Record<FieldKey<T>, string[]>>;
  };
  fieldLabels?: Partial<Record<FieldKey<T>, string>>;
  pivotItemThreshold?: number;
}

export function ReactPivotGrid<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  initialConfig,
  fieldLabels,
  pivotItemThreshold = 5000
}: ReactPivotGridProps<T>) {
  // Use transition for non-urgent updates
  const [isPending, startTransition] = useTransition();

  // Get available fields from data
  const availableFields = useMemo(() => {
    if (!data || data.length === 0) return [] as FieldKey<T>[];
    return Object.keys(data[0]).sort() as FieldKey<T>[];
  }, [data]);

  // Initialize field state
  const [fieldState, setFieldState] = useState<PivotFieldState<T>>({
    availableFields,
    rows: initialConfig?.rows || [],
    columns: initialConfig?.columns || [],
    values: initialConfig?.values || [],
  });

  // Pending field state for immediate UI feedback
  const [pendingFieldState, setPendingFieldState] = useState<PivotFieldState<T>>(fieldState);

  // Aggregation settings
  const [aggregationType, setAggregationType] = useState<AggregationFunction>(
    initialConfig?.aggregation || 'count'
  );

  // Value field for aggregation (when not count)
  const [valueField, setValueField] = useState<FieldKey<T>>(
    (initialConfig?.values?.[0] || '') as FieldKey<T>
  );

  // Filter settings - initialize from initialConfig if provided
  const [activeFilters, setActiveFilters] = useState<Record<FieldKey<T>, string[]>>(
    (initialConfig?.filters ?
      Object.keys(initialConfig.filters).reduce((acc, key) => {
        const values = initialConfig.filters![key as FieldKey<T>];
        if (values) {
          acc[key as FieldKey<T>] = values;
        }
        return acc;
      }, {} as Record<FieldKey<T>, string[]>)
      : {}
    ) as Record<FieldKey<T>, string[]>
  );

  // Renderer selection
  const [selectedRendererId, setSelectedRendererId] = useState<string>('tanstack-table');

  // Handle field state changes with lazy updates
  const handleFieldStateChange = useCallback((newState: PivotFieldState<T>) => {
    // Update pending state immediately for UI feedback
    setPendingFieldState(newState);

    // Use transition for non-urgent state update
    startTransition(() => {
      setFieldState(newState);
    });
  }, []);

  // Handle aggregation change with lazy updates
  const handleAggregationChange = useCallback((newAggregation: AggregationFunction) => {
    startTransition(() => {
      setAggregationType(newAggregation);
    });
  }, []);

  // Generate pivot configuration
  const pivotConfig: PivotConfig<T> = useMemo(() => {
    const filters = Object.entries(activeFilters)
      .filter(([, values]) => values.length > 0)
      .map(([field, values]) => ({ field: field as FieldKey<T>, values }));

    // For count, we don't need a value field
    // For other aggregations, use the selected value field
    const values = aggregationType === 'count'
      ? []
      : valueField
        ? [{ field: valueField, aggregation: aggregationType }]
        : [];

    return {
      rows: fieldState.rows,
      columns: fieldState.columns,
      values,
      filters,
    };
  }, [fieldState, aggregationType, activeFilters, valueField]);

  // Handle validation errors by ejecting the problematic field
  const handleValidationError = useCallback((error: PivotValidationError) => {
    // Remove the field from its current position
    const newFieldState = { ...fieldState };

    if (error.fieldType === 'row') {
      newFieldState.rows = newFieldState.rows.filter(f => f !== error.fieldName);
    } else if (error.fieldType === 'column') {
      newFieldState.columns = newFieldState.columns.filter(f => f !== error.fieldName);
    }

    // Update field state to eject the field
    setFieldState(newFieldState);
    setPendingFieldState(newFieldState);

    // Show error message (you can add a toast notification here if you have one)
    console.warn(`Field "${error.fieldName}" ejected from ${error.fieldType}s: ${error.message}`);
  }, [fieldState]);

  // Use debounced pivot calculation with validation error handler
  const { pivotTable, isComputing } = useDebouncedPivot<T>(
    data,
    pivotConfig,
    300,
    handleValidationError,
    pivotItemThreshold
  );

  // Handle filter change with lazy updates
  const handleFilterChange = useCallback((field: FieldKey<T>, values: string[]) => {
    startTransition(() => {
      setActiveFilters(prev => {
        const newFilters = { ...prev };
        if (!values || values.length === 0) {
          delete newFilters[field];
        } else {
          newFilters[field] = values;
        }
        return newFilters;
      });
    });
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Loading indicator only, no header */}
      {(isPending || isComputing) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-md">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Updating...</span>
        </div>
      )}

      {/* Drag and Drop Fields with Integrated Pivot Table */}
      <div className="flex-1 min-h-0">
        <DragDropFields
          fieldState={pendingFieldState}
          onFieldStateChange={handleFieldStateChange}
          data={data}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          pivotTable={pivotTable}
          isComputing={isComputing}
          isPending={isPending}
          aggregationType={aggregationType}
          onAggregationChange={handleAggregationChange}
          selectedRendererId={selectedRendererId}
          onRendererChange={setSelectedRendererId}
          pivotItemThreshold={pivotItemThreshold}
          valueField={valueField}
          onValueFieldChange={setValueField}
          fieldLabels={fieldLabels}
        />
      </div>
    </div>
  );
}