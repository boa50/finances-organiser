import fs from 'fs';
import path from 'path';
import { generateAssets, getFileHash, getCombinedHash } from '../generate-web-icons';

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
        expect.objectContaining({ src: expect.stringMatching(/^\/icon-192\.png\?v=/), sizes: '192x192' }),
        expect.objectContaining({ src: expect.stringMatching(/^\/icon-512\.png\?v=/), sizes: '512x512' }),
        expect.objectContaining({ src: expect.stringMatching(/^\/icon-maskable-512\.png\?v=/), sizes: '512x512', purpose: 'maskable' }),
      ])
    );

    const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.json?v=');
    expect(indexHtml).toContain('<link rel="icon" type="image/x-icon" href="/favicon.ico?v=');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=');
    expect(indexHtml).toContain('og:image');
  }, 60000);

  it('uses absolute URLs for OG/social images when SITE_URL is set', async () => {
    const originalSiteUrl = process.env.SITE_URL;
    process.env.SITE_URL = 'https://my-app.vercel.app';

    try {
      await generateAssets();

      const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
      expect(indexHtml).toContain('content="https://my-app.vercel.app/og-image.png?v=');
      expect(indexHtml).toMatch(/<meta name="twitter:image" content="https:\/\/my-app\.vercel\.app\/og-image\.png\?v=/);
    } finally {
      if (originalSiteUrl !== undefined) {
        process.env.SITE_URL = originalSiteUrl;
      } else {
        delete process.env.SITE_URL;
      }
    }
  }, 60000);

  it('uses absolute URLs for OG images when VERCEL_PROJECT_PRODUCTION_URL is set', async () => {
    const originalSiteUrl = process.env.SITE_URL;
    const originalVercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'my-app.vercel.app';

    try {
      await generateAssets();

      const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
      expect(indexHtml).toContain('content="https://my-app.vercel.app/og-image.png?v=');
    } finally {
      if (originalSiteUrl !== undefined) {
        process.env.SITE_URL = originalSiteUrl;
      } else {
        delete process.env.SITE_URL;
      }
      if (originalVercelUrl !== undefined) {
        process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercelUrl;
      } else {
        delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      }
    }
  }, 60000);

  describe('getCombinedHash', () => {
    const iconPath = path.resolve(__dirname, '../../assets/icon-v2.png');

    it('produces a different hash when version changes', () => {
      const hash1 = getCombinedHash(iconPath, '1.0.0');
      const hash2 = getCombinedHash(iconPath, '1.1.0');
      expect(hash1).not.toBe(hash2);
    });

    it('produces the same hash for the same inputs', () => {
      const hash1 = getCombinedHash(iconPath, '1.0.0');
      const hash2 = getCombinedHash(iconPath, '1.0.0');
      expect(hash1).toBe(hash2);
    });

    it('produces a different hash than getFileHash (which excludes version)', () => {
      const fileOnlyHash = getFileHash(iconPath);
      const combinedHash = getCombinedHash(iconPath, '1.0.0');
      expect(fileOnlyHash).not.toBe(combinedHash);
    });
  });
});
