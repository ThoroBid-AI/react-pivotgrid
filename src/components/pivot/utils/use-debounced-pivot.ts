import { useEffect, useRef, useState } from 'react';
import type { PivotConfig, PivotTable, DataItem } from '../types';
import { generatePivotTableAsync, PivotValidationError } from './pivot-data-async';

/**
 * Custom hook to debounce pivot table calculations and compute them
 * asynchronously to prevent blocking the UI
 */
export function useDebouncedPivot<T extends Record<string, unknown> = Record<string, unknown>>(
  data: DataItem<T>[],
  config: PivotConfig<T>,
  debounceMs: number = 300,
  onValidationError?: (error: PivotValidationError) => void,
  pivotItemThreshold: number = 1000
) {
  // Initialize with empty pivot table to avoid initial computation
  const [pivotTable, setPivotTable] = useState<PivotTable<T>>({
    rowHeaders: [],
    columnHeaders: [],
    cells: [],
    rowTotals: [],
    columnTotals: [],
    grandTotal: {},
  });

  const [isComputing, setIsComputing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const computationRef = useRef<AbortController | undefined>(undefined);
  const lastComputedConfig = useRef<string>('');

  useEffect(() => {
    // Create a unique key for the current configuration
    const configKey = JSON.stringify(config);

    // Skip if configuration hasn't changed
    if (configKey === lastComputedConfig.current && pivotTable.cells.length > 0) {
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort any ongoing computation
    if (computationRef.current) {
      computationRef.current.abort();
    }

    // Set computing state immediately when config changes
    setIsComputing(true);

    // Debounce the actual computation
    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      computationRef.current = controller;

      try {
        // Run computation asynchronously
        const result = await generatePivotTableAsync(data, config, controller.signal, pivotItemThreshold);

        if (!controller.signal.aborted) {
          setPivotTable(result);
          lastComputedConfig.current = configKey;
          setIsComputing(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error instanceof PivotValidationError) {
            // Handle validation error - notify parent to eject the field
            onValidationError?.(error);
            setIsComputing(false);
          } else {
            console.error('Error computing pivot table:', error);
            setIsComputing(false);
          }
        }
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (computationRef.current) {
        computationRef.current.abort();
      }
    };
  }, [data, config, debounceMs, onValidationError, pivotItemThreshold]);

  // Initial computation
  useEffect(() => {
    const controller = new AbortController();

    const initialize = async () => {
      setIsComputing(true);
      try {
        const result = await generatePivotTableAsync(data, config, controller.signal, pivotItemThreshold);
        if (!controller.signal.aborted) {
          setPivotTable(result);
          lastComputedConfig.current = JSON.stringify(config);
          setIsComputing(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error instanceof PivotValidationError) {
            // Handle validation error - notify parent to eject the field
            onValidationError?.(error);
            setIsComputing(false);
          } else {
            console.error('Error computing initial pivot table:', error);
            setIsComputing(false);
          }
        }
      }
    };

    initialize();

    return () => {
      controller.abort();
    };
  }, []); // Run only once on mount

  return { pivotTable, isComputing };
}