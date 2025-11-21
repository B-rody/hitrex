import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        onstart(args) {
          args.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
            lib: {
              entry: 'electron/main.ts',
              formats: ['cjs'],
              fileName: () => 'main.cjs',
            },
            rollupOptions: {
              external: ['electron', 'ffmpeg-static', 'fluent-ffmpeg', /^node:.*/],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
              fileName: () => 'preload.cjs',
            },
            rollupOptions: {
              external: ['electron', /^node:.*/],
            },
          },
        },
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),

  ],
})
