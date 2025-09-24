import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach, expect } from 'vitest';
import { setupMocks, cleanupMocks } from './utils/test-helpers';

// Enhanced global test setup for comprehensive testing
beforeEach(() => {
  setupMocks();
});

afterEach(() => {
  cleanupMocks();
});

// Global test configuration
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive design tests
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

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn();

// Mock performance.now for consistent timing in tests
const mockNow = vi.fn(() => Date.now());
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: mockNow
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock getComputedStyle for CSS-related tests
global.getComputedStyle = vi.fn().mockImplementation(() => ({
  getPropertyValue: vi.fn(),
  display: 'block',
  height: '100px',
  width: '200px'
}));

// Mock HTMLElement methods that might be used in drag and drop
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 100,
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 200,
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 200,
    width: 200,
    height: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn()
  })),
});

// Mock console methods for cleaner test output (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress specific console errors/warnings that are expected in tests
  console.error = vi.fn((...args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress React warnings that are expected in tests
      if (message.includes('Warning: ReactDOM.render is no longer supported')) {
        return;
      }
      if (message.includes('Warning: componentWillReceiveProps')) {
        return;
      }
    }
    originalConsoleError(...args);
  });

  console.warn = vi.fn((...args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress warnings that are expected in tests
      if (message.includes('deprecated')) {
        return;
      }
    }
    originalConsoleWarn(...args);
  });
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Mock timers for consistent test behavior (commented out as it can interfere with React testing)
// vi.useFakeTimers();

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't fail tests on unhandled rejections, but log them
});

// Custom matchers for testing
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidPivotStructure(received: any) {
    const pass = (
      received &&
      typeof received === 'object' &&
      Array.isArray(received.rowHeaders) &&
      Array.isArray(received.columnHeaders) &&
      Array.isArray(received.cells) &&
      Array.isArray(received.rowTotals) &&
      Array.isArray(received.columnTotals) &&
      typeof received.grandTotal === 'object'
    );

    if (pass) {
      return {
        message: () => `expected object not to have valid pivot structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have valid pivot structure`,
        pass: false,
      };
    }
  },

  toHaveValidChartData(received: any) {
    const pass = (
      received &&
      typeof received === 'object' &&
      Array.isArray(received.data) &&
      Array.isArray(received.series) &&
      typeof received.categoryKey === 'string'
    );

    if (pass) {
      return {
        message: () => `expected object not to have valid chart data structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have valid chart data structure`,
        pass: false,
      };
    }
  }
});

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toHaveValidPivotStructure(): T;
    toHaveValidChartData(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): any;
    toHaveValidPivotStructure(): any;
    toHaveValidChartData(): any;
  }
}