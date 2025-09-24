import { vi } from 'vitest';
import type { PivotFieldState, PivotConfig, DataItem } from '../../src/components/pivot/types';

// Mock setup utilities
export const setupMocks = () => {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock requestAnimationFrame
  global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
  global.cancelAnimationFrame = vi.fn();

  // Mock performance.now
  if (!global.performance) {
    global.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  }
};

// Cleanup utilities
export const cleanupMocks = () => {
  vi.restoreAllMocks();
};

// Wait for async operations
export const waitForAsync = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Wait for multiple animation frames
export const waitForAnimationFrames = (frames: number = 1) => {
  return new Promise(resolve => {
    let count = 0;
    const tick = () => {
      count++;
      if (count >= frames) {
        resolve(void 0);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
};

// Create mock field state
export const createMockFieldState = (
  overrides: Partial<PivotFieldState> = {}
): PivotFieldState => ({
  availableFields: ['region', 'product', 'sales', 'quantity', 'category'],
  rows: ['region'],
  columns: ['product'],
  values: ['sales'],
  ...overrides
});

// Create mock pivot config
export const createMockPivotConfig = <T extends Record<string, unknown>>(
  overrides: Partial<PivotConfig<T>> = {}
): PivotConfig<T> => ({
  rows: ['region'] as any,
  columns: ['product'] as any,
  values: [{ field: 'sales' as any, aggregation: 'sum' }],
  filters: [],
  ...overrides
});

// Create mock data item
export const createMockDataItem = (overrides: Partial<DataItem> = {}): DataItem => ({
  region: 'North',
  product: 'A',
  sales: 100,
  quantity: 10,
  category: 'Electronics',
  ...overrides
});

// Generate test data with specific characteristics
export const generateTestData = (
  count: number,
  options: {
    uniqueRegions?: number;
    uniqueProducts?: number;
    uniqueCategories?: number;
    salesRange?: [number, number];
    quantityRange?: [number, number];
  } = {}
): DataItem[] => {
  const {
    uniqueRegions = 4,
    uniqueProducts = 5,
    uniqueCategories = 3,
    salesRange = [50, 500],
    quantityRange = [1, 50]
  } = options;

  const regions = Array.from({ length: uniqueRegions }, (_, i) => `Region${i + 1}`);
  const products = Array.from({ length: uniqueProducts }, (_, i) => `Product${i + 1}`);
  const categories = Array.from({ length: uniqueCategories }, (_, i) => `Category${i + 1}`);

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    region: regions[i % uniqueRegions],
    product: products[i % uniqueProducts],
    category: categories[i % uniqueCategories],
    sales: Math.floor(Math.random() * (salesRange[1] - salesRange[0] + 1)) + salesRange[0],
    quantity: Math.floor(Math.random() * (quantityRange[1] - quantityRange[0] + 1)) + quantityRange[0],
    date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
  }));
};

// Performance measurement utilities
export const measurePerformance = async <T>(
  operation: () => T | Promise<T>,
  expectedMaxTime?: number
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  const duration = end - start;

  if (expectedMaxTime && duration > expectedMaxTime) {
    throw new Error(`Operation took ${duration}ms, expected max ${expectedMaxTime}ms`);
  }

  return { result, duration };
};

// Memory usage measurement (approximate)
export const measureMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
    return (window.performance as any).memory.usedJSHeapSize;
  }
  return null;
};


// Drag and drop testing utilities
export const simulateDragStart = (element: HTMLElement, dataTransfer?: Partial<DataTransfer>) => {
  const event = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: {
      dropEffect: 'none',
      effectAllowed: 'all',
      files: [] as any,
      items: [] as any,
      types: [],
      clearData: vi.fn(),
      getData: vi.fn(),
      setData: vi.fn(),
      setDragImage: vi.fn(),
      ...dataTransfer
    } as DataTransfer
  });

  element.dispatchEvent(event);
  return event;
};

export const simulateDragOver = (element: HTMLElement, dataTransfer?: Partial<DataTransfer>) => {
  const event = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: {
      dropEffect: 'none',
      effectAllowed: 'all',
      files: [] as any,
      items: [] as any,
      types: [],
      clearData: vi.fn(),
      getData: vi.fn(),
      setData: vi.fn(),
      setDragImage: vi.fn(),
      ...dataTransfer
    } as DataTransfer
  });

  element.dispatchEvent(event);
  return event;
};

export const simulateDrop = (element: HTMLElement, dataTransfer?: Partial<DataTransfer>) => {
  const event = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: {
      dropEffect: 'move',
      effectAllowed: 'all',
      files: [] as any,
      items: [] as any,
      types: ['text/plain'],
      clearData: vi.fn(),
      getData: vi.fn().mockReturnValue('test-data'),
      setData: vi.fn(),
      setDragImage: vi.fn(),
      ...dataTransfer
    } as DataTransfer
  });

  element.dispatchEvent(event);
  return event;
};

