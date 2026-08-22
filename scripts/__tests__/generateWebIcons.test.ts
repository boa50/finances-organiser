import fs from 'fs';
import path from 'path';
import { generateAssets } from '../generate-web-icons';

describe('generateWebIcons script', () => {
  jest.setTimeout(60000);
  const publicDir = path.resolve(__dirname, '../../public');

  it('generates all PWA icons, web favicons, manifest and index.html from source assets', async () => {
    await generateAssets();

    const expectedFiles = [
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'apple-touch-icon.png',
      'favicon-32x32.png',
      'favicon-16x16.png',
      'favicon.ico',
      'og-image.png',
      'manifest.json',
      'index.html',
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(publicDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size).toBeGreaterThan(0);
    }

    const manifestContent = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf-8'));
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/icon-512.png', sizes: '512x512' }),
        expect.objectContaining({ src: '/icon-maskable-512.png', sizes: '512x512', purpose: 'maskable' }),
      ])
    );

    const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.json" />');
    expect(indexHtml).toContain('<link rel="icon" type="image/x-icon" href="/favicon.ico" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
    expect(indexHtml).toContain('<meta property="og:image" content="/og-image.png" />');
  }, 60000);
});
