/**
 * Simple frontend bundler using esbuild
 * No Vite needed - direct Electron bundle
 */

import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Build] Building React frontend for Electron...');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build React app
esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
    '.css': 'css',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl'
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'window'
  },
  external: ['electron'],
  minify: false, // Easier debugging
  sourcemap: true,
  logLevel: 'info'
}).then(() => {
  console.log('[Build] Frontend build complete!');

  // Copy and modify index.html to dist
  const indexHtml = fs.readFileSync('index.html', 'utf-8');
  const modifiedHtml = indexHtml
    .replace(
      '<script type="module" src="/src/main.tsx"></script>',
      '<link rel="stylesheet" href="./bundle.css">\n    <script src="./bundle.js"></script>'
    );

  fs.writeFileSync(path.join(distDir, 'index.html'), modifiedHtml);
  console.log('[Build] index.html copied to dist/');

  console.log('[Build] Frontend ready for Electron');
}).catch((error) => {
  console.error('[Build] Build failed:', error);
  process.exit(1);
});
