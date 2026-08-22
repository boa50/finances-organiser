#!/usr/bin/env node

/**
 * generate-web-icons.js
 * Automatically generates PWA icons, favicons, Apple touch icons,
 * Open Graph preview image, manifest.json, and index.html based on
 * the source icon defined in app.json or assets/.
 */

const fs = require('fs');
const path = require('path');
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

async function generateAssets() {
  console.log('🔄 [generate-web-icons] Generating Web, PWA, and OpenGraph icons from source assets...');

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const expoConfig = getAppConfig();
  const sourceIcon = resolveSourceIcon(expoConfig);
  const faviconSource = resolveFaviconSource(expoConfig, sourceIcon);

  console.log(`📌 Source Icon: ${path.relative(PROJECT_ROOT, sourceIcon)}`);
  console.log(`📌 Favicon Source: ${path.relative(PROJECT_ROOT, faviconSource)}`);

  const themeColor = (expoConfig.web && expoConfig.web.themeColor) || '#083a3e';
  const appName = (expoConfig.web && expoConfig.web.name) || expoConfig.name || 'FinancesOrganiser';
  const shortName = (expoConfig.web && expoConfig.web.shortName) || expoConfig.slug || 'FinancesOrganiser';
  const lang = (expoConfig.web && expoConfig.web.lang) || 'en';

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

  // Generate / update manifest.json
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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('  ✓ Updated manifest.json');

  // Generate / update index.html template
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
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${shortName}" />

    <!-- Favicons & Icons -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- Open Graph / Vercel Preview / Social Media -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="FinanceCloud — Personal Finance Tracker" />
    <meta property="og:description" content="Cross-platform personal finance tracker with cloud sync, multi-currency support, and offline-first persistence." />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="FinanceCloud — Personal Finance Tracker" />
    <meta name="twitter:description" content="Cross-platform personal finance tracker with cloud sync, multi-currency support, and offline-first persistence." />
    <meta name="twitter:image" content="/og-image.png" />

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
  console.log('  ✓ Updated index.html');

  console.log('✅ [generate-web-icons] All Web, PWA, and OpenGraph assets generated successfully!\n');
}

if (require.main === module) {
  generateAssets().catch((err) => {
    console.error('❌ [generate-web-icons] Error generating assets:', err);
    process.exit(1);
  });
}

module.exports = { generateAssets };
