'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../../ui/chart';
import type { PivotRenderer, BaseRendererProps } from '../types/renderer';
import { transformPivotToChartData, generateChartConfig } from '../utils/chart-data';

export class ShadcnStackedBarChartRenderer<T extends Record<string, unknown> = Record<string, unknown>>
  implements PivotRenderer<T> {

  readonly id = 'shadcn-stacked-bar-chart';
  readonly name = 'Stacked Bar Chart';
  readonly type = 'chart' as const;
  readonly description = 'Stacked bar chart visualization with shadcn/ui styling';
  readonly isAvailable = true;
  readonly category = 'chart' as const;
  readonly chartConfig = {
    orientation: 'vertical' as const,
    showLegend: true,
    showGrid: true,
  };

  render(props: BaseRendererProps<T>) {
    const { pivotData, rowFields, columnFields, valueFields, className = '' } = props;

    // Transform pivot data to chart format
    const transformedData = transformPivotToChartData(
      pivotData,
      rowFields,
      columnFields,
      valueFields,
      'vertical'
    );

    // If no data, show placeholder
    if (!transformedData.data.length) {
      return (
        <div className={`flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}>
          <div className="text-center">
            <div className="text-2xl text-gray-400 dark:text-gray-500 mb-2">📊</div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              No Data Available
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Configure rows and values to see chart visualization
            </div>
          </div>
        </div>
      );
    }

    // Generate chart configuration
    const chartConfig = generateChartConfig(transformedData.series);

    return (
      <div className={`w-full ${className}`}>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={transformedData.data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={transformedData.categoryKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Truncate long labels
                if (typeof value === 'string' && value.length > 10) {
                  return value.slice(0, 10) + '...';
                }
                return value;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                // Format numbers nicely
                if (typeof value === 'number') {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}K`;
                  }
                  return value.toString();
                }
                return value;
              }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {transformedData.series.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                stackId="stack"
                fill={series.color || `var(--chart-${(index % 5) + 1})`}
                radius={index === transformedData.series.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    );
  }
}

// Create a singleton instance
export const shadcnStackedBarChartRenderer = new ShadcnStackedBarChartRenderer();