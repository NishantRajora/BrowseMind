import fs from 'fs';
import path from 'path';

// A minimal valid 1x1 transparent PNG
const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join('assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
icons.forEach(icon => {
  fs.writeFileSync(path.join(iconsDir, icon), pngBuffer);
  console.log(`Generated ${icon}`);
});