// Assertion utilities
export const expectToBeWithinRange = (actual: number, expected: number, tolerance: number = 0.01) => {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`Expected ${actual} to be within ${tolerance} of ${expected}, but difference was ${diff}`);
  }
};

export const expectArrayToContainAll = <T>(actual: T[], expected: T[]) => {
  expected.forEach(item => {
    if (!actual.includes(item)) {
      throw new Error(`Expected array to contain ${item}, but it was not found`);
    }
  });
};

export const expectObjectToHaveKeys = (obj: Record<string, any>, keys: string[]) => {
  keys.forEach(key => {
    if (!(key in obj)) {
      throw new Error(`Expected object to have key '${key}', but it was not found`);
    }
  });
};

// Data validation utilities
export const validateFieldState = (fieldState: PivotFieldState): boolean => {
  // Check that all fields in rows, columns, and values are in availableFields
  const allUsedFields = [...fieldState.rows, ...fieldState.columns, ...fieldState.values];
  return allUsedFields.every(field => fieldState.availableFields.includes(field));
};

export const validatePivotConfig = <T extends Record<string, unknown>>(config: PivotConfig<T>): boolean => {
  // Basic validation of pivot config structure
  return (
    Array.isArray(config.rows) &&
    Array.isArray(config.columns) &&
    Array.isArray(config.values) &&
    Array.isArray(config.filters) &&
    config.values.every(v => typeof v === 'object' && 'field' in v && 'aggregation' in v)
  );
};

export const validateDataConsistency = (data: DataItem[]): boolean => {
  if (data.length === 0) return true;

  // Check that all items have the same keys
  const firstItemKeys = Object.keys(data[0]).sort();
  return data.every(item => {
    const itemKeys = Object.keys(item).sort();
    return itemKeys.length === firstItemKeys.length &&
           itemKeys.every((key, index) => key === firstItemKeys[index]);
  });
};

// Test data generators for specific scenarios
export const generateTimeSeriesData = (days: number, startDate: string = '2023-01-01'): DataItem[] => {
  const start = new Date(startDate);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    return {
      date: date.toISOString().split('T')[0],
      sales: Math.floor(Math.random() * 1000) + 100,
      visits: Math.floor(Math.random() * 10000) + 1000,
      conversions: Math.floor(Math.random() * 100) + 10,
      day_of_week: date.toLocaleDateString('en-US', { weekday: 'long' }),
      month: date.toLocaleDateString('en-US', { month: 'long' })
    };
  });
};

export const generateHierarchicalData = (levels: number = 3, itemsPerLevel: number = 3): DataItem[] => {
  const data: DataItem[] = [];

  const generateLevel = (currentLevel: number, prefix: string, parentId: number = 0) => {
    for (let i = 0; i < itemsPerLevel; i++) {
      const id = parentId * itemsPerLevel + i + 1;
      const name = `${prefix}${i + 1}`;

      const item: DataItem = {
        id,
        level: currentLevel,
        name,
        parent_id: parentId,
        value: Math.random() * 1000,
        count: Math.floor(Math.random() * 100) + 1
      };

      // Add level-specific fields
      for (let level = 1; level <= levels; level++) {
        if (level <= currentLevel) {
          item[`level_${level}`] = level === currentLevel ? name :
            level === 1 ? name.split('_')[0] : `${name.split('_')[0]}_${level}`;
        }
      }

      data.push(item);

      if (currentLevel < levels) {
        generateLevel(currentLevel + 1, `${name}_`, id);
      }
    }
  };

  generateLevel(1, 'Level1_');
  return data;
};

// Error simulation utilities
export const simulateNetworkError = () => {
  return new Error('Network request failed');
};

export const simulateTimeoutError = (timeout: number = 5000) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeout);
  });
};

// Export all utilities
export default {
  setupMocks,
  cleanupMocks,
  waitForAsync,
  waitForAnimationFrames,
  createMockFieldState,
  createMockPivotConfig,
  createMockDataItem,
  generateTestData,
  measurePerformance,
  measureMemoryUsage,
  simulateDragStart,
  simulateDragOver,
  simulateDrop,
  expectToBeWithinRange,
  expectArrayToContainAll,
  expectObjectToHaveKeys,
  validateFieldState,
  validatePivotConfig,
  validateDataConsistency,
  generateTimeSeriesData,
  generateHierarchicalData,
  simulateNetworkError,
  simulateTimeoutError
};