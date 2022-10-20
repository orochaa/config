/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="vitest" />
/// <reference types="vite/client" />
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'html']
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    cors: false
  },
  build: {
    target: 'ES2017',
    outDir: 'dist',
    minify: 'esbuild'
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    cors: false
  },
  resolve: {
    alias: {
      '@/tests': resolve(__dirname, '__tests__'),
      '@': resolve(__dirname, 'src')
    }
  }
})
