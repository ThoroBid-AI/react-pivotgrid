'use client';

import type { PivotRenderer, BaseRendererProps } from '../types/renderer';

export class ChartRenderer<T extends Record<string, unknown> = Record<string, unknown>>
  implements PivotRenderer<T> {

  readonly id = 'chart';
  readonly name = 'Chart View';
  readonly type = 'chart' as const;
  readonly description = 'Interactive charts and visualizations';
  readonly isAvailable = false;
  readonly comingSoon = true;

  render(_props: BaseRendererProps<T>) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="text-center">
          <div className="text-2xl text-gray-400 dark:text-gray-500 mb-2">📊</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Chart View Coming Soon
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Future support for bar charts, line charts, and more
          </div>
        </div>
      </div>
    );
  }
}

// Create a singleton instance
export const chartRenderer = new ChartRenderer();