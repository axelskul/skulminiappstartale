import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mock Solana program/system for Privy's optional dependency
      '@solana-program/system': path.resolve(__dirname, './src/utils/solana-mock.js'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['@solana/web3.js'],
    exclude: ['@solana-program/system'],
  },
})
