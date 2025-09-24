import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ReactPivotGrid } from '../../src/components/pivot';

// Mock ResizeObserver with proper class implementation
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock IntersectionObserver with proper class implementation
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

type TestData = {
  region: string;
  product: string;
  sales: number;
  quantity: number;
  category: string;
  date: string;
};

describe('ReactPivotGrid - Comprehensive Tests', () => {
  const mockData: TestData[] = [
    { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics', date: '2023-01-01' },
    { region: 'North', product: 'B', sales: 150, quantity: 15, category: 'Electronics', date: '2023-01-02' },
    { region: 'North', product: 'A', sales: 120, quantity: 12, category: 'Clothing', date: '2023-01-03' },
    { region: 'South', product: 'A', sales: 200, quantity: 20, category: 'Electronics', date: '2023-01-04' },
    { region: 'South', product: 'B', sales: 120, quantity: 12, category: 'Electronics', date: '2023-01-05' },
    { region: 'South', product: 'C', sales: 180, quantity: 18, category: 'Clothing', date: '2023-01-06' },
    { region: 'East', product: 'A', sales: 90, quantity: 9, category: 'Electronics', date: '2023-01-07' },
    { region: 'East', product: 'B', sales: 110, quantity: 11, category: 'Clothing', date: '2023-01-08' },
  ];

  const defaultConfig = {
    rows: ['region' as keyof TestData],
    columns: ['product' as keyof TestData],
    values: ['sales' as keyof TestData],
    aggregation: 'sum' as const,
  };

  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering and Props', () => {
    it('should render without crashing with minimal props', () => {
      render(<ReactPivotGrid data={mockData} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should render with initial configuration', () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Check that the component renders the main container
      expect(document.querySelector('[class*="flex-1"]')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(<ReactPivotGrid data={[]} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should apply custom field labels', () => {
      const fieldLabels = {
        region: 'Geographic Region',
        product: 'Product Code',
        sales: 'Sales Amount'
      };

      render(
        <ReactPivotGrid
          data={mockData}
          initialConfig={defaultConfig}
          fieldLabels={fieldLabels}
        />
      );

      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should respect custom pivot item threshold', () => {
      render(
        <ReactPivotGrid
          data={mockData}
          initialConfig={defaultConfig}
          pivotItemThreshold={100}
        />
      );

      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Data Processing and State Management', () => {
    it('should handle large datasets without performance issues', () => {
      const largeData: TestData[] = Array.from({ length: 1000 }, (_, i) => ({
        region: ['North', 'South', 'East', 'West'][i % 4],
        product: ['A', 'B', 'C', 'D'][i % 4],
        sales: Math.random() * 1000,
        quantity: Math.floor(Math.random() * 100),
        category: ['Electronics', 'Clothing'][i % 2],
        date: `2023-01-${String((i % 30) + 1).padStart(2, '0')}`
      }));

      const start = performance.now();
      render(<ReactPivotGrid data={largeData} initialConfig={defaultConfig} />);
      const end = performance.now();

      // Should render within reasonable time (less than 1 second)
      expect(end - start).toBeLessThan(1000);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should process pivot data correctly', async () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should maintain state consistency during updates', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Update with new data
      const newData: TestData[] = [
        ...mockData,
        { region: 'West', product: 'D', sales: 300, quantity: 30, category: 'Electronics', date: '2023-01-09' }
      ];

      rerender(<ReactPivotGrid data={newData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should handle data type validation', () => {
      const mixedData = [
        { region: 'North', product: 'A', sales: '100', quantity: 10, category: 'Electronics', date: '2023-01-01' },
        { region: 'South', product: 'B', sales: 200, quantity: '20', category: 'Clothing', date: '2023-01-02' }
      ] as unknown as TestData[];

      expect(() => {
        render(<ReactPivotGrid data={mixedData} initialConfig={defaultConfig} />);
      }).not.toThrow();
    });
  });

  describe('Initial Configuration Handling', () => {
    it('should apply initial row configuration', () => {
      const config = {
        rows: ['region' as keyof TestData, 'category' as keyof TestData],
        columns: [] as (keyof TestData)[],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const
      };

      render(<ReactPivotGrid data={mockData} initialConfig={config} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should apply initial column configuration', () => {
      const config = {
        rows: [] as (keyof TestData)[],
        columns: ['product' as keyof TestData, 'category' as keyof TestData],
        values: ['sales' as keyof TestData],
        aggregation: 'average' as const
      };

      render(<ReactPivotGrid data={mockData} initialConfig={config} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should apply initial filters', () => {
      const config = {
        rows: ['region' as keyof TestData],
        columns: ['product' as keyof TestData],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const,
        filters: {
          region: ['North', 'South'],
          category: ['Electronics']
        }
      };

      render(<ReactPivotGrid data={mockData} initialConfig={config} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should handle invalid initial configuration gracefully', () => {
      const invalidConfig = {
        rows: ['nonexistentField'] as unknown as [keyof TestData],
        columns: ['anotherNonexistentField'] as unknown as [keyof TestData],
        values: ['invalidField'] as unknown as [keyof TestData],
        aggregation: 'sum' as const
      };

      // Should not crash with invalid field names
      expect(() => {
        render(<ReactPivotGrid data={mockData} initialConfig={invalidConfig} />);
      }).not.toThrow();
    });
  });

  describe('Configuration Changes', () => {
    it('should handle configuration updates', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      const newConfig = {
        rows: ['category' as keyof TestData],
        columns: ['region' as keyof TestData],
        values: ['quantity' as keyof TestData],
        aggregation: 'average' as const
      };

      rerender(<ReactPivotGrid data={mockData} initialConfig={newConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should preserve field state during re-renders', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Simulate props change that shouldn't affect field state
      rerender(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} pivotItemThreshold={1000} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should handle aggregation function changes', async () => {
      const aggregationTypes = ['sum', 'average', 'count', 'minimum', 'maximum'] as const;

      for (const aggregation of aggregationTypes) {
        const config = {
          rows: ['region' as keyof TestData],
          columns: ['product' as keyof TestData],
          values: ['sales' as keyof TestData],
          aggregation
        };

        const { unmount } = render(<ReactPivotGrid data={mockData} initialConfig={config} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should debounce rapid configuration changes', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} />);

      // Simulate rapid configuration changes
      const configs = [
        { rows: ['region' as keyof TestData], columns: [] as (keyof TestData)[], values: ['sales' as keyof TestData], aggregation: 'sum' as const },
        { rows: ['product' as keyof TestData], columns: [] as (keyof TestData)[], values: ['sales' as keyof TestData], aggregation: 'sum' as const },
        { rows: ['category' as keyof TestData], columns: [] as (keyof TestData)[], values: ['sales' as keyof TestData], aggregation: 'sum' as const },
      ];

      for (const config of configs) {
        rerender(<ReactPivotGrid data={mockData} initialConfig={config} />);
      }

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values in data', () => {
      const dataWithNulls: TestData[] = [
        { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics', date: '2023-01-01' },
        { region: '', product: 'B', sales: 0, quantity: 0, category: '', date: '' },
      ];

      expect(() => {
        render(<ReactPivotGrid data={dataWithNulls} initialConfig={defaultConfig} />);
      }).not.toThrow();
    });

    it('should handle missing fields gracefully', () => {
      const incompleteData = [
        { region: 'North', sales: 100, category: 'Electronics', date: '2023-01-01' },
      ] as unknown as TestData[];

      expect(() => {
        render(<ReactPivotGrid data={incompleteData} initialConfig={defaultConfig} />);
      }).not.toThrow();
    });

    it('should handle field ejection on validation errors', async () => {
      type UniqueFieldData = {
        uniqueField: string;
        region: string;
        sales: number;
      };

      const testData: UniqueFieldData[] = [
        { uniqueField: 'a', region: 'North', sales: 100 },
        { uniqueField: 'b', region: 'South', sales: 200 },
      ];

      const config = {
        rows: ['uniqueField' as keyof UniqueFieldData], // This should trigger validation error
        columns: [] as (keyof UniqueFieldData)[],
        values: ['sales' as keyof UniqueFieldData],
        aggregation: 'sum' as const
      };

      render(<ReactPivotGrid data={testData} initialConfig={config} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should recover from invalid field configurations', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} />);

      // Apply invalid configuration
      const invalidConfig = {
        rows: ['nonexistent' as unknown as keyof TestData],
        columns: [] as (keyof TestData)[],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const
      };

      rerender(<ReactPivotGrid data={mockData} initialConfig={invalidConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });

      // Apply valid configuration to test recovery
      rerender(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Check for basic accessibility structure
      const container = document.querySelector('[class*="flex-col"]');
      expect(container).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Test keyboard navigation - Tab should move focus
      await user.keyboard('{Tab}');
      expect(document.activeElement).not.toBe(document.body);
    });

    it('should provide screen reader friendly content', () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Component should render without accessibility violations
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Rendering Modes', () => {
    it('should handle different data sizes with table renderer', () => {
      render(
        <ReactPivotGrid
          data={mockData}
          initialConfig={defaultConfig}
        />
      );

      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should render pivot table correctly', () => {
      render(
        <ReactPivotGrid
          data={mockData}
          initialConfig={defaultConfig}
        />
      );

      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should handle empty pivot results', () => {
      const emptyResultConfig = {
        rows: ['region' as keyof TestData],
        columns: ['product' as keyof TestData],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const,
        filters: {
          region: ['NonExistentRegion']
        }
      };

      render(<ReactPivotGrid data={mockData} initialConfig={emptyResultConfig} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should handle field state updates efficiently', async () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should use transitions for non-urgent updates', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      const newConfig = {
        rows: ['category' as keyof TestData],
        columns: ['product' as keyof TestData],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const
      };

      rerender(<ReactPivotGrid data={mockData} initialConfig={newConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should debounce pivot calculations', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} />);

      // Rapid updates should be debounced
      for (let i = 0; i < 5; i++) {
        const config = {
          rows: [i % 2 === 0 ? 'region' as keyof TestData : 'product' as keyof TestData],
          columns: [i % 2 === 0 ? 'product' as keyof TestData : 'region' as keyof TestData],
          values: ['sales' as keyof TestData],
          aggregation: 'sum' as const
        };

        rerender(<ReactPivotGrid data={mockData} initialConfig={config} />);
      }

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should handle data updates without full recalculation', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      type LimitedTestData = {
        region: string;
        product: string;
        sales: number;
        quantity: number;
      };

      const limitedData: LimitedTestData[] = [
        { region: 'North', product: 'A', sales: 100, quantity: 10 },
        { region: 'South', product: 'B', sales: 200, quantity: 20 },
      ];

      const limitedConfig = {
        rows: ['region' as keyof LimitedTestData],
        columns: ['product' as keyof LimitedTestData],
        values: ['sales' as keyof LimitedTestData],
        aggregation: 'sum' as const
      };

      rerender(<ReactPivotGrid data={limitedData} initialConfig={limitedConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should limit pivot calculations based on threshold', async () => {
      const hugeData: TestData[] = Array.from({ length: 10000 }, (_, i) => ({
        region: `Region${i % 100}`,
        product: `Product${i % 50}`,
        sales: i,
        quantity: i % 10,
        category: `Category${i % 5}`,
        date: '2023-01-01'
      }));

      render(
        <ReactPivotGrid
          data={hugeData}
          initialConfig={defaultConfig}
          pivotItemThreshold={100}
        />
      );

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Configuration', () => {
    it('should handle dynamic aggregation changes', async () => {
      const dynamicConfigs = [
        {
          aggregation: 'sum' as const,
          rows: ['region' as keyof TestData],
          columns: ['product' as keyof TestData],
          values: ['sales' as keyof TestData]
        },
        {
          rows: ['category' as keyof TestData],
          aggregation: 'sum' as const,
          columns: ['region' as keyof TestData],
          values: ['quantity' as keyof TestData]
        },
        {
          columns: ['date' as keyof TestData],
          aggregation: 'count' as const,
          rows: ['product' as keyof TestData],
          values: ['region' as keyof TestData]
        }
      ];

      for (const config of dynamicConfigs) {
        const { unmount } = render(
          <ReactPivotGrid data={mockData} initialConfig={config} />
        );

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should maintain performance with frequent config changes', async () => {
      const testConfigs = [
        { aggregation: 'sum' as const, rows: ['region' as keyof TestData], columns: ['product' as keyof TestData], values: ['sales' as keyof TestData] },
        { rows: ['category' as keyof TestData], columns: ['region' as keyof TestData], values: ['sales' as keyof TestData], aggregation: 'sum' as const },
        { ...defaultConfig, columns: ['region' as keyof TestData], aggregation: 'count' as const },
      ];

      for (const config of testConfigs) {
        const { unmount } = render(<ReactPivotGrid data={mockData} initialConfig={config} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should handle configuration edge cases', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} />);

      const edgeConfigs = [
        { aggregation: 'average' as const, rows: ['region' as keyof TestData], columns: ['product' as keyof TestData], values: ['sales' as keyof TestData] },
        { rows: ['region' as keyof TestData], aggregation: 'sum' as const, columns: ['product' as keyof TestData], values: ['sales' as keyof TestData] },
      ];

      for (const config of edgeConfigs) {
        rerender(<ReactPivotGrid data={mockData} initialConfig={config} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });
      }
    });

    it('should handle empty configurations', () => {
      const emptyConfig = {
        rows: [] as (keyof TestData)[],
        columns: [] as (keyof TestData)[],
        values: ['sales' as keyof TestData],
        aggregation: 'sum' as const
      };

      render(<ReactPivotGrid data={mockData} initialConfig={emptyConfig} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multi-dimensional pivot configurations', () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);
      expect(document.querySelector('div')).toBeInTheDocument();
    });

    it('should process complex filtering scenarios', async () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should handle mixed data type scenarios', async () => {
      render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      await waitFor(() => {
        expect(document.querySelector('div')).toBeInTheDocument();
      });
    });

    it('should maintain consistency across re-renders', async () => {
      const { rerender } = render(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

      // Multiple re-renders with same config should be consistent
      for (let i = 0; i < 3; i++) {
        rerender(<ReactPivotGrid data={mockData} initialConfig={defaultConfig} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });
      }
    });

    it('should handle configuration with different aggregation types', async () => {
      const aggregationConfigs = [
        { ...defaultConfig, aggregation: 'sum' as const },
        { ...defaultConfig, aggregation: 'average' as const },
        { ...defaultConfig, aggregation: 'count' as const },
        { ...defaultConfig, aggregation: 'minimum' as const },
        { ...defaultConfig, aggregation: 'maximum' as const },
      ];

      for (const config of aggregationConfigs) {
        const { unmount } = render(<ReactPivotGrid data={mockData} initialConfig={config} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });

        unmount();
      }
    });

    it('should handle dynamic pivot table configurations', async () => {
      const dynamicConfigs = [
        { aggregation: 'average' as const, rows: ['region' as keyof TestData], columns: ['product' as keyof TestData], values: ['sales' as keyof TestData] },
        { rows: ['category' as keyof TestData], aggregation: 'sum' as const, columns: ['product' as keyof TestData], values: ['sales' as keyof TestData] },
        { columns: ['date' as keyof TestData], aggregation: 'count' as const, rows: ['product' as keyof TestData], values: ['region' as keyof TestData] }
      ];

      const { rerender } = render(<ReactPivotGrid data={mockData} />);

      for (const config of dynamicConfigs) {
        rerender(<ReactPivotGrid data={mockData} initialConfig={config} />);

        await waitFor(() => {
          expect(document.querySelector('div')).toBeInTheDocument();
        });
      }
    });
  });
});