#!/usr/bin/env node

/**
 * generate-web-icons.js
 * Automatically generates PWA icons, favicons, Apple touch icons,
 * Open Graph preview image, manifest.json, and index.html based on
 * the source icon defined in app.json or assets/.
 * Includes content-hash cache-busting so browsers and WebAPK update immediately.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateImageAsync, generateFaviconAsync } = require('@expo/image-utils');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const APP_JSON_PATH = path.join(PROJECT_ROOT, 'app.json');

function getAppConfig() {
  try {
    const raw = fs.readFileSync(APP_JSON_PATH, 'utf-8');
    const json = JSON.parse(raw);
    return json.expo || {};
  } catch (e) {
    console.warn('[generate-web-icons] Could not parse app.json, using defaults.', e.message);
    return {};
  }
}

function resolveSourceIcon(expoConfig) {
  const candidates = [
    expoConfig.icon && path.resolve(PROJECT_ROOT, expoConfig.icon),
    expoConfig.web && expoConfig.web.favicon && path.resolve(PROJECT_ROOT, expoConfig.web.favicon),
    path.join(PROJECT_ROOT, 'assets/icon-v2.png'),
    path.join(PROJECT_ROOT, 'assets/icon.png'),
    path.join(PROJECT_ROOT, 'assets/favicon-v2.png'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`[generate-web-icons] No source icon found. Checked: ${candidates.join(', ')}`);
}

function resolveFaviconSource(expoConfig, fallbackIcon) {
  const candidates = [
    expoConfig.web && expoConfig.web.favicon && path.resolve(PROJECT_ROOT, expoConfig.web.favicon),
    path.join(PROJECT_ROOT, 'assets/favicon-v2.png'),
    fallbackIcon,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return fallbackIcon;
}

function getFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex').slice(0, 8);
  } catch {
    return Date.now().toString(36);
  }
}

/**
 * Compute a combined hash from the source icon content AND the app version.
 * This ensures that version bumps (even without icon changes) produce a new
 * cache-busting hash, which triggers Chrome's WebAPK update mechanism.
 */
function getCombinedHash(filePath, appVersion) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    if (appVersion) {
      hash.update(appVersion);
    }
    return hash.digest('hex').slice(0, 8);
  } catch {
    return Date.now().toString(36);
  }
}

