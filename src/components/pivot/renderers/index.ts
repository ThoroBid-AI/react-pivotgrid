// Export renderer implementations
export * from './table-renderer';
export * from './shadcn-vertical-bar-chart-renderer';
export * from './shadcn-stacked-bar-chart-renderer';

// Export registry
export * from './registry';

// Setup default renderers
import { defaultRendererRegistry } from './registry';
import { tableRenderer } from './table-renderer';
import { shadcnVerticalBarChartRenderer } from './shadcn-vertical-bar-chart-renderer';
import { shadcnStackedBarChartRenderer } from './shadcn-stacked-bar-chart-renderer';

// Register default renderers
defaultRendererRegistry.registerRenderer(tableRenderer);
defaultRendererRegistry.registerRenderer(shadcnVerticalBarChartRenderer);
defaultRendererRegistry.registerRenderer(shadcnStackedBarChartRenderer);

export { defaultRendererRegistry };