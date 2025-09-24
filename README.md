# @thorobid-ai/react-pivotgrid

[![npm version](https://badge.fury.io/js/@thorobid-ai%2Freact-pivotgrid.svg)](https://badge.fury.io/js/@thorobid-ai%2Freact-pivotgrid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A powerful, TypeScript-first pivot grid component for React applications. Transform your flat data into interactive, dynamic pivot tables with comprehensive aggregation functions, advanced filtering, and responsive design.

## 🚀 Features

- **🎯 TypeScript-First** - Complete type safety with comprehensive type definitions
- **📊 14 Aggregation Functions** - count, sum, average, median, variance, min, max, and more
- **🔍 Advanced Filtering** - Multiple filter operators (contains, equals, greater than, between, etc.)
- **📱 Responsive Design** - Automatic mobile/desktop view switching
- **⚡ High Performance** - Optimized for large datasets with debounced calculations
- **🎨 Customizable** - Themes, custom renderers, and flexible styling
- **🧪 Well Tested** - Comprehensive test suite focusing on math and filter logic
- **🔧 Developer Friendly** - Rich API, helpful error messages, and extensive documentation

## 📦 Installation

```bash
npm install @thorobid-ai/react-pivotgrid
```

## 🎯 Quick Start

### Simple Usage

```tsx
import React from 'react';
import { PivotGrid, generateSalesData } from '@thorobid-ai/react-pivotgrid';

function App() {
  const data = generateSalesData(100); // Generate sample data

  return (
    <PivotGrid
      data={data}
      responsive={true}
      height="600px"
    />
  );
}
```

### Advanced Configuration

```tsx
import React from 'react';
import { PivotGrid } from '@thorobid-ai/react-pivotgrid';

const salesData = [
  { region: 'North', product: 'Laptop', revenue: 5000, quantity: 5, quarter: 'Q1' },
  { region: 'North', product: 'Mouse', revenue: 200, quantity: 10, quarter: 'Q1' },
  { region: 'South', product: 'Laptop', revenue: 3000, quantity: 3, quarter: 'Q2' },
  // ... more data
];

function App() {
  return (
    <PivotGrid
      data={salesData}
      initialConfig={{
        rows: ['region', 'product'],
        columns: ['quarter'],
        values: [
          { field: 'revenue', aggregation: 'sum' },
          { field: 'quantity', aggregation: 'average' }
        ],
        filters: [
          { field: 'region', values: ['North', 'South'] }
        ]
      }}
      theme="light"
      responsive={true}
      onConfigChange={(config) => console.log('Config changed:', config)}
      onError={(error) => console.error('Pivot error:', error)}
    />
  );
}
```

## 🔧 Core Engine Usage

For advanced use cases, you can use the core pivot engine directly:

```tsx
import { PivotEngine, generateSalesData } from '@thorobid-ai/react-pivotgrid';

const data = generateSalesData(1000);
const config = {
  rows: ['region'],
  columns: ['product'],
  values: [{ field: 'revenue', aggregation: 'sum' }],
  filters: []
};

const engine = new PivotEngine(data, config);
const pivotTable = engine.generatePivotTable();

console.log('Pivot table:', pivotTable);
console.log('Summary:', engine.getSummary());
```

## 📊 Aggregation Functions

The library supports 14 comprehensive aggregation functions:

| Function | Description | Use Case |
|----------|-------------|----------|
| `count` | Count of records | Record counting |
| `countUnique` | Count of unique values | Distinct value analysis |
| `listUnique` | List of unique values | Value enumeration |
| `sum` | Sum of numeric values | Total calculations |
| `integerSum` | Sum of integer values | Whole number totals |
| `average` | Arithmetic mean | Average calculations |
| `median` | Middle value | Statistical analysis |
| `sampleVariance` | Sample variance | Data spread analysis |
| `sampleStandardDeviation` | Sample standard deviation | Variability measurement |
| `minimum` | Smallest value | Range analysis |
| `maximum` | Largest value | Range analysis |
| `first` | First value encountered | Sequential data |
| `last` | Last value encountered | Sequential data |

### Usage Example

```tsx
const config = {
  rows: ['category'],
  columns: ['region'],
  values: [
    { field: 'revenue', aggregation: 'sum' },
    { field: 'revenue', aggregation: 'average' },
    { field: 'quantity', aggregation: 'median' },
    { field: 'products', aggregation: 'countUnique' }
  ],
  filters: []
};
```

## 🔍 Advanced Filtering

Comprehensive filtering with multiple operators:

```tsx
import { applyAdvancedFilters } from '@thorobid-ai/react-pivotgrid';

const filters = [
  { field: 'name', operator: 'contains', values: ['iPhone'], caseSensitive: false },
  { field: 'price', operator: 'between', values: [100, 1000] },
  { field: 'category', operator: 'include', values: ['Electronics', 'Books'] },
  { field: 'description', operator: 'startsWith', values: ['Premium'] },
  { field: 'stock', operator: 'greaterThan', values: [0] }
];

const filteredData = applyAdvancedFilters(data, filters);
```

### Filter Operators

- **Text**: `contains`, `notContains`, `startsWith`, `endsWith`, `equals`, `notEquals`
- **Numeric**: `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `between`
- **General**: `include`, `exclude`, `isEmpty`, `isNotEmpty`

## 📱 Responsive Design

Automatic mobile/desktop switching:

```tsx
<PivotGrid
  data={data}
  responsive={true}
  mobileBreakpoint={768}
  // Automatically switches to mobile view below 768px
/>
```

## 🎨 Theming and Customization

```tsx
<PivotGrid
  data={data}
  theme="dark" // 'light' | 'dark' | 'auto'
  className="my-custom-pivot"
  customRenderers={{
    'mobile': MyMobileRenderer,
    'desktop': MyDesktopRenderer
  }}
/>
```

## 🧪 Dummy Data Generation

Generate realistic test data for development:

```tsx
import {
  generateSalesData,
  generateEmployeeData,
  generateInventoryData,
  getDatasetInfo
} from '@thorobid-ai/react-pivotgrid';

// Generate 1000 sales records
const salesData = generateSalesData(1000);

// Generate 500 employee records
const employeeData = generateEmployeeData(500);

// Generate 800 inventory records
const inventoryData = generateInventoryData(800);

// Get information about available datasets
const datasets = getDatasetInfo();
```

## 🔧 API Reference

### PivotGrid Props

```typescript
interface PivotGridProps<T> {
  data: DataItem<T>[];
  config?: Partial<PivotConfig<T>>;
  initialConfig?: {
    rows?: FieldKey<T>[];
    columns?: FieldKey<T>[];
    values?: FieldKey<T>[];
    aggregation?: AggregationFunction;
    filters?: Partial<Record<FieldKey<T>, string[]>>;
  };
  pivotItemThreshold?: number;
  responsive?: boolean;
  mobileBreakpoint?: number;
  height?: string | number;
  width?: string | number;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  loading?: boolean;
  onConfigChange?: (config: PivotConfig<T>) => void;
  onError?: (error: PivotValidationError) => void;
  customRenderers?: Record<string, PivotTableRenderer<T>>;
}
```

### PivotConfig

```typescript
interface PivotConfig<T> {
  rows: FieldKey<T>[];
  columns: FieldKey<T>[];
  values: ValueFieldConfig<T>[];
  filters: FilterConfig<T>[];
  sorts?: SortState<T>[];
}

interface ValueFieldConfig<T> {
  field: FieldKey<T>;
  aggregation: AggregationFunction;
}
```

### Custom Hooks

```tsx
import { usePivotData, usePivotConfig, useResponsive } from '@thorobid-ai/react-pivotgrid';

// Data management
const { pivotTable, isComputing, error, isEmpty } = usePivotData({
  data,
  config,
  debounceMs: 300,
  threshold: 5000,
  onError: handleError
});

// Configuration management
const {
  config,
  updateConfig,
  addRowField,
  removeRowField,
  addColumnField,
  removeColumnField
} = usePivotConfig(initialConfig);

// Responsive behavior
const { isMobile } = useResponsive(768);
```

## 🏗️ Project Structure

```
react-pivotgrid/
├── src/
│   ├── core/                   # Core pivot engine (framework agnostic)
│   │   ├── engine/            # PivotEngine and aggregations
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Data transformation, filtering, validation
│   ├── components/            # React components
│   │   └── PivotGrid.tsx      # Main component
│   ├── hooks/                 # Custom React hooks
│   │   └── usePivotData.ts    # Pivot data management
│   └── utils/                 # Utilities and dummy data
├── tests/                     # Comprehensive test suite
│   └── unit/                  # Unit tests for math and filters
├── examples/                  # Example applications
│   ├── basic/                 # Basic usage examples
│   └── advanced/              # Advanced feature examples
└── docs/                      # Documentation (Docusaurus)
```

## 🧪 Testing

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
```

The test suite focuses on:
- ✅ Mathematical accuracy of all 14 aggregation functions
- ✅ Filter logic with edge cases and performance
- ✅ Data transformation and validation
- ✅ PivotEngine core calculations
- ✅ Error handling and edge cases

## 🌟 Advanced Examples

### Multi-level Grouping

```tsx
const config = {
  rows: ['region', 'country', 'city'],
  columns: ['year', 'quarter'],
  values: [
    { field: 'revenue', aggregation: 'sum' },
    { field: 'transactions', aggregation: 'count' }
  ]
};
```

### Complex Filtering

```tsx
const config = {
  rows: ['category'],
  columns: ['status'],
  values: [{ field: 'amount', aggregation: 'sum' }],
  filters: [
    { field: 'date', values: ['2023-01-01', '2023-12-31'], operator: 'between' },
    { field: 'region', values: ['North', 'South'] },
    { field: 'amount', values: ['1000'], operator: 'greaterThan' }
  ]
};
```

### Performance Optimization

```tsx
<PivotGrid
  data={largeDataset}
  pivotItemThreshold={10000} // Use Web Workers for datasets > 10k
  debounceMs={500}           // Debounce calculations
  responsive={true}          // Optimize for mobile
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

## 🙏 Acknowledgments

- Built on [TanStack Table](https://tanstack.com/table) for robust table functionality
- Inspired by traditional pivot table interfaces like Excel and Google Sheets
- Community feedback and contributions

## 📞 Support

- 📚 [Documentation](https://thorobid-ai.github.io/react-pivotgrid)
- 🐛 [Report Issues](https://github.com/thorobid-ai/react-pivotgrid/issues)
- 💬 [Discussions](https://github.com/thorobid-ai/react-pivotgrid/discussions)
- 💡 [Feature Requests](https://github.com/thorobid-ai/react-pivotgrid/issues/new?template=feature_request.md)

---

Made with ❤️ by [Thorobid AI](https://github.com/thorobid-ai)