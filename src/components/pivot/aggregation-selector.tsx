'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AggregationFunction, getAggregationLabel } from './utils/aggregations';

interface AggregationSelectorProps {
  value: AggregationFunction;
  onChange: (value: AggregationFunction) => void;
  className?: string;
  fullWidth?: boolean;
}

export function AggregationSelector({ value, onChange, className = '', fullWidth = false }: AggregationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const aggregationOptions: AggregationFunction[] = [
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
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3 py-1.5 text-xs border rounded-md
                   bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                   hover:bg-gray-50 dark:hover:bg-gray-600 ${fullWidth ? 'w-full' : ''}`}
      >
        <span>{getAggregationLabel(value)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-white dark:bg-gray-700 border
                      border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {aggregationOptions.map(option => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-600
                  ${value === option ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}
                `}
              >
                {getAggregationLabel(option)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}