import type { DataItem } from '../../src/components/pivot/types';

// Basic sample data for testing
export const basicSampleData: DataItem[] = [
  { region: 'North', product: 'A', sales: 100, quantity: 10, category: 'Electronics', date: '2023-01-01' },
  { region: 'North', product: 'B', sales: 150, quantity: 15, category: 'Electronics', date: '2023-01-02' },
  { region: 'North', product: 'A', sales: 120, quantity: 12, category: 'Clothing', date: '2023-01-03' },
  { region: 'South', product: 'A', sales: 200, quantity: 20, category: 'Electronics', date: '2023-01-04' },
  { region: 'South', product: 'B', sales: 120, quantity: 12, category: 'Electronics', date: '2023-01-05' },
  { region: 'South', product: 'C', sales: 180, quantity: 18, category: 'Clothing', date: '2023-01-06' },
  { region: 'East', product: 'A', sales: 90, quantity: 9, category: 'Electronics', date: '2023-01-07' },
  { region: 'East', product: 'B', sales: 110, quantity: 11, category: 'Clothing', date: '2023-01-08' },
  { region: 'West', product: 'C', sales: 160, quantity: 16, category: 'Electronics', date: '2023-01-09' },
  { region: 'West', product: 'A', sales: 140, quantity: 14, category: 'Clothing', date: '2023-01-10' }
];

// Extended sample data with more fields
export const extendedSampleData: DataItem[] = [
  {
    id: 1,
    region: 'North America',
    country: 'USA',
    state: 'California',
    city: 'San Francisco',
    product: 'Laptop',
    category: 'Electronics',
    subcategory: 'Computers',
    brand: 'TechCorp',
    sales: 1500,
    quantity: 5,
    cost: 1200,
    profit: 300,
    discount: 0.1,
    date: '2023-01-15',
    quarter: 'Q1',
    month: 'January',
    salesperson: 'John Doe',
    customer_type: 'Business'
  },
  {
    id: 2,
    region: 'North America',
    country: 'USA',
    state: 'California',
    city: 'Los Angeles',
    product: 'Smartphone',
    category: 'Electronics',
    subcategory: 'Mobile',
    brand: 'MobileTech',
    sales: 800,
    quantity: 8,
    cost: 600,
    profit: 200,
    discount: 0.05,
    date: '2023-01-20',
    quarter: 'Q1',
    month: 'January',
    salesperson: 'Jane Smith',
    customer_type: 'Consumer'
  },
  {
    id: 3,
    region: 'Europe',
    country: 'Germany',
    state: 'Bavaria',
    city: 'Munich',
    product: 'Tablet',
    category: 'Electronics',
    subcategory: 'Mobile',
    brand: 'TechCorp',
    sales: 600,
    quantity: 6,
    cost: 450,
    profit: 150,
    discount: 0.0,
    date: '2023-02-01',
    quarter: 'Q1',
    month: 'February',
    salesperson: 'Hans Mueller',
    customer_type: 'Business'
  },
  {
    id: 4,
    region: 'Asia Pacific',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Tokyo',
    product: 'Headphones',
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'AudioBest',
    sales: 250,
    quantity: 25,
    cost: 200,
    profit: 50,
    discount: 0.15,
    date: '2023-02-15',
    quarter: 'Q1',
    month: 'February',
    salesperson: 'Yuki Tanaka',
    customer_type: 'Consumer'
  },
  {
    id: 5,
    region: 'Europe',
    country: 'France',
    state: 'Ile-de-France',
    city: 'Paris',
    product: 'Monitor',
    category: 'Electronics',
    subcategory: 'Computers',
    brand: 'DisplayTech',
    sales: 400,
    quantity: 4,
    cost: 320,
    profit: 80,
    discount: 0.08,
    date: '2023-03-01',
    quarter: 'Q1',
    month: 'March',
    salesperson: 'Marie Dupont',
    customer_type: 'Business'
  }
];

// Data with edge cases and special values
export const edgeCaseData: DataItem[] = [
  { region: null, product: 'A', sales: 100, quantity: null, category: undefined },
  { region: '', product: '', sales: 0, quantity: 0, category: 'Valid' },
  { region: 'Test', product: 'B', sales: -50, quantity: -5, category: 'Negative' },
  { region: 'Numbers', product: '123', sales: 999999, quantity: 1000000, category: 'Large' },
  { region: 'Decimal', product: 'C', sales: 123.456789, quantity: 12.34, category: 'Precision' },
  { region: 'Special', product: 'D', sales: Infinity, quantity: -Infinity, category: 'Infinity' },
  { region: 'NaN', product: 'E', sales: NaN, quantity: NaN, category: 'Invalid' },
  { region: 'Unicode', product: 'Ü', sales: 100, quantity: 10, category: 'Tëst' },
  { region: 'Emoji', product: '🚀', sales: 200, quantity: 20, category: '📊' },
  { region: 'Long Text', product: 'A'.repeat(1000), sales: 300, quantity: 30, category: 'B'.repeat(500) }
];

// Data with different data types
export const mixedTypeData: DataItem[] = [
  { id: 1, active: true, value: 100, date: new Date('2023-01-01'), tags: ['a', 'b'] },
  { id: '2', active: false, value: '200', date: '2023-01-02', tags: 'single' },
  { id: 3.5, active: 1, value: null, date: 1672531200000, tags: [] },
  { id: true, active: 'yes', value: undefined, date: new Date(), tags: null },
  { id: [1, 2], active: { nested: true }, value: { amount: 500 }, date: 'invalid', tags: ['x'] }
];

