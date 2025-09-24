import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ReactPivotGrid } from '../../src/components/pivot';

type TestData = {
  region: string;
  product: string;
  sales: number;
  quantity: number;
};

const mockData: TestData[] = [
  { region: 'North', product: 'A', sales: 100, quantity: 10 },
  { region: 'North', product: 'B', sales: 150, quantity: 15 },
  { region: 'South', product: 'A', sales: 200, quantity: 20 },
  { region: 'South', product: 'B', sales: 120, quantity: 12 },
];

const mockConfig = {
  rows: ['region' as keyof TestData],
  columns: ['product' as keyof TestData],
  values: ['sales' as keyof TestData],
  aggregation: 'sum' as const,
};

describe('ReactPivotGrid', () => {
  it('renders without crashing', () => {
    render(<ReactPivotGrid data={mockData} initialConfig={mockConfig} />);
    // Check for a generic element since we don't know the exact text
    expect(document.querySelector('div')).toBeInTheDocument();
  });
});