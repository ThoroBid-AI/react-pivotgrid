'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, X, Check, Search } from 'lucide-react';
import { SimpleTooltip } from './simple-tooltip';

interface DraggableFieldWithFilterProps {
  id: string;
  field: string;
  fieldLabel?: string;
  removable?: boolean;
  onRemove?: () => void;
  uniqueValues: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DraggableFieldWithFilter({
  id,
  field,
  fieldLabel,
  removable,
  onRemove,
  uniqueValues,
  selectedValues,
  onFilterChange,
  disabled = false,
  disabledReason,
}: DraggableFieldWithFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        chevronRef.current &&
        !chevronRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter unique values based on search
  const filteredValues = uniqueValues.filter(value =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate and sort selected and unselected values
  const selectedFilteredValues = filteredValues
    .filter(value => selectedValues.includes(value))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const unselectedFilteredValues = filteredValues
    .filter(value => !selectedValues.includes(value))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onFilterChange(newValues);
  };

  const handleSelectAll = () => {
    onFilterChange(filteredValues);
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  // Create drag listeners that exclude the chevron button and respect disabled state
  const dragListeners = disabled ? {} : {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      // Don't start drag if clicking on chevron or remove button
      if (
        chevronRef.current?.contains(e.target as Node) ||
        (e.target as HTMLElement).closest('[data-no-drag]')
      ) {
        return;
      }
      listeners?.onPointerDown?.(e);
    },
  };

  const fieldElement = (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        inline-flex px-3 py-1.5 rounded-md text-xs font-medium
        items-center gap-1
        ${disabled
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
          : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700 cursor-move hover:bg-blue-200 dark:hover:bg-blue-800'
        }
        ${isDragging && !disabled ? 'shadow-lg' : ''}
      `}
      {...attributes}
      {...dragListeners}
    >
      <span className="select-none whitespace-nowrap">{fieldLabel || field}</span>

        {/* Filter count badge */}
        {selectedValues.length > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
            {selectedValues.length}
          </span>
        )}

        {/* Chevron for filter - always functional */}
        <button
          ref={chevronRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsFilterOpen(!isFilterOpen);
          }}
          className="ml-1 p-0.5 rounded hover:bg-blue-300 dark:hover:bg-blue-700"
          data-no-drag
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
          />
        </button>

      {/* Remove button */}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600 dark:hover:text-red-400"
          data-no-drag
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  return (
    <div className="relative inline-block">
      {disabled && disabledReason ? (
        <SimpleTooltip content={disabledReason}>
          {fieldElement}
        </SimpleTooltip>
      ) : (
        fieldElement
      )}

      {/* Filter dropdown */}
      {isFilterOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[80] mt-1 w-64 bg-white dark:bg-gray-700 border
                   border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${fieldLabel || field}...`}
                className="w-full pl-7 pr-2 py-1 text-xs border rounded
                         dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-2 flex gap-2 border-b border-gray-200 dark:border-gray-600">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredValues.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                No matches found
              </div>
            ) : (
              <>
                {/* Selected items first */}
                {selectedFilteredValues.map(value => (
                  <label
                    key={value}
                    className="flex items-center px-3 py-1.5 text-xs hover:bg-gray-100
                             dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggle(value)}
                      className="mr-2 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="flex-1">{value}</span>
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </label>
                ))}

                {/* Divider between selected and unselected */}
                {selectedFilteredValues.length > 0 && unselectedFilteredValues.length > 0 && (
                  <div className="mx-3 my-1 border-t border-gray-200 dark:border-gray-600" />
                )}

                {/* Unselected items */}
                {unselectedFilteredValues.map(value => (
                  <label
                    key={value}
                    className="flex items-center px-3 py-1.5 text-xs hover:bg-gray-100
                             dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggle(value)}
                      className="mr-2 rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="flex-1">{value}</span>
                  </label>
                ))}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
            {selectedValues.length} of {uniqueValues.length} selected
          </div>
        </div>
      )}
    </div>
  );
}