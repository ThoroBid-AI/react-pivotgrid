import { ReactNode } from 'react';
import type { PivotTable, SortState, FieldKey } from './index';

export type RendererType = 'table' | 'chart';

export type ChartOrientation = 'vertical' | 'horizontal';

export type RendererCategory = 'table' | 'chart';

export interface ChartConfig {
  orientation?: ChartOrientation;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface BaseRendererProps<T extends Record<string, unknown> = Record<string, unknown>> {
  pivotData: PivotTable<T>;
  rowFields: FieldKey<T>[];
  columnFields: FieldKey<T>[];
  valueFields: FieldKey<T>[];
  rowSortState?: SortState<T>;
  columnSortState?: SortState<T>;
  className?: string;
}

export interface PivotRenderer<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly name: string;
  readonly type: RendererType;
  readonly description: string;
  readonly isAvailable: boolean;
  readonly comingSoon?: boolean;
  readonly category?: RendererCategory;
  readonly chartConfig?: ChartConfig;

  render(props: BaseRendererProps<T>): ReactNode;
}

export interface RendererRegistry<T extends Record<string, unknown> = Record<string, unknown>> {
  getRenderer(id: string): PivotRenderer<T> | undefined;
  getAllRenderers(): PivotRenderer<T>[];
  getRenderersByType(type: RendererType): PivotRenderer<T>[];
  getRenderersByCategory(category: RendererCategory): PivotRenderer<T>[];
  getAvailableRenderers(): PivotRenderer<T>[];
  registerRenderer(renderer: PivotRenderer<T>): void;
  unregisterRenderer(id: string): void;
}

export interface RendererSelectorProps<T extends Record<string, unknown> = Record<string, unknown>> {
  selectedRendererId: string;
  onRendererChange: (rendererId: string) => void;
  registry: RendererRegistry<T>;
  className?: string;
}

export interface RendererProviderProps<T extends Record<string, unknown> = Record<string, unknown>> {
  selectedRendererId: string;
  onRendererChange: (rendererId: string) => void;
  rendererProps: BaseRendererProps<T>;
  className?: string;
}