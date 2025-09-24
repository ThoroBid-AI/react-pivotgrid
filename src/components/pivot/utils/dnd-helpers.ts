import type { FieldKey, DraggedField } from '../types';

// Helper function to parse zone and field from drag IDs
export function getZoneAndField<T extends Record<string, unknown> = Record<string, unknown>>(
  id: string
): DraggedField<T> & { index: number } {
  const parts = id.split('-');
  // Check if it's a zone ID (rows, columns, values)
  if (parts.length === 1 && ['rows', 'columns', 'values'].includes(parts[0])) {
    return {
      zone: parts[0] as 'rows' | 'columns' | 'values',
      field: '' as FieldKey<T>,
      index: -1
    };
  }
  if (parts.length >= 2) {
    // The ID format is: zone-field-index
    // But field itself might contain hyphens, so we need to handle that
    const zone = parts[0] as 'available' | 'rows' | 'columns' | 'values';
    const index = parseInt(parts[parts.length - 1]);

    // If the last part is a valid number, it's the index
    if (!isNaN(index)) {
      const field = parts.slice(1, -1).join('-') as FieldKey<T>;
      return { zone, field, index };
    } else {
      // Otherwise, the entire rest is the field name (for available fields)
      const field = parts.slice(1).join('-') as FieldKey<T>;
      return { zone, field, index: 0 };
    }
  }
  return {
    zone: id as 'available' | 'rows' | 'columns' | 'values',
    field: '' as FieldKey<T>,
    index: 0
  };
}