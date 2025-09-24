'use client';

import { useMemo, memo, JSX } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
  AccessorFnColumnDef,
  AccessorKeyColumnDef,
} from '@tanstack/react-table';
import { formatAggregatedValue } from '../utils/aggregations';
import type { PivotRenderer, BaseRendererProps } from '../types/renderer';
import type {
  PivotTable,
  SortState,
  FieldKey,
  DataItem,
  TableRow,
  PivotCell,
  AggregatedValues,
} from '../types';

// Custom column meta interface for extended meta properties
interface CustomColumnMeta {
  isRowHeader?: boolean;
  fieldIndex?: number;
}

// Column definition type for pivot table columns - allowing string specifically since that's what our accessors return
type PivotColumnDef<T extends Record<string, unknown>> =
  | AccessorFnColumnDef<TableRow<T>, string>
  | AccessorKeyColumnDef<TableRow<T>, string>
  | ColumnDef<TableRow<T>, string>;

interface PivotTableRendererProps<T extends Record<string, unknown> = Record<string, unknown>> {
  pivotData: PivotTable<T>;
  rowFields: FieldKey<T>[];
  columnFields: FieldKey<T>[];
  valueFields: FieldKey<T>[];
  rowSortState?: SortState<Record<string, unknown>>;
  columnSortState?: SortState<Record<string, unknown>>;
}

// Helper to check if this row header should be visible (for merging)
function shouldShowRowHeader(
  rowHeaders: string[][],
  rowIndex: number,
  fieldIndex: number,
  isLastRow: boolean = false
): boolean {
  // Always show totals row
  if (isLastRow) return true;

  // Always show first row
  if (rowIndex === 0) return true;

  // Check bounds
  if (rowIndex >= rowHeaders.length || !rowHeaders[rowIndex]) return true;

  // Check if all values up to this field are the same as previous row
  for (let i = 0; i <= fieldIndex; i++) {
    if (!rowHeaders[rowIndex - 1] ||
        !rowHeaders[rowIndex - 1][i] ||
        rowHeaders[rowIndex][i] !== rowHeaders[rowIndex - 1][i]) {
      return true;
    }
  }
  return false;
}

