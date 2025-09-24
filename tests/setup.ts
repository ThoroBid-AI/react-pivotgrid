import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver properly
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

// Mock IntersectionObserver properly
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.IntersectionObserver = IntersectionObserverMock as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = vi.fn();

// Mock performance.now for consistent timing
const mockNow = vi.fn(() => Date.now());
if (!global.performance) {
  global.performance = {} as any;
}
global.performance.now = mockNow;