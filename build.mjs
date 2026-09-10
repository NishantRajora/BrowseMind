import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const isWatch = process.argv.includes('--watch');

const entries = {
  'background': 'src/background/service-worker.ts',
  'content': 'src/content/content.ts',
  'popup': 'src/popup/popup.ts',
  'options': 'src/options/options.ts',
};

async function build() {
  const ctx = await esbuild.context({
    entryPoints: entries,
    bundle: true,
    outdir: 'dist',
    minify: !isWatch,
    sourcemap: isWatch,
    target: 'esnext',
    format: 'esm',
    entryNames: '[name]',
    logLevel: 'info',
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }

  // Copy static assets
  copyStaticAssets();
}

function copyStaticAssets() {
  const assets = [
    'manifest.json',
    'src/popup/popup.html',
    'src/popup/popup.css',
    'src/options/options.html',
    'src/options/options.css',
  ];

  assets.forEach(asset => {
    const srcPath = path.join(process.cwd(), asset);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join('dist', path.basename(asset));

      // Handle HTML files specifically to ensure they are in the root of dist
      if (asset.endsWith('.html') || asset.endsWith('.css')) {
         fs.copyFileSync(srcPath, destPath);
      } else {
         fs.copyFileSync(srcPath, destPath);
      }
    }
  });

  // Copy icons
  const iconsSrc = path.join('assets', 'icons');
  const iconsDest = path.join('dist', 'assets', 'icons');
  if (fs.existsSync(iconsSrc)) {
    fs.mkdirSync(iconsDest, { recursive: true });
    fs.readdirSync(iconsSrc).forEach(file => {
      fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDest, file));
    });
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