// Time series data
export const timeSeriesData: DataItem[] = [
  { date: '2023-01-01', sales: 100, visits: 1000, conversions: 10 },
  { date: '2023-01-02', sales: 120, visits: 1100, conversions: 12 },
  { date: '2023-01-03', sales: 90, visits: 900, conversions: 8 },
  { date: '2023-01-04', sales: 150, visits: 1300, conversions: 15 },
  { date: '2023-01-05', sales: 110, visits: 1050, conversions: 11 },
  { date: '2023-01-06', sales: 130, visits: 1200, conversions: 13 },
  { date: '2023-01-07', sales: 140, visits: 1250, conversions: 14 }
];

// Generate large dataset for performance testing
export function generateLargeDataset(size: number): DataItem[] {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const products = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const channels = ['Online', 'Retail', 'Wholesale', 'Direct'];

  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    region: regions[i % regions.length],
    product: products[i % products.length],
    category: categories[i % categories.length],
    quarter: quarters[i % quarters.length],
    channel: channels[i % channels.length],
    sales: Math.round(Math.random() * 10000) / 100, // Random 0-100.00
    quantity: Math.floor(Math.random() * 1000) + 1, // Random 1-1000
    cost: Math.round(Math.random() * 5000) / 100, // Random 0-50.00
    date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    salesperson: `Person${(i % 50) + 1}`,
    customer_id: `CUST${String(i % 1000).padStart(4, '0')}`
  }));
}

// Generate high cardinality data for testing thresholds
export function generateHighCardinalityData(uniqueFields: number): DataItem[] {
  return Array.from({ length: uniqueFields }, (_, i) => ({
    id: i + 1,
    unique_field: `unique_${i}`,
    region: `Region_${i}`,
    product: `Product_${i}`,
    category: `Category_${i % Math.min(10, uniqueFields)}`, // Some overlap
    sales: Math.random() * 1000,
    quantity: Math.floor(Math.random() * 100)
  }));
}

// Generate nested hierarchy data
export function generateHierarchicalData(): DataItem[] {
  const data: DataItem[] = [];
  const regions = ['North America', 'Europe', 'Asia Pacific'];
  const countries = {
    'North America': ['USA', 'Canada', 'Mexico'],
    'Europe': ['Germany', 'France', 'UK', 'Italy'],
    'Asia Pacific': ['Japan', 'China', 'Australia', 'India']
  };
  const categories = ['Electronics', 'Clothing', 'Home & Garden'];
  const subcategories = {
    'Electronics': ['Computers', 'Mobile', 'Audio', 'Gaming'],
    'Clothing': ['Mens', 'Womens', 'Kids', 'Accessories'],
    'Home & Garden': ['Furniture', 'Appliances', 'Decor', 'Tools']
  };

  let id = 1;
  regions.forEach(region => {
    countries[region as keyof typeof countries].forEach(country => {
      categories.forEach(category => {
        subcategories[category as keyof typeof subcategories].forEach(subcategory => {
          for (let i = 0; i < 3; i++) {
            data.push({
              id: id++,
              region,
              country,
              category,
              subcategory,
              product: `Product${id}`,
              sales: Math.round(Math.random() * 10000) / 100,
              quantity: Math.floor(Math.random() * 100) + 1,
              year: 2023,
              quarter: `Q${(id % 4) + 1}`,
              month: Math.floor(Math.random() * 12) + 1
            });
          }
        });
      });
    });
  });

  return data;
}

// Performance test data with controlled characteristics
export function generatePerformanceTestData(
  rows: number,
  uniqueRowFields: number,
  uniqueColumnFields: number
): DataItem[] {
  const data: DataItem[] = [];

  for (let i = 0; i < rows; i++) {
    data.push({
      id: i + 1,
      row_field_1: `Row1_${i % uniqueRowFields}`,
      row_field_2: `Row2_${Math.floor(i / uniqueRowFields) % uniqueRowFields}`,
      col_field_1: `Col1_${i % uniqueColumnFields}`,
      col_field_2: `Col2_${Math.floor(i / uniqueColumnFields) % uniqueColumnFields}`,
      value_1: Math.random() * 1000,
      value_2: Math.floor(Math.random() * 100),
      value_3: Math.random() * 10000,
      text_field: `Text_${i % 100}`,
      date_field: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
    });
  }

  return data;
}

// Data with all aggregation function test cases
export const aggregationTestData: DataItem[] = [
  { group: 'A', value: 10, text: 'first', count: 1, decimal: 10.5 },
  { group: 'A', value: 20, text: 'second', count: 1, decimal: 20.7 },
  { group: 'A', value: 30, text: 'third', count: 1, decimal: 15.2 },
  { group: 'B', value: 40, text: 'first', count: 1, decimal: 8.9 },
  { group: 'B', value: 50, text: 'fourth', count: 1, decimal: 25.1 },
  { group: 'C', value: 60, text: 'first', count: 1, decimal: 12.3 },
];

// Data for filter testing
export const filterTestData: DataItem[] = [
  { category: 'A', type: 'X', value: 100, active: true },
  { category: 'A', type: 'Y', value: 200, active: false },
  { category: 'B', type: 'X', value: 150, active: true },
  { category: 'B', type: 'Y', value: 250, active: true },
  { category: 'C', type: 'Z', value: 300, active: false },
];

export default {
  basicSampleData,
  extendedSampleData,
  edgeCaseData,
  mixedTypeData,
  timeSeriesData,
  aggregationTestData,
  filterTestData,
  generateLargeDataset,
  generateHighCardinalityData,
  generateHierarchicalData,
  generatePerformanceTestData
};