'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  CollisionDetection,
  Collision,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RendererProvider } from './components/renderer-provider';
import { defaultRendererRegistry } from './renderers';
import type {
  PivotFieldState,
  SortState,
  FieldKey,
  DropIndicatorState,
  DragDropFieldsProps,
} from './types';
import { getZoneAndField } from './utils/dnd-helpers';
import { AvailableFieldItem } from './components/available-field-item';
import { DroppableZone } from './components/droppable-zone';
import { ControlPanel } from './components/control-panel';

export function DragDropFields<T extends Record<string, unknown> = Record<string, unknown>>({
  fieldState,
  onFieldStateChange,
  data,
  activeFilters,
  onFilterChange,
  pivotTable,
  isComputing = false,
  isPending = false,
  aggregationType,
  onAggregationChange,
  selectedRendererId = 'tanstack-table',
  onRendererChange,
  pivotItemThreshold = 1000,
  valueField,
  onValueFieldChange,
  fieldLabels,
  mobileView = false,
  showAdvanced = false
}: DragDropFieldsProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sort states for rows and columns
  const [rowSortState, setRowSortState] = useState<SortState<T> | undefined>();
  const [columnSortState, setColumnSortState] = useState<SortState<T> | undefined>();

  // State for drop indicators
  const [dropIndicators, setDropIndicators] = useState<DropIndicatorState>({});

  // Refs for performance optimization
  const dropIndicatorUpdateRef = useRef<number | undefined>(undefined);
  const lastOverIdRef = useRef<string | null>(null);
  const lastDropIndexRef = useRef<{ [key: string]: number }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (dropIndicatorUpdateRef.current) {
        cancelAnimationFrame(dropIndicatorUpdateRef.current);
      }
    };
  }, []);

  // Calculate remaining available fields (fields not used in rows/columns/values)
  const remainingAvailableFields = useMemo(() => {
    const usedFields = new Set([
      ...fieldState.rows,
      ...fieldState.columns,
      ...fieldState.values
    ]);
    return fieldState.availableFields.filter(field => !usedFields.has(field));
  }, [fieldState]);

  // Calculate distinct counts for each field considering active filters
  const fieldDistinctCounts = useMemo(() => {
    const counts: Record<FieldKey<T>, number> = {} as Record<FieldKey<T>, number>;

    // Apply active filters to data
    const filteredData = data.filter(item => {
      return Object.entries(activeFilters).every(([field, values]) => {
        if (values.length === 0) return true;
        const itemValue = String(item[field as FieldKey<T>] ?? 'null');
        return values.includes(itemValue);
      });
    });

    // Calculate distinct count for each available field
    fieldState.availableFields.forEach(field => {
      const uniqueValues = new Set<string>();
      filteredData.forEach(item => {
        uniqueValues.add(String(item[field] ?? 'null'));
      });
      counts[field] = uniqueValues.size;
    });

    return counts;
  }, [data, fieldState.availableFields, activeFilters]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Clear drop indicators and refs when starting a new drag
    setDropIndicators({});
    lastOverIdRef.current = null;
    lastDropIndexRef.current = {};
  };

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    // Early exit if nothing changed
    if (!over) {
      if (lastOverIdRef.current !== null) {
        lastOverIdRef.current = null;
        setDropIndicators({});
      }
      return;
    }

    const overId = over.id as string;

    // Skip if we're still over the same element
    if (lastOverIdRef.current === overId) {
      return;
    }

    lastOverIdRef.current = overId;

    // Cancel any pending update
    if (dropIndicatorUpdateRef.current) {
      cancelAnimationFrame(dropIndicatorUpdateRef.current);
    }

    // Use RAF to batch updates
    dropIndicatorUpdateRef.current = requestAnimationFrame(() => {
      const activeData = getZoneAndField<T>(active.id as string);
      const overData = getZoneAndField<T>(overId);

      // Calculate drop index based on cursor position
      const calculateDropIndex = (zone: 'rows' | 'columns' | 'values', isHorizontal: boolean) => {
        const zoneFields = fieldState[zone];

        // If we're over the zone itself (not a specific field)
        if (overId === zone) {
          // Drop at the end when dragging to empty zone or zone background
          return zoneFields.length;
        }

        // If dropping on a field that doesn't exist in this zone, drop at end
        if (!overData.field || !zoneFields.includes(overData.field)) {
          return zoneFields.length;
        }

        const targetIndex = zoneFields.indexOf(overData.field);

        // Use collision rect for accurate positioning
        if (over.rect) {
          const overRect = over.rect;
          const activeRect = active.rect?.current?.translated;

          if (activeRect) {
            if (isHorizontal) {
              const activeCenterX = activeRect.left + activeRect.width / 2;
              const overCenterX = overRect.left + overRect.width / 2;
              return activeCenterX < overCenterX ? targetIndex : targetIndex + 1;
            } else {
              const activeCenterY = activeRect.top + activeRect.height / 2;
              const overCenterY = overRect.top + overRect.height / 2;
              return activeCenterY < overCenterY ? targetIndex : targetIndex + 1;
            }
          }
        }

        return targetIndex + 1;
      };

      // Determine which zone we're over
      let targetZone: 'rows' | 'columns' | 'values' | null = null;
      let isHorizontal = false;

      if (overData.zone === 'rows' || overId === 'rows') {
        targetZone = 'rows';
        isHorizontal = false;
      } else if (overData.zone === 'columns' || overId === 'columns') {
        targetZone = 'columns';
        isHorizontal = true;
      } else if (overData.zone === 'values' || overId === 'values') {
        targetZone = 'values';
        isHorizontal = false;
      }

      if (!targetZone) {
        setDropIndicators({});
        return;
      }

      const dropIndex = calculateDropIndex(targetZone, isHorizontal);

      // Check if index actually changed
      if (lastDropIndexRef.current[targetZone] === dropIndex) {
        return;
      }

      lastDropIndexRef.current[targetZone] = dropIndex;

      // Don't show indicator if dragging within same zone and dropping at same position
      if (activeData.zone === targetZone) {
        const currentIndex = fieldState[targetZone].indexOf(activeData.field);
        if (currentIndex === dropIndex || currentIndex === dropIndex - 1) {
          setDropIndicators({});
          return;
        }
      }

      // Update only the specific zone indicator
      setDropIndicators({
        [targetZone]: { targetIndex: dropIndex, isOver: true }
      });
    });
  }, [fieldState]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drop indicators and refs
    setDropIndicators({});
    lastOverIdRef.current = null;
    lastDropIndexRef.current = {};

    // Cancel any pending RAF
    if (dropIndicatorUpdateRef.current) {
      cancelAnimationFrame(dropIndicatorUpdateRef.current);
    }

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeData = getZoneAndField<T>(activeId);
    const overData = getZoneAndField<T>(overId);

    const newState = { ...fieldState };

    // Get the drop position for precise insertion - should match the visual indicator
    const getDropIndex = (zone: 'rows' | 'columns' | 'values', targetField: string | undefined, isHorizontal: boolean) => {
      // If we're over the zone itself (not a specific field), drop at end
      if (overId === zone) {
        return newState[zone].length;
      }

      // If no target field or field doesn't exist in zone, drop at end
      if (!targetField || !newState[zone].includes(targetField)) {
        return newState[zone].length;
      }

      const targetIndex = newState[zone].indexOf(targetField);

      // Use the over element's rect for positioning
      if (over.rect) {
        const overRect = over.rect;
        const activeRect = active.rect?.current?.translated;

        if (activeRect) {
          if (isHorizontal) {
            // Compare the centers horizontally
            const activeCenterX = activeRect.left + activeRect.width / 2;
            const overCenterX = overRect.left + overRect.width / 2;
            return activeCenterX < overCenterX ? targetIndex : targetIndex + 1;
          } else {
            // Compare the centers vertically
            const activeCenterY = activeRect.top + activeRect.height / 2;
            const overCenterY = overRect.top + overRect.height / 2;
            return activeCenterY < overCenterY ? targetIndex : targetIndex + 1;
          }
        }
      }

      // Default to inserting after the target
      return targetIndex + 1;
    };

    // Check if we're reordering within the same zone
    if (activeData.zone === overData.zone && activeData.zone !== 'available') {
      const zone = activeData.zone as 'rows' | 'columns' | 'values';
      const isHorizontal = zone === 'columns';

      // For reordering, we need to check if we're over another field or just the zone
      if (overData.field) {
        // Reordering within the zone - dragging one field over another
        const oldIndex = newState[zone].indexOf(activeData.field);
        const dropIndex = getDropIndex(zone, overData.field, isHorizontal);

        if (oldIndex !== -1) {
          // Remove from old position
          const [removed] = newState[zone].splice(oldIndex, 1);

          // Calculate new index after removal
          let newIndex = dropIndex;
          if (oldIndex < dropIndex) {
            newIndex--;
          }

          // Insert at new position
          newState[zone].splice(newIndex, 0, removed);
          onFieldStateChange(newState);
          setActiveId(null);
          return;
        }
      } else {
        // Dropped on the zone itself (not on another field) - move to end
        const oldIndex = newState[zone].indexOf(activeData.field);
        if (oldIndex !== -1) {
          // Remove from current position
          newState[zone] = newState[zone].filter((_, i) => i !== oldIndex);
          // Add to end
          newState[zone].push(activeData.field);
          onFieldStateChange(newState);
          setActiveId(null);
          return;
        }
      }
    }

    // Remove field from source zone
    const removeFromZone = (zone: string, field: string) => {
      switch (zone) {
        case 'available':
          // Available fields are never removed from the list
          break;
        case 'rows':
          newState.rows = newState.rows.filter(f => f !== field);
          break;
        case 'columns':
          newState.columns = newState.columns.filter(f => f !== field);
          break;
        case 'values':
          newState.values = newState.values.filter(f => f !== field);
          break;
      }
    };

    // Add field to destination zone with precise positioning
    const addToZone = (zone: string, field: string, targetField?: string) => {
      switch (zone) {
        case 'available':
          // Fields can't be dragged back to available
          break;
        case 'rows':
          if (!newState.rows.includes(field)) {
            const dropIndex = getDropIndex('rows', targetField, false);
            newState.rows.splice(dropIndex, 0, field);
          }
          break;
        case 'columns':
          if (!newState.columns.includes(field)) {
            const dropIndex = getDropIndex('columns', targetField, true);
            newState.columns.splice(dropIndex, 0, field);
          }
          break;
        case 'values':
          if (!newState.values.includes(field)) {
            const dropIndex = getDropIndex('values', targetField, false);
            newState.values.splice(dropIndex, 0, field);
          }
          break;
      }
    };

    // Handle drag from available to row/column/value
    if (activeData.zone === 'available') {
      // Only add if destination is not available
      if (overData.zone !== 'available') {
        addToZone(overData.zone, activeData.field, overData.field);
      }
    } else {
      // Moving between zones or back to available
      removeFromZone(activeData.zone, activeData.field);
      if (overData.zone !== 'available') {
        addToZone(overData.zone, activeData.field, overData.field);
      }
    }

    onFieldStateChange(newState);
    setActiveId(null);
  };

  const handleRemove = (zone: 'rows' | 'columns' | 'values', index: number) => {
    const newState: PivotFieldState<T> = { ...fieldState };
    newState[zone] = newState[zone].filter((_, i) => i !== index);
    onFieldStateChange(newState);
  };

  // Handle sort for rows - sorting by row totals
  const handleRowSort = () => {
    setRowSortState(prev => {
      // We use a special field name 'totals' to indicate sorting by totals
      const field = 'totals' as FieldKey<T>;
      if (!prev || prev.field !== field) {
        return { field, order: 'asc' as const };
      }
      if (prev.order === 'asc') {
        return { field, order: 'desc' as const };
      }
      if (prev.order === 'desc') {
        return { field, order: 'original' as const };
      }
      return { field, order: 'asc' as const };
    });
  };

  // Handle sort for columns - sorting by column totals
  const handleColumnSort = () => {
    setColumnSortState(prev => {
      // We use a special field name 'totals' to indicate sorting by totals
      const field = 'totals' as FieldKey<T>;
      if (!prev || prev.field !== field) {
        return { field, order: 'asc' as const };
      }
      if (prev.order === 'asc') {
        return { field, order: 'desc' as const };
      }
      if (prev.order === 'desc') {
        return { field, order: 'original' as const };
      }
      return { field, order: 'asc' as const };
    });
  };

  // Custom collision detection that handles both zones and sortable items
  const customCollisionDetection: CollisionDetection = (args) => {
    // Get the active item zone
    const activeZone = activeId ? getZoneAndField<T>(activeId).zone : null;

    // First check for pointer within (most precise for drop zones)
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Sort collisions by priority: specific items first, then zones
      const sortedCollisions = pointerCollisions.sort((a: Collision, b: Collision) => {
        const aIsZone = ['rows', 'columns', 'values'].includes(a.id as string);
        const bIsZone = ['rows', 'columns', 'values'].includes(b.id as string);

        // Prefer specific items over zones
        if (!aIsZone && bIsZone) return -1;
        if (aIsZone && !bIsZone) return 1;

        // If both are items, prefer items from non-available zones
        if (!aIsZone && !bIsZone) {
          const aZone = getZoneAndField<T>(a.id as string).zone;
          const bZone = getZoneAndField<T>(b.id as string).zone;
          if (aZone !== 'available' && bZone === 'available') return -1;
          if (aZone === 'available' && bZone !== 'available') return 1;
        }

        return 0;
      });

      // If dragging from available, prefer specific items over zones for precise placement
      if (activeZone === 'available' && sortedCollisions.length > 0) {
        const itemCollisions = sortedCollisions.filter((collision: Collision) => {
          const id = collision.id as string;
          return !['rows', 'columns', 'values'].includes(id);
        });

        if (itemCollisions.length > 0) {
          return [itemCollisions[0]];
        }
      }

      return sortedCollisions.slice(0, 1);
    }

    // Fallback to rect intersection for broader collision detection
    const rectCollisions = rectIntersection(args);

    if (rectCollisions.length > 0) {
      // If dragging within the same zone, prioritize reordering
      if (activeZone && activeZone !== 'available') {
        const sameZoneCollisions = rectCollisions.filter((collision: Collision) => {
          const collisionZone = getZoneAndField<T>(collision.id as string).zone;
          return collisionZone === activeZone;
        });

        if (sameZoneCollisions.length > 0) {
          return sameZoneCollisions;
        }
      }

      // Check for zone collisions
      const zoneCollisions = rectCollisions.filter((collision: Collision) =>
        ['rows', 'columns', 'values'].includes(collision.id as string)
      );

      if (zoneCollisions.length > 0) {
        return zoneCollisions;
      }

      return rectCollisions;
    }

    // Final fallback to closest center for edge cases
    return closestCenter(args);
  };

  // Show loading state during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={mobileView ? "flex flex-col h-full" : "grid grid-cols-12 grid-rows-[auto_auto_1fr] gap-3 h-full p-2"}>
        <div className="col-span-12 flex items-center justify-center p-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Mobile layout when mobileView is true
  if (mobileView) {
    // If showAdvanced is true, we're in the dialog mode - show ONLY the controls
    if (showAdvanced) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col h-full">
            <div className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              {/* Renderer Control */}
              <ControlPanel
                selectedRendererId={selectedRendererId}
                onRendererChange={onRendererChange}
                aggregationType={aggregationType}
                onAggregationChange={onAggregationChange}
                valueField={valueField}
                onValueFieldChange={onValueFieldChange}
                availableFields={fieldState.availableFields}
                data={data}
              />

              {/* Available Fields */}
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Available Fields
                </div>
                <div className="flex flex-wrap gap-2">
                  <SortableContext
                    items={remainingAvailableFields.map(f => `available-${f}-0`)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {remainingAvailableFields.length === 0 ? (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        All fields are in use
                      </div>
                    ) : (
                      remainingAvailableFields.map((field) => {
                        const distinctCount = fieldDistinctCounts[field] || 0;
                        const isDisabled = distinctCount > pivotItemThreshold;

                        return (
                          <AvailableFieldItem
                            key={`available-${field}`}
                            id={`available-${field}-0`}
                            field={field}
                            fieldLabel={fieldLabels?.[field]}
                            data={data}
                            activeFilters={activeFilters}
                            onFilterChange={onFilterChange}
                            disabled={isDisabled}
                            disabledReason={isDisabled ? `Too many unique values (${distinctCount.toLocaleString()}). Apply filters to reduce.` : undefined}
                          />
                        );
                      })
                    )}
                  </SortableContext>
                </div>
              </div>

              {/* Columns */}
              <DroppableZone
                id="columns"
                title="Columns"
                fields={fieldState.columns}
                horizontal={true}
                className="min-h-[80px]"
                onRemove={(index) => handleRemove('columns', index)}
                data={data}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                fieldLabels={fieldLabels}
                dropIndicator={dropIndicators.columns}
                sortState={columnSortState as SortState<Record<string, unknown>> | undefined}
                onSort={handleColumnSort}
              />

              {/* Rows */}
              <DroppableZone
                id="rows"
                title="Rows"
                fields={fieldState.rows}
                horizontal={true}
                className="min-h-[80px]"
                onRemove={(index) => handleRemove('rows', index)}
                data={data}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                fieldLabels={fieldLabels}
                dropIndicator={dropIndicators.rows}
                sortState={rowSortState as SortState<Record<string, unknown>> | undefined}
                onSort={handleRowSort}
              />
            </div>

            {/* DragOverlay for drag feedback */}
            <DragOverlay>
              {activeId ? (
                <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100
                              border border-blue-300 dark:border-blue-700 rounded-md text-xs font-medium
                              shadow-lg cursor-move flex items-center gap-1">
                  <span>{activeId.split('-').slice(1, -1).join('-')}</span>
                </div>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>
      );
    }

    // Regular mobile view with just the pivot table
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col h-full">
          {/* Pivot Table only */}
          <div className="flex-1 bg-white dark:bg-gray-800 overflow-auto relative">
            {/* Loading overlay */}
            {(isPending || isComputing) && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Processing data...
                  </span>
                </div>
              </div>
            )}
            <RendererProvider
              selectedRendererId={selectedRendererId}
              registry={defaultRendererRegistry}
              rendererProps={{
                pivotData: pivotTable,
                rowFields: fieldState.rows,
                columnFields: fieldState.columns,
                valueFields: fieldState.values,
                rowSortState: rowSortState as SortState<Record<string, unknown>> | undefined,
                columnSortState: columnSortState as SortState<Record<string, unknown>> | undefined,
              }}
            />
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100
                          border border-blue-300 dark:border-blue-700 rounded-md text-xs font-medium
                          shadow-lg cursor-move flex items-center gap-1">
              <span>{activeId.split('-').slice(1, -1).join('-')}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-12 grid-rows-[auto_auto_1fr] gap-3 h-full p-4">
        {/* Top-left corner - Controls */}
        <ControlPanel
          selectedRendererId={selectedRendererId}
          onRendererChange={onRendererChange}
          aggregationType={aggregationType}
          onAggregationChange={onAggregationChange}
          valueField={valueField}
          onValueFieldChange={onValueFieldChange}
          availableFields={fieldState.availableFields}
          data={data}
        />

        {/* Top-right - Available Fields */}
        <div className="col-span-10 row-span-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Available Fields
          </div>
          <div className="flex flex-wrap gap-2">
            <SortableContext
              items={remainingAvailableFields.map(f => `available-${f}-0`)}
              strategy={horizontalListSortingStrategy}
            >
              {remainingAvailableFields.length === 0 ? (
                <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                  All fields are in use
                </div>
              ) : (
                remainingAvailableFields.map((field) => {
                  const distinctCount = fieldDistinctCounts[field] || 0;
                  const isDisabled = distinctCount > pivotItemThreshold;

                  return (
                    <AvailableFieldItem
                      key={`available-${field}`}
                      id={`available-${field}-0`}
                      field={field}
                      fieldLabel={fieldLabels?.[field]}
                      data={data}
                      activeFilters={activeFilters}
                      onFilterChange={onFilterChange}
                      disabled={isDisabled}
                      disabledReason={isDisabled ? `Too many unique values (${distinctCount.toLocaleString()}). Apply filters to reduce.` : undefined}
                    />
                  );
                })
              )}
            </SortableContext>
          </div>
        </div>

        {/* Middle-left - Empty space */}
        <div className="col-span-2 row-span-1">
          {/* Empty space below corner */}
        </div>

        {/* Middle-right - Columns */}
        <div className="col-span-10 row-span-1">
          <DroppableZone
            id="columns"
            title="Columns"
            fields={fieldState.columns}
            horizontal={true}
            className="min-h-[100px] w-full h-full"
            onRemove={(index) => handleRemove('columns', index)}
            data={data}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            fieldLabels={fieldLabels}
            dropIndicator={dropIndicators.columns}
            sortState={columnSortState as SortState<Record<string, unknown>> | undefined}
            onSort={handleColumnSort}
          />
        </div>

        {/* Bottom-left - Rows */}
        <div className="col-span-2 row-span-10">
          <DroppableZone
            id="rows"
            title="Rows"
            fields={fieldState.rows}
            horizontal={false}
            className="h-full"
            onRemove={(index) => handleRemove('rows', index)}
            data={data}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            fieldLabels={fieldLabels}
            dropIndicator={dropIndicators.rows}
            sortState={rowSortState as SortState<Record<string, unknown>> | undefined}
            onSort={handleRowSort}
          />
        </div>

        {/* Bottom-right - Pivot Table */}
        <div className="col-span-10 row-span-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-auto relative min-h-[400px]">
          {/* Loading overlay */}
          {(isPending || isComputing) && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing data...
                </span>
              </div>
            </div>
          )}
          <RendererProvider
            selectedRendererId={selectedRendererId}
            registry={defaultRendererRegistry}
            rendererProps={{
              pivotData: pivotTable,
              rowFields: fieldState.rows,
              columnFields: fieldState.columns,
              valueFields: fieldState.values,
              rowSortState: rowSortState as SortState<Record<string, unknown>> | undefined,
              columnSortState: columnSortState as SortState<Record<string, unknown>> | undefined,
            }}
          />
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100
                        border border-blue-300 dark:border-blue-700 rounded-md text-xs font-medium
                        shadow-lg cursor-move flex items-center gap-1">
            <span>{activeId.split('-').slice(1, -1).join('-')}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}