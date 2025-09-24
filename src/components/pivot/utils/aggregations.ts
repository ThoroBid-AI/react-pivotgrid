export type AggregationFunction =
  | 'count'
  | 'countUnique'
  | 'listUnique'
  | 'sum'
  | 'integerSum'
  | 'average'
  | 'median'
  | 'sampleVariance'
  | 'sampleStandardDeviation'
  | 'minimum'
  | 'maximum'
  | 'first'
  | 'last';

export interface AggregationConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  fn: AggregationFunction;
  field: keyof T & string;
  label?: string;
}

export function getAggregationLabel(fn: AggregationFunction): string {
  const labels: Record<AggregationFunction, string> = {
    count: 'Count',
    countUnique: 'Count Unique Values',
    listUnique: 'List Unique Values',
    sum: 'Sum',
    integerSum: 'Integer Sum',
    average: 'Average',
    median: 'Median',
    sampleVariance: 'Sample Variance',
    sampleStandardDeviation: 'Sample Standard Deviation',
    minimum: 'Minimum',
    maximum: 'Maximum',
    first: 'First',
    last: 'Last',
  };
  return labels[fn];
}

export function aggregate<T extends Record<string, unknown> = Record<string, unknown>>(
  data: T[],
  field: keyof T & string,
  fn: AggregationFunction
): number | string | string[] {
  if (!data || data.length === 0) return 0;

  const values = data.map(item => item[field]).filter(v => v !== undefined && v !== null) as (string | number)[];

  switch (fn) {
    case 'count':
      return data.length;

    case 'countUnique':
      return new Set(values).size;

    case 'listUnique':
      return Array.from(new Set(values)).map(v => String(v));

    case 'sum': {
      const numericValues = values.map(val => parseFloat(String(val))).filter(n => !isNaN(n));
      return numericValues.reduce((acc, val) => acc + val, 0);
    }

    case 'integerSum': {
      const numericValues = values.map(val => parseInt(String(val), 10)).filter(n => !isNaN(n));
      return numericValues.reduce((acc, val) => acc + val, 0);
    }

    case 'average': {
      const numericValues = values.map(val => parseFloat(String(val))).filter(n => !isNaN(n));
      return numericValues.length > 0 ? numericValues.reduce((acc, val) => acc + val, 0) / numericValues.length : 0;
    }

    case 'median': {
      const nums = values
        .map(v => parseFloat(String(v)))
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
      if (nums.length === 0) return 0;
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 !== 0
        ? nums[mid]
        : (nums[mid - 1] + nums[mid]) / 2;
    }

    case 'sampleVariance': {
      const nums = values
        .map(v => parseFloat(String(v)))
        .filter(n => !isNaN(n));
      if (nums.length <= 1) return 0;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (nums.length - 1);
      return variance;
    }

    case 'sampleStandardDeviation': {
      const nums = values
        .map(v => parseFloat(String(v)))
        .filter(n => !isNaN(n));
      if (nums.length <= 1) return 0;
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const variance = nums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (nums.length - 1);
      return Math.sqrt(variance);
    }

    case 'minimum': {
      const nums = values
        .map(v => parseFloat(String(v)))
        .filter(n => !isNaN(n));
      return nums.length > 0 ? Math.min(...nums) : 0;
    }

    case 'maximum': {
      const nums = values
        .map(v => parseFloat(String(v)))
        .filter(n => !isNaN(n));
      return nums.length > 0 ? Math.max(...nums) : 0;
    }

    case 'first':
      return String(values[0] ?? '');

    case 'last':
      return String(values[values.length - 1] ?? '');

    default:
      return 0;
  }
}

export function formatAggregatedValue(value: number | string | string[]): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toLocaleString();
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}