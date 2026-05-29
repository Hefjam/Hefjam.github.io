import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-pages',
      closeBundle() {
        // Rename the entry HTML to index.html in dist
        const src = resolve('dist', 'index.vite.html');
        if (existsSync(src)) {
          copyFileSync(src, resolve('dist', 'index.html'));
        }
        // Copy static pages
        const statics = ['privacy.html', 'QR Codes.html', 'admin.html'];
        for (const file of statics) {
          if (existsSync(file)) {
            copyFileSync(file, resolve('dist', file));
          }
        }
      },
    },
  ],
  // Use index.vite.html as entry so the blob index.html (for GitHub Pages) isn't overwritten
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.vite.html'),
    },
  },
});
