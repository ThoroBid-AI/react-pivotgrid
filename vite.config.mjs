import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*'],
      outDir: 'dist',
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(process.cwd(), 'src/index.ts'),
      name: 'ReactPivotGrid',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'esm.js' : format}.js`,
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-slot',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
        'recharts',
        'lucide-react'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@radix-ui/react-dialog': 'RadixDialog',
          '@radix-ui/react-slot': 'RadixSlot',
          '@dnd-kit/core': 'DndKitCore',
          '@dnd-kit/sortable': 'DndKitSortable',
          '@dnd-kit/utilities': 'DndKitUtilities',
          'recharts': 'Recharts',
          'lucide-react': 'LucideReact'
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@thorobid-ai/react-pivotgrid': resolve(process.cwd(), 'src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});