#!/usr/bin/env node
// Regenerates the README screenshots in docs/screenshots/ with headless Chromium.
//
// Setup (once):   npm i -D playwright && npx playwright install chromium
//            or:  a global Playwright install (found through NODE_PATH / `npm root -g`)
// Usage:          node scripts/screenshots.mjs [page.html] [--out DIR] [--only hero,night,...]
//
//   page.html   HTML file to load over file://   (default: index.html at the repo root)
//   --out DIR   where to write the JPEGs          (default: docs/screenshots)
//   --only a,b  render just these shots (names from the SHOTS table below)
//
// Every shot freezes auto weather, the day cycle and auto-rotate, sets its state through
// the page's debug API (window.__island), then steps the simulation so transitions settle.
// Exits non-zero if the page throws or logs an error, or if a shot fails. The pirates shot
// is skipped with a warning when the page has no window.__island.ships API.
// Takes about 2 minutes with software WebGL.

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------------------
// Shot table. Camera: [azimuth, elevation, distScale, targetX, targetY, targetZ]
// (radians; azimuth 0 puts the camera on +z looking toward -z; distScale 1 = default
// framing). `settle` = simulated seconds stepped after the state is set. Volcano sits at
// about (-36, -6), the lagoon at (32, 13), the village around (-15, 16).
// ---------------------------------------------------------------------------------------
const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 390, height: 844 };

const SHOTS = [
  { name: 'hero', weather: 'partly', hours: 10.5, camera: [0.55, 0.4, 0.6, 0, 0, 5], settle: 12 },
  { name: 'sunset', weather: 'partly', hours: 17.8, camera: [1.82, 0.24, 0.62, 0, 0, 2], settle: 12 }, // looking into the setting sun
  { name: 'night', weather: 'clear', hours: 22.5, camera: [0.9, 0.38, 0.72, -6, 2, 8], settle: 12 },
  { name: 'storm', weather: 'storm', hours: 15, camera: [0.4, 0.34, 0.8, -4, 3, 0], settle: 14 },
  { name: 'snow', weather: 'snow', hours: 11, snowCover: 1, camera: [0.55, 0.4, 0.6, 0, 0, 5], settle: 14 },
  { name: 'eruption', weather: 'partly', hours: 18.3, erupt: true, camera: [-0.9, 0.24, 0.6, -28, 10, -4], settle: 10, eruptAfter: 4.5 },
  // pirates: the camera is aimed at the midpoint of the two ships once the encounter runs.
  // shipCamera: azimuth offset from looking straight in toward the island, elevation, distance (world units).
  { name: 'pirates', weather: 'clear', hours: 11, ships: true, settle: 10, shipCamera: { azOffset: 0.7, elevation: 0.32, distance: 34 } },
  { name: 'controls', weather: 'clear', hours: 13, camera: [0.62, 0.5, 0.85, 19, 2.5, -11.5], settle: 10, panel: true }, // island left of the panel
  { name: 'mobile', weather: 'partly', hours: 9.5, camera: [0.62, 0.8, 0.85, -1, 2.5, 3], settle: 10, viewport: PHONE, ui: true },
];

const GL_FLAGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const DT = 1 / 30; // simulated frame length for __island.step
const JPEG_QUALITY = 82;

// ---------------------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { page: join(ROOT, 'index.html'), out: join(ROOT, 'docs', 'screenshots'), only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.out = resolve(argv[++i]);
    else if (a === '--only') opts.only = argv[++i].split(',').map((s) => s.trim());
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scripts/screenshots.mjs [page.html] [--out DIR] [--only hero,night,...]');
      process.exit(0);
    } else opts.page = resolve(a);
  }
  return opts;
}

