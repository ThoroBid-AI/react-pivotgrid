# @thorobid-ai/react-pivotgrid

[![npm version](https://badge.fury.io/js/@thorobid-ai%2Freact-pivotgrid.svg)](https://badge.fury.io/js/@thorobid-ai%2Freact-pivotgrid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A dynamic pivot grid component for React built on TanStack Table with drag-and-drop functionality. Transform your flat data into interactive pivot tables with real-time field manipulation and aggregation.

## Features

- **TypeScript Support** - Complete type safety with TypeScript definitions
- **Drag & Drop Interface** - Interactive field management with @dnd-kit
- **Multiple Aggregations** - Support for various aggregation functions
- **Field Filtering** - Built-in filtering capabilities
- **Debounced Updates** - Optimized performance with debounced calculations
- **Customizable Styling** - Built with Tailwind CSS for easy customization

## 📦 Installation

```bash
npm install @thorobid-ai/react-pivotgrid
```

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { ReactPivotGrid } from '@thorobid-ai/react-pivotgrid';
import '@thorobid-ai/react-pivotgrid/dist/style.css';

const sampleData = [
  { region: 'North', product: 'Laptop', category: 'Electronics', sales: 1000, quantity: 10 },
  { region: 'South', product: 'Mouse', category: 'Electronics', sales: 200, quantity: 20 },
  // ... more data
];

function App() {
  return (
    <ReactPivotGrid data={sampleData} />
  );
}
```

### With Initial Configuration

```tsx
import React from 'react';
import { ReactPivotGrid } from '@thorobid-ai/react-pivotgrid';
import '@thorobid-ai/react-pivotgrid/dist/style.css';

const salesData = [
  { region: 'North', product: 'Laptop', category: 'Electronics', sales: 1000, quantity: 10 },
  { region: 'South', product: 'Mouse', category: 'Electronics', sales: 200, quantity: 20 },
  // ... more data
];

function App() {
  return (
    <ReactPivotGrid
      data={salesData}
      initialConfig={{
        rows: ['region'],
        columns: ['category'],
        values: ['sales'],
        aggregation: 'sum',
        filters: {
          region: ['North', 'South']
        }
      }}
      fieldLabels={{
        region: 'Region',
        product: 'Product',
        category: 'Category',
        sales: 'Sales ($)',
        quantity: 'Quantity'
      }}
    />
  );
}
```


## Aggregation Functions

The library supports multiple aggregation functions:

- `count` - Count of records
- `sum` - Sum of numeric values
- `average` - Arithmetic mean
- `min` - Minimum value
- `max` - Maximum value

### Usage Example

```tsx
<ReactPivotGrid
  data={data}
  initialConfig={{
    rows: ['category'],
    columns: ['region'],
    values: ['revenue'],
    aggregation: 'sum'
  }}
/>
```

## Field Filtering

Filter data by field values:

```tsx
<ReactPivotGrid
  data={data}
  initialConfig={{
    rows: ['region'],
    columns: ['category'],
    values: ['sales'],
    aggregation: 'sum',
    filters: {
      region: ['North', 'South'],
      category: ['Electronics']
    }
  }}
/>
```




## API Reference

### ReactPivotGrid Props

```typescript
interface ReactPivotGridProps<T extends Record<string, unknown>> {
  data: DataItem<T>[];
  initialConfig?: {
    rows?: FieldKey<T>[];
    columns?: FieldKey<T>[];
    values?: FieldKey<T>[];
    aggregation?: AggregationFunction;
    filters?: Partial<Record<FieldKey<T>, string[]>>;
  };
  fieldLabels?: Partial<Record<FieldKey<T>, string>>;
  pivotItemThreshold?: number;
}
```

### Types

```typescript
type DataItem<T> = T & Record<string, unknown>;
type FieldKey<T> = keyof T | string;
type AggregationFunction = 'count' | 'sum' | 'average' | 'min' | 'max';

interface PivotFieldState<T> {
  availableFields: FieldKey<T>[];
  rows: FieldKey<T>[];
  columns: FieldKey<T>[];
  values: FieldKey<T>[];
}
```


## Development

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint

# Run example
npm run example
```

## Advanced Usage

### Multi-level Grouping

```tsx
<ReactPivotGrid
  data={data}
  initialConfig={{
    rows: ['region', 'country'],
    columns: ['year', 'quarter'],
    values: ['revenue'],
    aggregation: 'sum'
  }}
/>
```

### With Field Labels

```tsx
<ReactPivotGrid
  data={data}
  initialConfig={{
    rows: ['region'],
    columns: ['category'],
    values: ['sales'],
    aggregation: 'sum'
  }}
  fieldLabels={{
    region: 'Sales Region',
    category: 'Product Category',
    sales: 'Revenue ($)'
  }}
/>
```

### Performance Tuning

```tsx
<ReactPivotGrid
  data={largeDataset}
  pivotItemThreshold={10000} // Optimize for large datasets
/>
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Run linting: `npm run lint`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on [TanStack Table](https://tanstack.com/table) for robust table functionality
- Drag and drop functionality powered by [@dnd-kit](https://dndkit.com/)
- UI components built with [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

- 📚 [Documentation](https://thorobid-ai.github.io/react-pivotgrid)
- 🐛 [Report Issues](https://github.com/thorobid-ai/react-pivotgrid/issues)
- 💬 [Discussions](https://github.com/thorobid-ai/react-pivotgrid/discussions)
- 💡 [Feature Requests](https://github.com/thorobid-ai/react-pivotgrid/issues/new?template=feature_request.md)

---

Made with ❤️ by [Thorobid AI](https://github.com/thorobid-ai)