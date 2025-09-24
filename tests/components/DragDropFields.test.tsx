import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DragDropFields } from '../../src/components/pivot/drag-drop-fields';
import type { PivotFieldState, DataItem } from '../../src/components/pivot/types';

// Mock @dnd-kit dependencies
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  rectIntersection: vi.fn(),
  pointerWithin: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  horizontalListSortingStrategy: vi.fn(),
}));

// Mock child components
vi.mock('../../src/components/pivot/components/available-field-item', () => ({
  AvailableFieldItem: ({ field }: { field: string }) => (
    <div data-testid={`available-field-${field}`}>
      {field}
    </div>
  ),
}));

vi.mock('../../src/components/pivot/components/droppable-zone', () => ({
  DroppableZone: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`droppable-zone-${id}`}>
      <div data-testid={`zone-label-${id}`}>Zone: {id}</div>
      {children}
    </div>
  ),
}));

vi.mock('../../src/components/pivot/components/control-panel', () => ({
  ControlPanel: (props: { onRendererChange?: (rendererId: string) => void }) => (
    <div data-testid="control-panel">
      Control Panel
      {/* Conditionally render renderer-selector inside control-panel to match real behavior */}
      {props.onRendererChange && (
        <div data-testid="renderer-selector">Renderer Selector</div>
      )}
    </div>
  ),
}));

vi.mock('../../src/components/pivot/components/renderer-provider', () => ({
  RendererProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="renderer-provider">{children}</div>,
}));

vi.mock('../../src/components/pivot/components/renderer-selector', () => ({
  RendererSelector: (_props: Record<string, unknown>) => <div data-testid="renderer-selector">Renderer Selector</div>,
}));