async function generateAssets() {
  console.log('🔄 [generate-web-icons] Generating Web, PWA, and OpenGraph icons from source assets...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const expoConfig = getAppConfig();
  const sourceIcon = resolveSourceIcon(expoConfig);
  const faviconSource = resolveFaviconSource(expoConfig, sourceIcon);
  const appVersion = expoConfig.version || '';
  const iconHash = getCombinedHash(sourceIcon, appVersion);

  console.log(`📌 Source Icon: ${path.relative(PROJECT_ROOT, sourceIcon)} (hash: ${iconHash}, version: ${appVersion || 'n/a'})`);
  console.log(`📌 Favicon Source: ${path.relative(PROJECT_ROOT, faviconSource)}`);

  const themeColor = (expoConfig.web && expoConfig.web.themeColor) || '#083a3e';
  const appName = (expoConfig.web && expoConfig.web.name) || expoConfig.name || 'FinancesOrganiser';
  const shortName = (expoConfig.web && expoConfig.web.shortName) || expoConfig.slug || 'FinancesOrganiser';
  const lang = (expoConfig.web && expoConfig.web.lang) || 'en';

  // Resolve site URL for absolute OG/social meta paths.
  // Vercel auto-injects VERCEL_PROJECT_PRODUCTION_URL (without protocol) at build time.
  // SITE_URL can be set manually as a full URL override.
  const siteUrl = (
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    ''
  ).replace(/\/+$/, '');

  if (siteUrl) {
    console.log(`📌 Site URL: ${siteUrl} (used for absolute OG/social meta paths)`);
  } else {
    console.log('📌 Site URL: not set (OG/social meta paths will be relative — set SITE_URL or deploy to Vercel for absolute URLs)');
  }

  const iconSpecs = [
    { filename: 'icon-192.png', width: 192, height: 192, src: sourceIcon, resizeMode: 'contain', backgroundColor: 'transparent' },
    { filename: 'icon-512.png', width: 512, height: 512, src: sourceIcon, resizeMode: 'contain', backgroundColor: 'transparent' },
    { filename: 'icon-maskable-512.png', width: 512, height: 512, src: sourceIcon, resizeMode: 'contain', backgroundColor: themeColor },
    { filename: 'apple-touch-icon.png', width: 180, height: 180, src: sourceIcon, resizeMode: 'contain', backgroundColor: 'transparent' },
    { filename: 'favicon-32x32.png', width: 32, height: 32, src: faviconSource, resizeMode: 'contain', backgroundColor: 'transparent' },
    { filename: 'favicon-16x16.png', width: 16, height: 16, src: faviconSource, resizeMode: 'contain', backgroundColor: 'transparent' },
    { filename: 'og-image.png', width: 1200, height: 630, src: sourceIcon, resizeMode: 'contain', backgroundColor: '#090d16' },
  ];

  for (const spec of iconSpecs) {
    const { source } = await generateImageAsync(
      { projectRoot: PROJECT_ROOT },
      {
        src: spec.src,
        width: spec.width,
        height: spec.height,
        resizeMode: spec.resizeMode,
        backgroundColor: spec.backgroundColor,
      }
    );
    const destPath = path.join(PUBLIC_DIR, spec.filename);
    fs.writeFileSync(destPath, source);
    console.log(`  ✓ Generated ${spec.filename} (${spec.width}x${spec.height}, ${(source.length / 1024).toFixed(1)} KB)`);
  }

  // Generate multi-resolution favicon.ico
  try {
    const faviconPng = await generateImageAsync(
      { projectRoot: PROJECT_ROOT },
      {
        src: faviconSource,
        width: 64,
        height: 64,
        resizeMode: 'contain',
        backgroundColor: 'transparent',
      }
    );
    const faviconIcoBuffer = await generateFaviconAsync(faviconPng.source);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), faviconIcoBuffer);
    console.log(`  ✓ Generated favicon.ico (${(faviconIcoBuffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.warn('  ⚠️ Could not generate multi-size favicon.ico, falling back to 32x32 png copy:', err.message);
    const fallbackFavicon = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
    fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), fallbackFavicon);
  }

  // Generate / update manifest.json with cache-busting query strings
  const manifest = {
    id: '/',
    name: appName,
    short_name: shortName,
    description: 'A personal finance management application',
    lang: lang,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: themeColor,
    background_color: themeColor,
    icons: [
      {
        src: `/icon-192.png?v=${iconHash}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-512.png?v=${iconHash}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/icon-maskable-512.png?v=${iconHash}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('  ✓ Updated manifest.json (with version hash)');

  // Generate / update index.html template with cache-busting query strings
  const indexHtml = `<!DOCTYPE html>
<html lang="%LANG_ISO_CODE%">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>%WEB_TITLE%</title>

    <!-- Theme & Colors -->
    <meta name="theme-color" content="${themeColor}" />
    <meta name="msapplication-TileColor" content="${themeColor}" />

    <!-- Web App & PWA Capabilities -->
    <link rel="manifest" href="/manifest.json?v=${iconHash}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${shortName}" />

    <!-- Favicons & Icons (cache-busted with source content hash) -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico?v=${iconHash}" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=${iconHash}" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=${iconHash}" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=${iconHash}" />

    <!-- Open Graph / Vercel Preview / Social Media -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="FinanceCloud — Personal Finance Tracker" />
    <meta property="og:description" content="Cross-platform personal finance tracker with cloud sync, multi-currency support, and offline-first persistence." />
    <meta property="og:image" content="${siteUrl}/og-image.png?v=${iconHash}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FinanceCloud — Personal Finance Tracker" />
    <meta name="twitter:description" content="Cross-platform personal finance tracker with cloud sync, multi-currency support, and offline-first persistence." />
    <meta name="twitter:image" content="${siteUrl}/og-image.png?v=${iconHash}" />

    <!-- The \`react-native-web\` recommended style reset: https://necolas.github.io/react-native-web/docs/setup/#root-element -->
    <style id="expo-reset">
      /* These styles make the body full-height */
      html,
      body {
        height: 100%;
      }
      /* These styles disable body scrolling if you are using <ScrollView> */
      body {
        overflow: hidden;
      }
      /* These styles make the root element full-height */
      #root {
        display: flex;
        height: 100%;
        flex: 1;
      }
    </style>
  </head>

  <body>
    <!-- Use static rendering with Expo Router to support running without JavaScript. -->
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <!-- The root element for your Expo app. -->
    <div id="root"></div>
  </body>
</html>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), indexHtml);
  console.log('  ✓ Updated index.html (with version hash)');

  console.log('✅ [generate-web-icons] All Web, PWA, and OpenGraph assets generated successfully!\n');
}

function startWatch() {
  generateAssets().catch(console.error);

  const assetsDir = path.join(PROJECT_ROOT, 'assets');
  console.log(`👀 [generate-web-icons] Watching ${assetsDir} and app.json for changes...`);

  let debounceTimer = null;
  const onChange = (filename) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n🔔 Detected change in ${filename}, regenerating web icons...`);
      generateAssets().catch(console.error);
    }, 400);
  };

  if (fs.existsSync(assetsDir)) {
    fs.watch(assetsDir, { recursive: false }, (_, filename) => onChange(`assets/${filename}`));
  }
  if (fs.existsSync(APP_JSON_PATH)) {
    fs.watch(APP_JSON_PATH, () => onChange('app.json'));
  }
}

if (require.main === module) {
  if (process.argv.includes('--watch')) {
    startWatch();
  } else {
    generateAssets().catch((err) => {
      console.error('❌ [generate-web-icons] Error generating assets:', err);
      process.exit(1);
    });
  }
}

module.exports = { generateAssets, getFileHash, getCombinedHash };
