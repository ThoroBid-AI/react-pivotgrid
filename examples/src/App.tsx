import { ReactPivotGrid } from '@thorobid-ai/react-pivotgrid';
import '@thorobid-ai/react-pivotgrid/dist/style.css';

const sampleData = [
  { region: 'North', product: 'Laptop', category: 'Electronics', sales: 1000, quantity: 10, date: '2024-01-01' },
  { region: 'North', product: 'Mouse', category: 'Electronics', sales: 200, quantity: 20, date: '2024-01-02' },
  { region: 'South', product: 'Laptop', category: 'Electronics', sales: 1200, quantity: 12, date: '2024-01-01' },
  { region: 'South', product: 'Keyboard', category: 'Electronics', sales: 300, quantity: 15, date: '2024-01-03' },
  { region: 'East', product: 'Monitor', category: 'Electronics', sales: 800, quantity: 8, date: '2024-01-02' },
  { region: 'West', product: 'Laptop', category: 'Electronics', sales: 1100, quantity: 11, date: '2024-01-01' },
  { region: 'North', product: 'Chair', category: 'Furniture', sales: 150, quantity: 5, date: '2024-01-04' },
  { region: 'South', product: 'Desk', category: 'Furniture', sales: 400, quantity: 4, date: '2024-01-05' },
];

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            React PivotGrid Examples
          </h1>
          <p className="text-muted-foreground">
            Interactive pivot table component built on TanStack Table with drag-and-drop functionality
          </p>
        </header>

        <main className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Basic Pivot Table Example</h2>
            <p className="text-muted-foreground mb-4">
              Drag and drop fields between rows, columns, and values to explore the data.
            </p>
          </div>

          <ReactPivotGrid
            data={sampleData}
            initialConfig={{
              rows: ['region'],
              columns: ['category'],
              values: ['sales'],
              aggregation: 'sum'
            }}
            fieldLabels={{
              region: 'Region',
              product: 'Product',
              category: 'Category',
              sales: 'Sales ($)',
              quantity: 'Quantity',
              date: 'Date'
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default App;