// Import styles
import './index.css';

// Main pivot component exports
export { ReactPivotGrid } from './components/pivot';
export { MobilePivot } from './components/pivot/mobile-pivot';
export { DragDropFields } from './components/pivot/drag-drop-fields';

// Types exports
export type {
  PivotFieldState,
  PivotConfig,
  DataItem,
  FieldKey,
} from './components/pivot/types';

export type {
  PivotRenderer,
  RendererRegistry,
  RendererType,
  RendererCategory,
} from './components/pivot/types/renderer';

// Aggregation utilities
export type { AggregationFunction } from './components/pivot/utils/aggregations';

// Registry exports
export { DefaultRendererRegistry, defaultRendererRegistry } from './components/pivot/renderers/registry';

// UI component exports
export { Button } from './components/ui/button';
export { Card } from './components/ui/card';
export { Dialog } from './components/ui/dialog';

// Utility exports
export { cn } from './lib/utils';

// Re-export for backwards compatibility
export { ReactPivotGrid as PivotGrid } from './components/pivot';