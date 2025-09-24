'use client';

import React from 'react';
import type { RendererProviderProps, RendererRegistry } from '../types/renderer';

export const RendererProvider = React.memo(function RendererProvider<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  selectedRendererId,
  rendererProps,
  registry,
  className = ''
}: Omit<RendererProviderProps<T>, 'onRendererChange'> & {
  registry: RendererRegistry<T>;
}) {
  const selectedRenderer = registry.getRenderer(selectedRendererId);

  if (!selectedRenderer) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-red-300 dark:border-red-600 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-sm font-medium mb-1">
            Renderer Not Found
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Renderer &quot;{selectedRendererId}&quot; is not registered
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {selectedRenderer.render(rendererProps)}
    </div>
  );
});