// Calculate rowspan for a cell
function calculateRowSpan(
  rowHeaders: string[][],
  rowIndex: number,
  fieldIndex: number,
  isLastRow: boolean = false
): number {
  // No rowspan for totals row
  if (isLastRow) return 1;

  // Check bounds
  if (rowIndex >= rowHeaders.length || !rowHeaders[rowIndex]) return 1;

  let span = 1;

  // Check how many consecutive rows have the same values up to this field
  for (let nextRow = rowIndex + 1; nextRow < rowHeaders.length; nextRow++) {
    if (!rowHeaders[nextRow]) break;

    let matches = true;
    for (let i = 0; i <= fieldIndex; i++) {
      if (!rowHeaders[nextRow][i] ||
          rowHeaders[nextRow][i] !== rowHeaders[rowIndex][i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      span++;
    } else {
      break;
    }
  }

  return span;
}

// Helper function to check if all values in a row are zero
function isRowAllZeros<T extends Record<string, unknown>>(row: PivotCell<T>[], rowTotal: AggregatedValues): boolean {
  // Check all cells in the row
  const allCellsZero = row.every(cell => {
    return Object.values(cell.value).every(val => val === 0);
  });

  // Check row total
  const totalZero = Object.values(rowTotal).every(val => val === 0);

  return allCellsZero && totalZero;
}

// Helper function to check if all values in a column are zero
function isColumnAllZeros<T extends Record<string, unknown>>(columnIndex: number, cells: PivotCell<T>[][], columnTotal: AggregatedValues): boolean {
  // Check all cells in the column
  const allCellsZero = cells.every(row => {
    if (!row[columnIndex]) return true;
    return Object.values(row[columnIndex].value).every(val => val === 0);
  });

  // Check column total
  const totalZero = Object.values(columnTotal).every(val => val === 0);

  return allCellsZero && totalZero;
}

export const PivotTableRenderer = memo(function PivotTableRenderer<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  pivotData,
  rowFields,
  columnFields,
  valueFields,
  rowSortState,
  columnSortState,
}: PivotTableRendererProps<T>) {

  // Transform pivot data into table rows with sorting first (needed for sortedRowHeaders)
  const { data, sortedRowHeaders, validColumnIndices, filteredColumnHeaders, filteredColumnTotals } = useMemo(() => {
    const rows: TableRow<T>[] = [];
    let sortedHeaders: string[][] = [];

    // First, identify which columns to keep (non-zero columns)
    const validColIndices: number[] = [];
    const filteredColHeaders: string[][] = [];
    const filteredColTotals: AggregatedValues[] = [];

    if (columnFields.length > 0) {
      pivotData.columnHeaders.forEach((header, colIndex) => {
        const colTotal = pivotData.columnTotals[colIndex];
        if (!isColumnAllZeros(colIndex, pivotData.cells, colTotal)) {
          validColIndices.push(colIndex);
          filteredColHeaders.push(header);
          filteredColTotals.push(colTotal);
        }
      });
    } else {
      // If no column fields, keep all columns
      pivotData.columnHeaders.forEach((header, colIndex) => {
        validColIndices.push(colIndex);
        filteredColHeaders.push(header);
        filteredColTotals.push(pivotData.columnTotals[colIndex]);
      });
    }

    // Create row data with original indices (only if we have row fields)
    if (rowFields.length > 0) {
      // Filter out rows with all zeros
      const filteredRows: { row: PivotCell<T>[]; rowIndex: number; rowHeader: string[]; rowTotal: AggregatedValues }[] = [];

      pivotData.cells.forEach((row, rowIndex) => {
        const rowTotal = pivotData.rowTotals[rowIndex];
        // Filter cells to only include valid columns
        const filteredRowCells = validColIndices.map(colIdx => row[colIdx]);

        if (!isRowAllZeros(filteredRowCells, rowTotal)) {
          filteredRows.push({
            row: filteredRowCells,
            rowIndex,
            rowHeader: pivotData.rowHeaders[rowIndex],
            rowTotal
          });
        }
      });

      // Create table rows from filtered data
      filteredRows.forEach(({ row, rowIndex, rowHeader, rowTotal }) => {
        const tableRow: TableRow<T> = {
          rowHeaders: rowHeader,
          cells: row,
          rowTotal: rowTotal,
          originalIndex: rowIndex,
        };
        rows.push(tableRow);
      });

      // Update sorted headers to match filtered rows
      sortedHeaders = rows.map(r => r.rowHeaders);
    }
    // Note: When no row fields exist, we'll only show the totals row (added below)

    // Sort rows if needed - sorting by totals when field is 'totals'
    if (rowSortState && rowSortState.order !== 'original' && rows.length > 0) {
      const sortedRows = [...rows];

      if (rowSortState.field === 'totals') {
        // Sort by row totals
        sortedRows.sort((a, b) => {
          // Get the first numeric value from the totals for comparison
          const getNumericTotal = (total: AggregatedValues): number => {
            const values = Object.values(total);
            for (const val of values) {
              if (typeof val === 'number') return val;
            }
            return 0;
          };

          const aTotal = getNumericTotal(a.rowTotal);
          const bTotal = getNumericTotal(b.rowTotal);

          const comparison = aTotal - bTotal;
          return rowSortState.order === 'asc' ? comparison : -comparison;
        });
      } else {
        // Original sorting by headers (fallback)
        sortedRows.sort((a, b) => {
          for (let i = 0; i < a.rowHeaders.length; i++) {
            const aVal = a.rowHeaders[i] || '';
            const bVal = b.rowHeaders[i] || '';

            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);

            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
              comparison = aNum - bNum;
            } else {
              comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
            }

            if (comparison !== 0) {
              return rowSortState.order === 'asc' ? comparison : -comparison;
            }
          }
          return 0;
        });
      }

      // Create sorted headers array that matches the sorted rows
      sortedHeaders = sortedRows.map(row => row.rowHeaders);

      // Replace rows with sorted version
      rows.length = 0;
      rows.push(...sortedRows);
    }

    // Add totals row (always at the end) - Only add if grand total is not all zeros
    if (pivotData.rowTotals.length > 0 || (rowFields.length === 0 && columnFields.length > 0)) {
      const hasNonZeroTotal = Object.values(pivotData.grandTotal).some(val => val !== 0) ||
        (columnFields.length > 0 && filteredColTotals.some(total =>
          Object.values(total).some(val => val !== 0)
        ));

      if (hasNonZeroTotal) {
        const totalsRow: TableRow<T> = {
          rowHeaders: rowFields.length > 0
            ? rowFields.map((_, index) => index === 0 ? 'Totals' : '')
            : ['Totals'], // When no row fields, still show "Totals" in first cell
          cells: columnFields.length > 0 ? filteredColTotals.map(total => ({
            value: total,
            rowKeys: [],
            columnKeys: [],
            data: [] as DataItem<T>[]
          })) : [],
          rowTotal: pivotData.grandTotal,
          isTotalsRow: true,
        };
        rows.push(totalsRow);
      }
    }

    return {
      data: rows,
      sortedRowHeaders: sortedHeaders,
      validColumnIndices: validColIndices,
      filteredColumnHeaders: filteredColHeaders,
      filteredColumnTotals: filteredColTotals
    };
  }, [pivotData, rowFields, rowSortState, columnFields.length]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TableRow<T>>();
    const cols: PivotColumnDef<T>[] = [];

    // Use filtered column indices
    let columnIndices = validColumnIndices.map((_, i) => i);

    if (columnSortState && columnSortState.order !== 'original' && filteredColumnHeaders.length > 0) {
      if (columnSortState.field === 'totals') {
        // Sort by column totals
        columnIndices = [...columnIndices].sort((a, b) => {
          // Get the first numeric value from the totals for comparison
          const getNumericTotal = (total: AggregatedValues): number => {
            const values = Object.values(total);
            for (const val of values) {
              if (typeof val === 'number') return val;
            }
            return 0;
          };

          const aTotal = getNumericTotal(filteredColumnTotals[a]);
          const bTotal = getNumericTotal(filteredColumnTotals[b]);

          const comparison = aTotal - bTotal;
          return columnSortState.order === 'asc' ? comparison : -comparison;
        });
      } else {
        // Original sorting by headers (fallback)
        columnIndices = [...columnIndices].sort((a, b) => {
          const aHeaders = filteredColumnHeaders[a];
          const bHeaders = filteredColumnHeaders[b];

          // Compare column headers hierarchically
          for (let i = 0; i < Math.min(aHeaders.length, bHeaders.length); i++) {
            const aVal = aHeaders[i] || '';
            const bVal = bHeaders[i] || '';

            // Try numeric comparison first
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);

            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
              comparison = aNum - bNum;
            } else {
              comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
            }

            if (comparison !== 0) {
              return columnSortState.order === 'asc' ? comparison : -comparison;
            }
          }
          return 0;
        });
      }
    }

    // Add row header columns
    if (rowFields.length > 0) {
      rowFields.forEach((field, index) => {
        cols.push(
          columnHelper.accessor(
            (row) => row.rowHeaders?.[index] || '',
            {
              id: `row-${field}`,
              header: field as string,
              cell: ({ row, getValue }) => {
                const rowData = row.original;
                const rowIndex = row.index;
                const isLastRow = rowIndex === data.length - 1;
                const isTotalsRow = rowData.isTotalsRow;

                // For totals row, only show content in first column
                if (isTotalsRow && index > 0) {
                  return null;
                }

                const shouldShow = isTotalsRow || shouldShowRowHeader(
                  sortedRowHeaders,
                  rowIndex,
                  index,
                  isLastRow
                );

                if (!shouldShow) {
                  return null;
                }

                const rowspan = isTotalsRow ? 1 : calculateRowSpan(
                  sortedRowHeaders,
                  rowIndex,
                  index,
                  isLastRow
                );

                return (
                  <div
                    className={`font-medium text-xs ${isTotalsRow ? 'text-right pr-2' : ''}`}
                    style={{
                      gridRow: rowspan > 1 ? `span ${rowspan}` : undefined,
                    }}
                    data-rowspan={rowspan}
                  >
                    {getValue() as string}
                  </div>
                );
              },
              meta: {
                isRowHeader: true,
                fieldIndex: index,
              } as CustomColumnMeta,
            }
          )
        );
      });
    } else if (columnFields.length > 0) {
      // When no row fields but we have column fields, add a single column for "Totals" label
      cols.push(
        columnHelper.accessor(
          (row) => row.rowHeaders?.[0] || '',
          {
            id: 'totals-label',
            header: '',
            cell: ({ getValue }) => (
              <div className="font-medium text-xs text-left">
                {getValue() as string}
              </div>
            ),
            meta: {
              isRowHeader: true,
              fieldIndex: 0,
            } as CustomColumnMeta,
          }
        )
      );
    }

    // Add empty column for alignment (only when we have column fields and row fields)
    if (columnFields.length > 0 && rowFields.length > 0) {
      cols.push(
        columnHelper.accessor(
          () => '',
          {
            id: 'empty-spacer',
            header: '',
            cell: () => <div />,
          }
        )
      );
    }

    // Build nested column structure for data columns
    if (columnFields.length > 0 && filteredColumnHeaders.length > 0) {
      // Group columns by their hierarchical structure
      const columnGroups = buildColumnGroups(
        filteredColumnHeaders,
        columnFields,
        columnHelper,
        valueFields,
        columnIndices
      );
      cols.push(...columnGroups);
    }

    // Add totals column if there are row totals
    if (pivotData.rowTotals.length > 0) {
      cols.push(
        columnHelper.accessor(
          (row) => {
            const total = row.rowTotal;
            if (!total) return '';

            if (Object.keys(total).length === 1) {
              return formatAggregatedValue(Object.values(total)[0]);
            }

            return Object.entries(total)
              .map(([key, val]) => `${key}: ${formatAggregatedValue(val)}`)
              .join('\n');
          },
          {
            id: 'totals',
            header: 'Totals',
            cell: (info) => (
              <div className="text-xs text-right font-semibold whitespace-pre-line">
                {info.getValue() as string}
              </div>
            ),
          }
        )
      );
    }

    return cols;
  }, [pivotData, rowFields, columnFields, valueFields, columnSortState, sortedRowHeaders, validColumnIndices, filteredColumnHeaders, filteredColumnTotals, data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data to display. Drag fields to Rows, Columns, or Values to create a pivot table.
      </div>
    );
  }

  // Build hierarchical header structure
  const buildHeaderRows = () => {
    const headerRows: JSX.Element[] = [];
    const numColumnLevels = columnFields.length || 0;
    const numRowFields = rowFields.length || 0;

    // Get sorted column indices for headers (use filtered columns)
    let sortedColumnIndices = filteredColumnHeaders.map((_, i) => i);
    if (columnSortState && columnSortState.order !== 'original' && filteredColumnHeaders.length > 0) {
      if (columnSortState.field === 'totals') {
        // Sort by column totals
        sortedColumnIndices = [...sortedColumnIndices].sort((a, b) => {
          // Get the first numeric value from the totals for comparison
          const getNumericTotal = (total: AggregatedValues): number => {
            const values = Object.values(total);
            for (const val of values) {
              if (typeof val === 'number') return val;
            }
            return 0;
          };

          const aTotal = getNumericTotal(filteredColumnTotals[a]);
          const bTotal = getNumericTotal(filteredColumnTotals[b]);

          const comparison = aTotal - bTotal;
          return columnSortState.order === 'asc' ? comparison : -comparison;
        });
      } else {
        // Original sorting by headers (fallback)
        sortedColumnIndices = [...sortedColumnIndices].sort((a, b) => {
          const aHeaders = filteredColumnHeaders[a];
          const bHeaders = filteredColumnHeaders[b];

          for (let i = 0; i < Math.min(aHeaders.length, bHeaders.length); i++) {
            const aVal = aHeaders[i] || '';
            const bVal = bHeaders[i] || '';

            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);

            let comparison = 0;
            if (!isNaN(aNum) && !isNaN(bNum)) {
              comparison = aNum - bNum;
            } else {
              comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
            }

            if (comparison !== 0) {
              return columnSortState.order === 'asc' ? comparison : -comparison;
            }
          }
          return 0;
        });
      }
    }

    // When we have no column fields, we need only 1 row
    // When we have exactly one column field, we need 2 rows total
    // Otherwise, number of column fields + 1 (for row field labels)
    const totalHeaderRows = numColumnLevels === 0 ? 1 : (numColumnLevels === 1 ? 2 : (numColumnLevels + 1));

    for (let row = 0; row < totalHeaderRows; row++) {
      const cells: JSX.Element[] = [];

      if (row === 0) {
        // First row
        if (numColumnLevels === 1 && numRowFields > 0) {
          // Special case: exactly one column field
          // Empty corner cell spanning all row fields columns but only 1 row
          cells.push(
            <th
              key="empty-corner"
              colSpan={numRowFields}
              rowSpan={1}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
            />
          );

          // Column field label
          cells.push(
            <th
              key={`col-field-0`}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
            >
              {columnFields[0]}
            </th>
          );

          // Column values with rowspan=2 to merge with next row
          sortedColumnIndices.forEach((colIndex) => {
            const colHeader = filteredColumnHeaders[colIndex];
            cells.push(
              <th
                key={`col-val-${colIndex}`}
                colSpan={1}
                rowSpan={2}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
              >
                {colHeader[0]}
              </th>
            );
          });
        } else if (numColumnLevels > 1 && numRowFields > 0) {
          // Multiple column fields
          // Empty corner cell spanning all row fields columns and all column field rows
          cells.push(
            <th
              key="empty-corner"
              colSpan={numRowFields}
              rowSpan={numColumnLevels}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800"
            />
          );

          // First column field label (e.g., "Session")
          cells.push(
            <th
              key={`col-field-0`}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
            >
              {columnFields[0]}
            </th>
          );

          // Column values for first level
          const processedCombos = new Set<string>();
          sortedColumnIndices.forEach((colIndex) => {
            const colHeader = filteredColumnHeaders[colIndex];
            const value = colHeader[0];
            if (!processedCombos.has(value)) {
              processedCombos.add(value);

              // Count columns with this value in sorted order
              let span = 0;
              sortedColumnIndices.forEach(idx => {
                const h = filteredColumnHeaders[idx];
                if (h[0] === value) span++;
              });

              cells.push(
                <th
                  key={`col-val-0-${colIndex}`}
                  colSpan={span}
                  className="px-3 py-2 text-xs font-semibold border-b border-r
                           border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
                >
                  {value}
                </th>
              );
            }
          });
        } else if (numRowFields > 0) {
          // No column fields, just row fields - only show one header row
          rowFields.forEach((field, idx) => {
            cells.push(
              <th
                key={`row-field-${idx}`}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-left"
              >
                {field}
              </th>
            );
          });

          // When no column fields, don't add numbered data columns - only totals will be shown
        } else if (numColumnLevels === 1 && numRowFields === 0) {
          // Single column field, no row fields
          // First column field label with rowspan to merge with empty row below
          cells.push(
            <th
              key={`col-field-0`}
              rowSpan={2}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
            >
              {columnFields[0]}
            </th>
          );

          // Column values with rowspan=2 to merge with next row
          sortedColumnIndices.forEach((colIndex) => {
            const colHeader = filteredColumnHeaders[colIndex];
            cells.push(
              <th
                key={`col-val-${colIndex}`}
                colSpan={1}
                rowSpan={2}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
              >
                {colHeader[0]}
              </th>
            );
          });
        } else if (numColumnLevels > 1 && numRowFields === 0) {
          // Multiple column fields, no row fields
          // First column field label
          cells.push(
            <th
              key={`col-field-0`}
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
            >
              {columnFields[0]}
            </th>
          );

          // Column values for first level
          const processedCombos = new Set<string>();
          sortedColumnIndices.forEach((colIndex) => {
            const colHeader = filteredColumnHeaders[colIndex];
            const value = colHeader[0];
            if (!processedCombos.has(value)) {
              processedCombos.add(value);

              // Count columns with this value in sorted order
              let span = 0;
              sortedColumnIndices.forEach(idx => {
                const h = filteredColumnHeaders[idx];
                if (h[0] === value) span++;
              });

              cells.push(
                <th
                  key={`col-val-0-${colIndex}`}
                  colSpan={span}
                  className="px-3 py-2 text-xs font-semibold border-b border-r
                           border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
                >
                  {value}
                </th>
              );
            }
          });
        }
      } else if (row === 1 && numColumnLevels === 1) {
        // Second row when we have exactly one column field
        if (numRowFields > 0) {
          // Row field labels when we have row fields
          rowFields.forEach((field, idx) => {
            cells.push(
              <th
                key={`row-field-${idx}`}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-left"
              >
                {field}
              </th>
            );
          });

          // Empty cell for alignment (only when we have column fields)
          if (columnFields.length > 0) {
            cells.push(
              <th
                key="empty-alignment"
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
              />
            );
          }
        } else {
          // No row fields - show the second column field level if multiple columns
          if (columnFields.length > 1) {
            cells.push(
              <th
                key={`col-field-1`}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
              >
                {columnFields[1]}
              </th>
            );
          }
          // Note: When only one column field exists, the cell above already has rowspan=2 so we don't add anything
        }

        // Note: Column value cells are already added with rowspan=2 from row 0
      } else if (row < numColumnLevels) {
        // Middle rows for additional column fields (when numColumnLevels > 1)
        // Column field label (e.g., "Status")
        // If no row fields and this is the last column field, add rowspan to merge with empty row below
        const needsRowSpan = numRowFields === 0 && row === numColumnLevels - 1;
        cells.push(
          <th
            key={`col-field-${row}`}
            rowSpan={needsRowSpan ? 2 : 1}
            className="px-3 py-2 text-xs font-semibold border-b border-r
                     border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
          >
            {columnFields[row]}
          </th>
        );

        // Column values for this level
        const processedCombos = new Set<string>();
        sortedColumnIndices.forEach((colIndex) => {
          const colHeader = filteredColumnHeaders[colIndex];
          const comboKey = colHeader.slice(0, row + 1).join('|');

          if (!processedCombos.has(comboKey)) {
            processedCombos.add(comboKey);

            // Count columns with this combination in sorted order
            let span = 0;
            sortedColumnIndices.forEach(idx => {
              const h = filteredColumnHeaders[idx];
              if (h.slice(0, row + 1).join('|') === comboKey) span++;
            });

            // For last level, might need rowspan
            const rowSpan = row === numColumnLevels - 1 ? 2 : 1;

            cells.push(
              <th
                key={`col-val-${row}-${colIndex}`}
                colSpan={span}
                rowSpan={rowSpan}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
              >
                {colHeader[row]}
              </th>
            );
          }
        });
      } else {
        // Last row - row field labels (for multiple column fields case)
        if (numRowFields > 0) {
          rowFields.forEach((field, idx) => {
            cells.push(
              <th
                key={`row-field-${idx}`}
                className="px-3 py-2 text-xs font-semibold border-b border-r
                         border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-left"
              >
                {field}
              </th>
            );
          });
        }
        // Note: When no row fields exist, the cell above already has rowspan=2 so we don't add anything here

        // Empty cell if we have column fields (alignment) - only when we have row fields
        if (numColumnLevels > 0 && numRowFields > 0) {
          cells.push(
            <th
              key="empty-alignment"
              className="px-3 py-2 text-xs font-semibold border-b border-r
                       border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
            />
          );
        }
      }

      // Add totals header (only in first row, spanning all rows)
      if (row === 0 && pivotData.rowTotals.length > 0) {
        cells.push(
          <th
            key="totals-header"
            rowSpan={totalHeaderRows}
            className="px-3 py-2 text-xs font-semibold border-b border-r
                     border-gray-300 dark:border-gray-600 text-center bg-gray-100 dark:bg-gray-700"
          >
            Totals
          </th>
        );
      }

      headerRows.push(
        <tr key={`header-row-${row}`} className="bg-gray-100 dark:bg-gray-700">
          {cells}
        </tr>
      );
    }

    return headerRows;
  };

  return (
    <div className="w-full h-[600px] overflow-auto border border-gray-300 dark:border-gray-600 rounded-lg">
      <table className="w-full">
        <thead>
          {buildHeaderRows()}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => {
            const rowData = row.original;
            const isLastRow = rowIndex === table.getRowModel().rows.length - 1;
            const isTotalsRow = rowData.isTotalsRow;
            const cellsToRender: { [key: string]: boolean } = {};

            // Calculate which cells to render (for rowspan merging)
            row.getVisibleCells().forEach(cell => {
              const fieldIndex = (cell.column.columnDef.meta as CustomColumnMeta)?.fieldIndex;
              if (isTotalsRow && fieldIndex !== undefined) {
                // For totals row, only render the first row header cell
                cellsToRender[cell.id] = fieldIndex === 0;
              } else if (fieldIndex !== undefined) {
                cellsToRender[cell.id] = shouldShowRowHeader(
                  sortedRowHeaders,
                  rowIndex,
                  fieldIndex,
                  isLastRow
                );
              } else {
                cellsToRender[cell.id] = true;
              }
            });

            return (
              <tr
                key={row.id}
                className={`
                  ${isLastRow ? 'font-semibold' : ''}
                  hover:bg-gray-50 dark:hover:bg-gray-800
                `}
              >
                {row.getVisibleCells().map(cell => {
                  if (!cellsToRender[cell.id]) {
                    return null;
                  }

                  // Skip the empty spacer column if it should be merged (only relevant when column fields exist)
                  if (cell.column.id === 'empty-spacer' && columnFields.length > 0) {
                    if (isTotalsRow) {
                      return null; // Skip for totals row as first cell will span
                    }
                    const lastRowFieldCell = row.getVisibleCells().find(c =>
                      (c.column.columnDef.meta as CustomColumnMeta)?.fieldIndex === rowFields.length - 1
                    );
                    if (lastRowFieldCell && cellsToRender[lastRowFieldCell.id]) {
                      return null; // Skip rendering the spacer since the last field will span into it
                    }
                  }

                  const fieldIndex = (cell.column.columnDef.meta as CustomColumnMeta)?.fieldIndex;
                  const rowspan = fieldIndex !== undefined && !isTotalsRow
                    ? calculateRowSpan(sortedRowHeaders, rowIndex, fieldIndex, isLastRow)
                    : 1;

                  // Calculate colspan for cells
                  let colSpan = 1;
                  if (isTotalsRow && fieldIndex === 0) {
                    // When no column fields, totals cell spans all row field columns but not the empty spacer
                    // When there are column fields, it spans all row field columns plus the empty spacer
                    colSpan = columnFields.length === 0 ? rowFields.length : rowFields.length + 1;
                  } else if ((cell.column.columnDef.meta as CustomColumnMeta)?.isRowHeader && fieldIndex === rowFields.length - 1 && !isTotalsRow) {
                    // Only span into empty spacer if there are column fields
                    colSpan = columnFields.length > 0 ? 2 : 1;
                  }

                  return (
                    <td
                      key={cell.id}
                      rowSpan={rowspan}
                      colSpan={colSpan}
                      className={`
                        px-3 py-2 text-xs border-b border-r
                        border-gray-300 dark:border-gray-600
                        ${isLastRow ? 'border-t-2' : ''}
                        ${(cell.column.columnDef.meta as CustomColumnMeta)?.isRowHeader ? 'font-medium bg-gray-100 dark:bg-gray-800' : ''}
                      `}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

// Helper function to build nested column groups
function buildColumnGroups<T extends Record<string, unknown> = Record<string, unknown>>(
  columnHeaders: string[][],
  columnFields: FieldKey<T>[],
  columnHelper: ReturnType<typeof createColumnHelper<TableRow<T>>>,
  valueFields: FieldKey<T>[],
  columnIndices?: number[]
): PivotColumnDef<T>[] {
  if (columnFields.length === 0 || columnHeaders.length === 0) {
    return [];
  }

  // For each column header, create a data column
  const columns: PivotColumnDef<T>[] = [];
  const indices = columnIndices || columnHeaders.map((_, i) => i);

  indices.forEach((colIndex) => {
    const colHeader = columnHeaders[colIndex];
    // If we have multiple value fields, create a column for each
    if (valueFields.length > 1) {
      valueFields.forEach((valueField, valueIndex) => {
        columns.push(
          columnHelper.accessor(
            (row) => {
              const cell = row.cells?.[colIndex];
              if (!cell || !cell.value[valueField as string]) return '';
              return formatAggregatedValue(cell.value[valueField as string]);
            },
            {
              id: `col-${colIndex}-value-${valueIndex}`,
              header: valueField as string,
              cell: (info) => (
                <div className="text-xs text-right">
                  {info.getValue() as string}
                </div>
              ),
            }
          )
        );
      });
    } else {
      // Single value field or default aggregation
      columns.push(
        columnHelper.accessor(
          (row) => {
            const cell = row.cells?.[colIndex];
            if (!cell) return '';

            if (Object.keys(cell.value).length === 1) {
              return formatAggregatedValue(Object.values(cell.value)[0]);
            }

            return Object.entries(cell.value)
              .map(([key, val]) => `${key}: ${formatAggregatedValue(val)}`)
              .join('\n');
          },
          {
            id: `col-${colIndex}`,
            header: colHeader[colHeader.length - 1],
            cell: (info) => (
              <div className="text-xs text-right whitespace-pre-line">
                {info.getValue() as string}
              </div>
            ),
          }
        )
      );
    }
  });

  return columns;
}

export class TableRenderer<T extends Record<string, unknown> = Record<string, unknown>>
  implements PivotRenderer<T> {

  readonly id = 'tanstack-table';
  readonly name = 'Table View';
  readonly type = 'table' as const;
  readonly description = 'Interactive table with sorting and hierarchical grouping';
  readonly isAvailable = true;
  readonly category = 'table' as const;

  render(props: BaseRendererProps<T>) {
    return (
      <PivotTableRenderer
        pivotData={props.pivotData}
        rowFields={props.rowFields}
        columnFields={props.columnFields}
        valueFields={props.valueFields}
        rowSortState={props.rowSortState as SortState<Record<string, unknown>> | undefined}
        columnSortState={props.columnSortState as SortState<Record<string, unknown>> | undefined}
      />
    );
  }
}

// Create a singleton instance
export const tableRenderer = new TableRenderer();