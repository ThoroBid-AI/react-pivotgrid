'use client';

import React, { useState, useMemo, useTransition, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
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

interface MobilePivotProps<T extends Record<string, unknown> = Record<string, unknown>> {
  data: DataItem<T>[];
  initialConfig?: {
    rows?: FieldKey<T>[];
    columns?: FieldKey<T>[];
    values?: FieldKey<T>[];
    aggregation?: AggregationFunction;
    filters?: Partial<Record<FieldKey<T>, string[]>>;
  };
  pivotItemThreshold?: number;
  showAdvancedSettings?: boolean;
  onCloseSettings?: () => void;
}

export function MobilePivot<T extends Record<string, unknown> = Record<string, unknown>>({
  data,
  initialConfig,
  pivotItemThreshold = 1500, // Lower threshold for mobile
  showAdvancedSettings = false,
  onCloseSettings
}: MobilePivotProps<T>) {
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
    setPendingFieldState(newState);
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
    const newFieldState = { ...fieldState };

    if (error.fieldType === 'row') {
      newFieldState.rows = newFieldState.rows.filter(f => f !== error.fieldName);
    } else if (error.fieldType === 'column') {
      newFieldState.columns = newFieldState.columns.filter(f => f !== error.fieldName);
    }

    setFieldState(newFieldState);
    setPendingFieldState(newFieldState);
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
    <>
      <div className="w-full h-full flex flex-col relative">
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
            mobileView={true}
            showAdvanced={false}
          />
        </div>
      </div>

      {/* Advanced Settings Dialog with DnD */}
      <Dialog open={showAdvancedSettings} onOpenChange={onCloseSettings}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] sm:max-w-[600px] h-[calc(100vh-4rem)] max-h-[800px] p-0 flex flex-col"
          showCloseButton={false}
        >
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle>Advanced Settings</DialogTitle>
            <DialogDescription>
              Drag fields to customize your pivot table layout
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div>
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
                mobileView={true}
                showAdvanced={true}
              />
            </div>
          </div>

          <div className="px-4 py-3 border-t mt-auto">
            <Button
              onClick={onCloseSettings}
              className="w-full"
              size="lg"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}