'use client';

import React from 'react';
import { DraggableFieldWithFilter } from '../draggable-field-with-filter';
import type { DataItem, AvailableFieldItemProps } from '../types';

export const AvailableFieldItem = React.memo(function AvailableFieldItem<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  id,
  field,
  fieldLabel,
  data,
  activeFilters,
  onFilterChange,
  disabled,
  disabledReason
}: AvailableFieldItemProps<T>) {
  // Memoize unique values calculation
  const uniqueValues = React.useMemo(() => {
    return Array.from(
      new Set(data.map((item: DataItem<T>) => String(item[field] ?? 'null')))
    ).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [data, field]);

  return (
    <DraggableFieldWithFilter
      id={id}
      field={field}
      fieldLabel={fieldLabel}
      removable={false}
      onRemove={() => {}}
      uniqueValues={uniqueValues}
      selectedValues={activeFilters[field] || []}
      onFilterChange={(values: string[]) => onFilterChange(field, values)}
      disabled={disabled}
      disabledReason={disabledReason}
    />
  );
});