// Local node_modules first (relative to this script, then the cwd), then NODE_PATH / global.
function loadPlaywright() {
  const bases = [import.meta.url, pathToFileURL(join(process.cwd(), 'x.js')).href];
  try {
    bases.push(pathToFileURL(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'x.js')).href);
  } catch {}
  for (const base of bases) {
    try {
      return createRequire(base)('playwright');
    } catch {}
  }
  console.error('Playwright not found. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(opts.page)) {
    console.error(`Page not found: ${opts.page}`);
    process.exit(1);
  }
  mkdirSync(opts.out, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: GL_FLAGS });
  const errors = [];
  const shots = opts.only ? SHOTS.filter((s) => opts.only.includes(s.name)) : SHOTS;

  try {
    for (const shot of shots) {
      const viewport = shot.viewport || DESKTOP;
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: viewport === PHONE, hasTouch: viewport === PHONE });
      const page = await context.newPage();
      page.on('pageerror', (e) => errors.push(`[${shot.name}] page error: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && errors.push(`[${shot.name}] console error: ${m.text()}`));

      // Let us pause the page's own render loop: software WebGL at 2x is slow enough that a
      // free-running loop starves the screenshot. While paused, the canvas keeps showing the
      // last frame rendered by __island.step().
      await page.addInitScript(() => {
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = (cb) => raf((t) => (window.__pauseLoop ? window.requestAnimationFrame(cb) : cb(t)));
      });
      await page.goto(pathToFileURL(opts.page).href);
      await page.waitForFunction(() => window.__island, null, { timeout: 60000 });
      await page.evaluate(() => (window.__pauseLoop = true));
      if (await page.$('.fail')) throw new Error(`[${shot.name}] the page showed its failure overlay`);
      // Keep transient toasts and the faint "show UI" button (hidden-UI mode) out of the pictures.
      await page.addStyleTag({ content: '.toast, body.hidden-ui .fab.restore { display: none !important; }' });

      const file = join(opts.out, `${shot.name}.jpg`);
      const ok = await page.evaluate(setUp, { shot, dt: DT });
      if (ok !== true) {
        console.warn(`skipped ${shot.name}.jpg: ${ok}`);
        await context.close();
        continue;
      }
      await page.waitForTimeout(400); // let CSS transitions (panel, hidden UI) finish
      await page.screenshot({ path: file, type: 'jpeg', quality: JPEG_QUALITY });
      console.log(`wrote ${file}`);
      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}

// Runs inside the page. Returns true, or a string explaining why the shot was skipped.
function setUp({ shot, dt }) {
  const isl = window.__island;
  const step = (seconds) => isl.step(dt, Math.ceil(seconds / dt));
  isl.reset && isl.reset();
  isl.setAuto(false);
  isl.setDayCycle(false);
  isl.setAutoRotate(false);
  isl.setSpeed(1);
  isl.setWeather(shot.weather, true);
  isl.setTime(shot.hours);
  if (shot.snowCover != null) isl.setSnowCover(shot.snowCover);
  isl.ui.setOpen(!!shot.panel);
  isl.ui.setHidden(!(shot.panel || shot.ui));
  if (shot.camera) isl.setCamera(...shot.camera);
  step(shot.settle);

  if (shot.erupt) {
    isl.erupt();
    step(shot.eruptAfter); // eruption ramps up over ~1 s and lasts ~13 s
  }

  if (shot.ships) {
    if (!isl.ships || typeof isl.ships.summon !== 'function') return 'window.__island.ships is not available in this page';
    isl.ships.summon();
    // Step until the encounter is under way (cannon puffs), then a little more.
    let s;
    for (let t = 0; t < 120; t += 0.5) {
      step(0.5);
      s = isl.ships.state();
      if (s.encounter && s.galleon.state !== 'away' && s.pirate.state !== 'away') break;
    }
    if (!s || !s.encounter) return `no encounter started (state: ${JSON.stringify(s)})`;
    step(2.5);
    s = isl.ships.state();
    const mx = (s.galleon.x + s.pirate.x) / 2;
    const mz = (s.galleon.z + s.pirate.z) / 2;
    // Look in toward the island (a little from the side), so it fills the background.
    const { azOffset, elevation, distance } = shot.shipCamera;
    const base = isl.setCamera(0, elevation, 1); // returns the default orbit distance
    isl.setCamera(Math.atan2(mx, mz) + azOffset, elevation, distance / base, mx, 1.5, mz);
    step(0.1);
  }
  isl.ui.refresh && isl.ui.refresh();
  return true;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
