import esbuild from 'esbuild';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { readdirSync } from 'fs';
import path from 'path';

const clean = () => {
  if (existsSync('dist')) {
    rmSync('dist', { recursive: true, force: true });
  }
  mkdirSync('dist', { recursive: true });
};

const copyFiles = () => {
  const filesToCopy = [
    { src: 'src/popup/popup.html', dest: 'dist/popup/popup.html' },
    { src: 'src/popup/popup.css', dest: 'dist/popup/popup.css' },
    { src: 'src/options/options.html', dest: 'dist/options/options.html' },
    { src: 'src/options/options.css', dest: 'dist/options/options.css' },
    { src: 'manifest.json', dest: 'dist/manifest.json' },
  ];

  filesToCopy.forEach(({ src, dest }) => {
    const destDir = path.dirname(dest);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    writeFileSync(dest, readFileSync(src));
  });
};

const build = async (watch = false) => {
  clean();
  copyFiles();

  const commonConfig = {
    bundle: true,
    minify: true,
    sourcemap: true,
    target: 'es2020',
  };

  const entries = [
    {
      in: 'src/background/service-worker.ts',
      out: 'dist/background/service-worker.js',
      format: 'esm',
    },
    {
      in: 'src/content/content.ts',
      out: 'dist/content/content.js',
      format: 'iife',
    },
    {
      in: 'src/popup/popup.ts',
      out: 'dist/popup/popup.js',
      format: 'iife',
    },
    {
      in: 'src/options/options.ts',
      out: 'dist/options/options.js',
      format: 'iife',
    },
  ];

  try {
    if (watch) {
      // Watching is a bit complex with multiple formats,
      // for now we'll just rebuild on change
      console.log('Watching for changes... (Rebuilding on change)');
      await esbuild.build({
        ...commonConfig,
        entryPoints: entries.map(e => e.in),
        outdir: 'dist',
      });
    } else {
      for (const entry of entries) {
        await esbuild.build({
          ...commonConfig,
          entryPoints: [entry.in],
          outfile: entry.out,
          format: entry.format,
        });
      }
      console.log('Build complete!');
    }
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
};

const args = process.argv.slice(2);
const watch = args.includes('--watch');
build(watch);
