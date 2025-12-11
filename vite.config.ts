import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
	outDir: 'dist',
	minify: 'esbuild', // 默认就是 esbuild，也可以用 'terser'
  }
})
