'use client';

import React, { ReactNode } from 'react';

interface SimpleTooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function SimpleTooltip({ content, children, className = '' }: SimpleTooltipProps) {
  return (
    <div className={`relative inline-block group ${className}`}>
      {children}
      <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200
                    bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900
                    dark:bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
        </div>
      </div>
    </div>
  );
}