'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DraggableFieldItem } from './draggable-field-item';
import type { DroppableZoneProps } from '../types';

export const DroppableZone = React.memo(function DroppableZone<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  id,
  title,
  fields,
  horizontal = false,
  className = '',
  onRemove,
  data,
  activeFilters,
  onFilterChange,
  fieldLabels,
  dropIndicator,
  sortState,
  onSort
}: DroppableZoneProps<T>) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id,
    data: { type: 'zone' }
  });

  // Component for the drop indicator line - memoized for performance
  const DropIndicator = React.memo(({ index, horizontal }: { index: number; horizontal: boolean }) => {
    if (!dropIndicator || !dropIndicator.isOver || dropIndicator.targetIndex !== index) {
      return null;
    }

    return (
      <div
        className={`${
          horizontal
            ? 'w-0.5 h-8 border-l-2'
            : 'h-0.5 w-full border-t-2'
        } border-dashed border-blue-500 bg-blue-500/20 transition-opacity duration-150`}
        style={{
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
        }}
      />
    );
  });
  DropIndicator.displayName = 'DropIndicator';

  return (
    <div
      ref={setNodeRef}
      className={`
        relative p-3 border-2 border-dashed rounded-lg w-full block
        ${isOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-300 dark:border-gray-600'}
        ${className}
      `}
      style={{ minHeight: horizontal ? '100px' : 'auto' }}
    >
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center justify-between">
        <span>{title}</span>
        {onSort && fields.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Sort by totals:</span>
            <button
              onClick={() => onSort()}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={`Sort ${title.toLowerCase()} by totals (${sortState?.order || 'original'})`}
            >
              {sortState?.order === 'asc' && <ArrowUp className="w-3 h-3" />}
              {sortState?.order === 'desc' && <ArrowDown className="w-3 h-3" />}
              {(!sortState?.order || sortState.order === 'original') && <ArrowUpDown className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
      <div className={`${horizontal ? "flex flex-wrap gap-2 items-center" : "flex flex-col gap-2"} w-full`}
           style={{ minHeight: horizontal && fields.length === 0 ? '60px' : 'auto' }}>
        {fields.length === 0 ? (
          <div className={`w-full ${horizontal ? 'flex items-center' : ''}`}>
            {/* Show indicator at the beginning for empty zones */}
            {dropIndicator?.isOver && (
              <DropIndicator index={0} horizontal={horizontal} />
            )}
            <div className={`text-xs text-gray-400 dark:text-gray-500 italic flex-1 ${horizontal ? 'flex items-center justify-center' : ''}`}
                 style={{ minHeight: horizontal ? '60px' : 'auto' }}>
              Drag fields here
            </div>
          </div>
        ) : (
          <SortableContext
            items={fields.map((f, i) => `${id}-${f}-${i}`)}
            strategy={horizontal ? horizontalListSortingStrategy : verticalListSortingStrategy}
          >
            {fields.map((field, index) => {
              return (
                <React.Fragment key={`${id}-${field}-${index}`}>
                  {/* Show drop indicator before this item if it's the target */}
                  <DropIndicator index={index} horizontal={horizontal} />

                  <DraggableFieldItem
                    id={`${id}-${field}-${index}`}
                    field={field}
                    fieldLabel={fieldLabels?.[field]}
                    data={data}
                    removable={true}
                    onRemove={() => onRemove?.(index)}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                  />

                  {/* Show drop indicator after the last item */}
                  {index === fields.length - 1 && (
                    <DropIndicator index={index + 1} horizontal={horizontal} />
                  )}
                </React.Fragment>
              );
            })}
          </SortableContext>
        )}
      </div>
    </div>
  );
});