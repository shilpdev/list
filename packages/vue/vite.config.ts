import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import dts from 'vite-plugin-dts'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    dts({
      include: ['src', '../../shared'],
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      fileName: 'index',
      name: 'VueList',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
