'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AggregationSelector } from '../aggregation-selector';
import { RendererSelector } from './renderer-selector';
import { defaultRendererRegistry } from '../renderers';
import type { ControlPanelProps, FieldKey } from '../types';

export const ControlPanel = React.memo(function ControlPanel<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  selectedRendererId = 'tanstack-table',
  onRendererChange,
  aggregationType,
  onAggregationChange,
  valueField,
  onValueFieldChange,
  availableFields,
  data
}: ControlPanelProps<T>) {
  const [isValueFieldOpen, setIsValueFieldOpen] = useState(false);
  const valueFieldRef = useRef<HTMLDivElement>(null);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (valueFieldRef.current && !valueFieldRef.current.contains(event.target as Node)) {
        setIsValueFieldOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="col-span-2 row-span-3 space-y-3">
      {/* Renderer Selector */}
      {onRendererChange && (
        <RendererSelector
          selectedRendererId={selectedRendererId}
          onRendererChange={onRendererChange}
          registry={defaultRendererRegistry}
        />
      )}

      {/* Aggregation */}
      <div>
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
          Aggregation
        </label>
        <AggregationSelector
          value={aggregationType}
          onChange={onAggregationChange}
          fullWidth={true}
        />
      </div>

      {/* Value Field - Only show when aggregation is not count */}
      {aggregationType !== 'count' && (
        <div ref={valueFieldRef} className="relative">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
            Value Field
          </label>
          <button
            onClick={() => setIsValueFieldOpen(!isValueFieldOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs border rounded-md
                     bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                     hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <span className={valueField ? '' : 'text-gray-400'}>
              {valueField || 'Select field...'}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isValueFieldOpen ? 'rotate-180' : ''}`} />
          </button>

          {isValueFieldOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border
                          border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {(() => {
                // Sort fields: compatible fields first, then incompatible
                const sortedFields = [...availableFields].sort((a, b) => {
                  const sampleValueA = data[0]?.[a as FieldKey<T>];
                  const sampleValueB = data[0]?.[b as FieldKey<T>];
                  const isNumericA = typeof sampleValueA === 'number' || !isNaN(parseFloat(String(sampleValueA)));
                  const isNumericB = typeof sampleValueB === 'number' || !isNaN(parseFloat(String(sampleValueB)));

                  // For countUnique and listUnique, all fields are compatible
                  if (aggregationType === 'countUnique' || aggregationType === 'listUnique') {
                    return a.localeCompare(b); // Just alphabetical sort
                  }

                  // For numeric aggregations, put numeric fields first
                  if (isNumericA && !isNumericB) return -1;
                  if (!isNumericA && isNumericB) return 1;
                  return a.localeCompare(b);
                });

                return sortedFields.map(field => {
                  // Check if this field is numeric for better suggestions
                  const sampleValue = data[0]?.[field as FieldKey<T>];
                  const isNumeric = typeof sampleValue === 'number' ||
                                   !isNaN(parseFloat(String(sampleValue)));
                  const isCompatible = isNumeric || aggregationType === 'listUnique' || aggregationType === 'countUnique';

                  return (
                    <button
                      key={field}
                      onClick={() => {
                        onValueFieldChange(field);
                        setIsValueFieldOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-600
                                ${valueField === field ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                                ${!isCompatible ? 'text-gray-400' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{field}</span>
                        {!isCompatible && (
                          <span className="text-[10px] text-gray-400 ml-2">(non-numeric)</span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
});