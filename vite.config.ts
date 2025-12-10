import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
	outDir: 'dist',
	minify: 'esbuild', // 默认就是 esbuild，也可以用 'terser'
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor' // 所有第三方库打包到 vendor.js
          }
        }
      }
    }
  }
})