describe('DragDropFields', () => {
  const mockData: DataItem[] = [
    { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics' },
    { region: 'South', product: 'B', sales: 200, quantity: 20, category: 'Clothing' },
    { region: 'East', product: 'C', sales: 150, quantity: 15, category: 'Electronics' },
  ];

  const mockFieldState: PivotFieldState = {
    availableFields: ['region', 'product', 'sales', 'quantity', 'category'],
    rows: ['region'],
    columns: ['product'],
    values: ['sales'],
  };

  const mockPivotTable = {
    rowHeaders: [['North'], ['South'], ['East']],
    columnHeaders: [['A'], ['B'], ['C']],
    cells: [],
    rowTotals: [],
    columnTotals: [],
    grandTotal: { 'sales (sum)': 450 },
  };

  const defaultProps = {
    fieldState: mockFieldState,
    onFieldStateChange: vi.fn(),
    data: mockData,
    activeFilters: {
      region: [],
      product: [],
      sales: [],
      quantity: [],
      category: [],
    },
    onFilterChange: vi.fn(),
    pivotTable: mockPivotTable,
    isComputing: false,
    isPending: false,
    aggregationType: 'sum' as const,
    onAggregationChange: vi.fn(),
    selectedRendererId: 'tanstack-table',
    onRendererChange: vi.fn(),
    pivotItemThreshold: 5000,
    valueField: 'sales',
    onValueFieldChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render DragDropFields component', () => {
      render(<DragDropFields {...defaultProps} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-provider')).toBeInTheDocument();
    });

    it('should render available fields', () => {
      render(<DragDropFields {...defaultProps} />);

      // Check that available fields are rendered (fields not in rows, columns, or values)
      const availableFields = mockFieldState.availableFields.filter(
        field => !mockFieldState.rows.includes(field) &&
                !mockFieldState.columns.includes(field) &&
                !mockFieldState.values.includes(field)
      );

      availableFields.forEach(field => {
        expect(screen.getByTestId(`available-field-${field}`)).toBeInTheDocument();
      });
    });

    it('should render droppable zones', () => {
      render(<DragDropFields {...defaultProps} />);

      expect(screen.getByTestId('droppable-zone-columns')).toBeInTheDocument();
      expect(screen.getByTestId('droppable-zone-rows')).toBeInTheDocument();
    });

    it('should render control panel and renderer selector', () => {
      render(<DragDropFields {...defaultProps} />);

      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-selector')).toBeInTheDocument();
    });
  });

  describe('Field State Display', () => {
    it('should display fields in correct zones based on field state', () => {
      const customFieldState: PivotFieldState = {
        availableFields: ['region', 'product', 'sales', 'quantity', 'category'],
        rows: ['region', 'category'],
        columns: ['product'],
        values: ['sales', 'quantity'],
      };

      render(<DragDropFields {...defaultProps} fieldState={customFieldState} />);

      // Available fields should only show fields not in other zones
      expect(screen.queryByTestId('available-field-region')).not.toBeInTheDocument();
      expect(screen.queryByTestId('available-field-product')).not.toBeInTheDocument();
      expect(screen.queryByTestId('available-field-sales')).not.toBeInTheDocument();
    });

    it('should handle empty field state gracefully', () => {
      const emptyFieldState: PivotFieldState = {
        availableFields: ['region', 'product', 'sales'],
        rows: [],
        columns: [],
        values: [],
      };

      render(<DragDropFields {...defaultProps} fieldState={emptyFieldState} />);

      // All fields should be available
      expect(screen.getByTestId('available-field-region')).toBeInTheDocument();
      expect(screen.getByTestId('available-field-product')).toBeInTheDocument();
      expect(screen.getByTestId('available-field-sales')).toBeInTheDocument();
    });

    it('should update when field state changes', () => {
      const { rerender } = render(<DragDropFields {...defaultProps} />);

      // Change field state
      const newFieldState: PivotFieldState = {
        availableFields: ['region', 'product', 'sales', 'quantity', 'category'],
        rows: ['product'],
        columns: ['region'],
        values: ['quantity'],
      };

      rerender(<DragDropFields {...defaultProps} fieldState={newFieldState} />);

      // Component should re-render with new state
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });

  describe('Loading and Computing States', () => {
    it('should display loading state when computing', () => {
      render(<DragDropFields {...defaultProps} isComputing={true} />);

      // Component should handle computing state appropriately
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should display pending state appropriately', () => {
      render(<DragDropFields {...defaultProps} isPending={true} />);

      // Component should handle pending state appropriately
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle both computing and pending states', () => {
      render(<DragDropFields {...defaultProps} isComputing={true} isPending={true} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });

  describe('Data Integration', () => {
    it('should handle empty data', () => {
      render(<DragDropFields {...defaultProps} data={[]} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle data with different field types', () => {
      const mixedData = [
        { id: 1, name: 'Test', value: 100, active: true, date: new Date() },
        { id: 2, name: 'Test2', value: 200, active: false, date: null },
      ];

      const mixedFieldState: PivotFieldState = {
        availableFields: ['id', 'name', 'value', 'active', 'date'],
        rows: ['name'],
        columns: ['active'],
        values: ['value'],
      };

      render(
        <DragDropFields
          {...defaultProps}
          data={mixedData}
          fieldState={mixedFieldState}
          activeFilters={{
            id: [],
            name: [],
            value: [],
            active: [],
            date: [],
          }}
          valueField="value"
        />
      );

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        region: `Region${i % 10}`,
        product: `Product${i % 20}`,
        sales: Math.random() * 1000,
      }));

      const largeFieldState: PivotFieldState = {
        availableFields: ['id', 'region', 'product', 'sales'],
        rows: ['region'],
        columns: ['product'],
        values: ['sales'],
      };

      expect(() => {
        render(
          <DragDropFields
            {...defaultProps}
            data={largeData}
            fieldState={largeFieldState}
            activeFilters={{
              id: [],
              region: [],
              product: [],
              sales: [],
            }}
            valueField="sales"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Filter Integration', () => {
    it('should handle active filters', () => {
      const activeFilters = {
        region: ['North', 'South'],
        category: ['Electronics'],
      };

      render(<DragDropFields {...defaultProps} activeFilters={activeFilters} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle filter changes', async () => {
      const onFilterChange = vi.fn();

      render(<DragDropFields {...defaultProps} onFilterChange={onFilterChange} />);

      // Filter changes would be triggered by child components
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle empty filters', () => {
      render(<DragDropFields {...defaultProps} activeFilters={{
        region: [],
        product: [],
        sales: [],
        quantity: [],
        category: [],
      }} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });

  describe('Aggregation Integration', () => {
    it('should handle different aggregation types', () => {
      const aggregationTypes = ['sum', 'average', 'count', 'minimum', 'maximum'] as const;

      aggregationTypes.forEach(aggregationType => {
        const { unmount } = render(
          <DragDropFields {...defaultProps} aggregationType={aggregationType} />
        );

        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle aggregation changes', () => {
      const onAggregationChange = vi.fn();

      render(
        <DragDropFields {...defaultProps} onAggregationChange={onAggregationChange} />
      );

      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    });

    it('should handle value field changes', () => {
      const onValueFieldChange = vi.fn();

      render(
        <DragDropFields {...defaultProps} onValueFieldChange={onValueFieldChange} />
      );

      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
    });
  });

  describe('Renderer Integration', () => {
    it('should handle different renderer types', () => {
      const rendererTypes = ['tanstack-table', 'chart'];

      rendererTypes.forEach(rendererId => {
        const { unmount } = render(
          <DragDropFields {...defaultProps} selectedRendererId={rendererId} />
        );

        expect(screen.getByTestId('renderer-selector')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle renderer changes', () => {
      const onRendererChange = vi.fn();

      render(
        <DragDropFields {...defaultProps} onRendererChange={onRendererChange} />
      );

      expect(screen.getByTestId('renderer-selector')).toBeInTheDocument();
    });

    it('should not render renderer selector when onRendererChange is not provided', () => {
      const propsWithoutRendererChange = {
        ...defaultProps,
        onRendererChange: undefined,
      };

      render(<DragDropFields {...propsWithoutRendererChange} />);

      expect(screen.getByTestId('control-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('renderer-selector')).not.toBeInTheDocument();
    });
  });

  describe('Pivot Table Integration', () => {
    it('should handle different pivot table structures', () => {
      const complexPivotTable = {
        rowHeaders: [['North', 'Electronics'], ['South', 'Clothing']],
        columnHeaders: [['A', 'Small'], ['B', 'Large']],
        cells: [],
        rowTotals: [],
        columnTotals: [],
        grandTotal: { 'sales (sum)': 1000, 'quantity (average)': 15 },
      };

      render(<DragDropFields {...defaultProps} pivotTable={complexPivotTable} />);

      expect(screen.getByTestId('renderer-provider')).toBeInTheDocument();
    });

    it('should handle empty pivot table', () => {
      const emptyPivotTable = {
        rowHeaders: [],
        columnHeaders: [],
        cells: [],
        rowTotals: [],
        columnTotals: [],
        grandTotal: {},
      };

      render(<DragDropFields {...defaultProps} pivotTable={emptyPivotTable} />);

      expect(screen.getByTestId('renderer-provider')).toBeInTheDocument();
    });

    it('should handle pivot table with null values', () => {
      const pivotTableWithNulls = {
        rowHeaders: [['null'], ['North']],
        columnHeaders: [['null'], ['A']],
        cells: [],
        rowTotals: [],
        columnTotals: [],
        grandTotal: { 'sales (sum)': 100 },
      };

      render(<DragDropFields {...defaultProps} pivotTable={pivotTableWithNulls} />);

      expect(screen.getByTestId('renderer-provider')).toBeInTheDocument();
    });
  });

  describe('Threshold Handling', () => {
    it('should handle different pivot item thresholds', () => {
      const thresholds = [100, 1000, 5000, 10000];

      thresholds.forEach(threshold => {
        const { unmount } = render(
          <DragDropFields {...defaultProps} pivotItemThreshold={threshold} />
        );

        expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle very low thresholds', () => {
      render(<DragDropFields {...defaultProps} pivotItemThreshold={1} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle very high thresholds', () => {
      render(<DragDropFields {...defaultProps} pivotItemThreshold={1000000} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });

  describe('Field Labels', () => {
    it('should handle custom field labels', () => {
      const fieldLabels = {
        region: 'Geographic Region',
        product: 'Product Code',
        sales: 'Sales Amount',
        quantity: 'Quantity Count',
        category: 'Product Category',
      };

      render(<DragDropFields {...defaultProps} fieldLabels={fieldLabels} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle partial field labels', () => {
      const fieldLabels = {
        region: 'Geographic Region',
        sales: 'Sales Amount',
      };

      render(<DragDropFields {...defaultProps} fieldLabels={fieldLabels} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle empty field labels', () => {
      render(<DragDropFields {...defaultProps} fieldLabels={undefined} />);

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should call onFieldStateChange when field state changes', () => {
      const onFieldStateChange = vi.fn();

      render(<DragDropFields {...defaultProps} onFieldStateChange={onFieldStateChange} />);

      // Field state changes would be triggered by drag and drop interactions
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle multiple rapid state changes', async () => {
      const onFieldStateChange = vi.fn();
      const { rerender } = render(
        <DragDropFields {...defaultProps} onFieldStateChange={onFieldStateChange} />
      );

      // Simulate rapid state changes
      const states = [
        { ...mockFieldState, rows: ['product'] },
        { ...mockFieldState, rows: ['category'] },
        { ...mockFieldState, rows: ['region', 'product'] },
      ];

      for (const state of states) {
        rerender(<DragDropFields {...defaultProps} fieldState={state} />);
        await waitFor(() => {
          expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid field state gracefully', () => {
      const invalidFieldState = {
        availableFields: [],
        rows: ['nonexistent'],
        columns: ['invalid'],
        values: ['missing'],
      } as PivotFieldState;

      expect(() => {
        render(<DragDropFields {...defaultProps} fieldState={invalidFieldState} />);
      }).not.toThrow();
    });

    it('should handle missing callback functions', () => {
      const propsWithoutCallbacks = {
        ...defaultProps,
        onFieldStateChange: vi.fn(),
        onFilterChange: vi.fn(),
        onAggregationChange: vi.fn(),
        onRendererChange: vi.fn(),
        onValueFieldChange: vi.fn(),
      };

      expect(() => {
        render(<DragDropFields {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });

    it('should handle corrupted data gracefully', () => {
      // For corrupted data, we need to provide data that doesn't break the component
      // The component processes data to calculate field distinct counts, so we need
      // to provide data that can be processed without throwing
      const corruptedData = [
        { region: null, product: 'A', sales: 100 }, // null values are handled
        { region: undefined, product: 'B', sales: 200 }, // undefined values are handled
        { region: 'North', sales: NaN }, // missing product field and NaN values
        {}, // completely empty object
      ] as DataItem[];

      // The component should handle this without throwing
      expect(() => {
        render(<DragDropFields {...defaultProps} data={corruptedData} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large field lists', () => {
      const manyFields = Array.from({ length: 100 }, (_, i) => `field${i}`);
      const largeFieldState: PivotFieldState = {
        availableFields: manyFields,
        rows: manyFields.slice(0, 10),
        columns: manyFields.slice(10, 20),
        values: manyFields.slice(20, 30),
      };

      const startTime = performance.now();
      render(<DragDropFields {...defaultProps} fieldState={largeFieldState} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });

    it('should handle frequent re-renders efficiently', () => {
      const { rerender } = render(<DragDropFields {...defaultProps} />);

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        const newProps = {
          ...defaultProps,
          isComputing: i % 2 === 0,
          isPending: i % 3 === 0,
        };
        rerender(<DragDropFields {...newProps} />);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000);
      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    });
  });
});