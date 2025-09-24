'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import type { RendererSelectorProps, PivotRenderer } from '../types/renderer';

export const RendererSelector = React.memo(function RendererSelector<
  T extends Record<string, unknown> = Record<string, unknown>
>({
  selectedRendererId,
  onRendererChange,
  registry,
  className = ''
}: RendererSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allRenderers = registry.getAvailableRenderers();
  const selectedRenderer = registry.getRenderer(selectedRendererId);

  // Group renderers by category
  const tableRenderers = allRenderers.filter(renderer => renderer.category === 'table' || renderer.type === 'table');
  const chartRenderers = allRenderers.filter(renderer => renderer.category === 'chart' || renderer.type === 'chart');

  const handleRendererSelect = (rendererId: string) => {
    onRendererChange(rendererId);
    setIsOpen(false);
    setExpandedCategory(null);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderRendererItem = (renderer: PivotRenderer<T>, isSubItem = false) => (
    <button
      key={renderer.id}
      onClick={() => {
        if (renderer.isAvailable) {
          handleRendererSelect(renderer.id);
        }
      }}
      disabled={!renderer.isAvailable}
      className={`w-full text-left px-3 py-2 text-xs transition-colors
                ${isSubItem ? 'pl-8' : ''}
                ${renderer.isAvailable
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }
                ${selectedRendererId === renderer.id && renderer.isAvailable
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : ''
                }`}
      title={renderer.description}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{renderer.name}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {renderer.description}
            </div>
          </div>
        </div>
        {renderer.comingSoon && (
          <span className="text-[10px] text-gray-400 ml-2">(Coming Soon)</span>
        )}
      </div>
    </button>
  );

  const renderCategoryHeader = (title: string, icon: React.ReactNode, categoryKey: string, hasItems: boolean) => {
    if (!hasItems) return null;

    return (
      <button
        onClick={() => toggleCategory(categoryKey)}
        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300
                 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
                 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronRight
          className={`w-3 h-3 transition-transform ${
            expandedCategory === categoryKey ? 'rotate-90' : ''
          }`}
        />
      </button>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
        Renderer
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs border rounded-md
                 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600
                 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <span>{selectedRenderer?.name || 'Unknown Renderer'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 border
                      border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto">

          {/* Table Renderers (direct, not grouped) */}
          {tableRenderers.map(renderer => renderRendererItem(renderer, false))}

          {/* Chart Renderers (grouped) */}
          {renderCategoryHeader(
            'Chart View',
            <BarChart3 className="w-3 h-3" />,
            'chart',
            chartRenderers.length > 0
          )}

          {expandedCategory === 'chart' && chartRenderers.map(renderer =>
            renderRendererItem(renderer, true)
          )}
        </div>
      )}
    </div>
  );
});