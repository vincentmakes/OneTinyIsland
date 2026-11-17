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
// Takes about 3 minutes with software WebGL.

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
// about (-36, -6), the lagoon at (32, 13), the village plaza at (4, 18), the windmill and the
// wheat beds around (-15, 15) and the lighthouse at about (47, 21).
// The farm (window.__island.farm) is set to the same state for every shot: four different
// growth stages (`growth`, one phase per bed) and the villager at `villager` = [phase,
// progress] once the shot has settled (the default puts the canoe in the lagoon). The
// farm skips itself when the page has no farm API. By night or in bad weather the villager
// stays home, with the canoe at its mooring.
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
  // pirates: taken `after` simulated seconds past the volley's `shot`-th cannon shot (shot 3 is
  // the galleon firing back), so a muzzle puff and a ball in flight are in frame. shipCamera:
  // the camera looks in toward the island square to the line joining the two ships (so they
  // stand side by side), turned by azOffset (negative = toward their bows, which shows more
  // sail); elevation (radians), distance (world units); the target is the ships' midpoint
  // moved `inward` units toward the island and raised to `height`, so the island fills the top.
  { name: 'pirates', weather: 'clear', hours: 11, ships: true, settle: 10, shot: 3, after: 0.4,
    shipCamera: { azOffset: -0.45, elevation: 0.17, distance: 37, inward: 6, height: 5 } },
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
        // Mark the one-time "Drag to look around" hint as already seen.
        try { localStorage.setItem('oti-hint-drag', '1'); } catch {}
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
      // Generous timeout: software WebGL can take a while to compile shaders for newly visible effects.
      await page.screenshot({ path: file, type: 'jpeg', quality: JPEG_QUALITY, timeout: 600000 });
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
  // Fixed resolution: slow software WebGL must not make the page lower its pixel ratio.
  if (typeof isl.setAdaptiveResolution === 'function') isl.setAdaptiveResolution(false);
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
  const FARM = { growth: [0.13, 0.4, 0.62, 0.8], villager: ['lagoon', 0.42] }; // defaults (see the header)
  const farm = isl.farm && typeof isl.farm.setGrowth === 'function' ? isl.farm : null;
  // the villager is out on calm days only: otherwise home, with the canoe at its mooring
  const outside = shot.hours > 7 && shot.hours < 17 && !shot.snowCover && !['rain', 'storm', 'gale', 'snow'].includes(shot.weather);
  const villager = farm && typeof farm.setVillager === 'function';
  if (farm) farm.setGrowth(shot.growth || FARM.growth);
  if (villager) farm.setVillager('home');
  step(shot.settle);
  if (villager && outside) {
    farm.setVillager(...(shot.villager || FARM.villager));
    step(0.5);
  }

  if (shot.erupt) {
    isl.erupt();
    step(shot.eruptAfter); // eruption ramps up over ~1 s and lasts ~13 s
  }

  if (shot.ships) {
    if (!isl.ships || typeof isl.ships.summon !== 'function') return 'window.__island.ships is not available in this page';
    isl.ships.summon();
    // Step until the volley is under way, then until the chosen shot has been fired.
    let s;
    for (let t = 0; t < 120; t += 0.5) {
      step(0.5);
      s = isl.ships.state();
      if (s.encounter === 'volley') break;
    }
    if (!s || s.encounter !== 'volley') return `no volley started (state: ${JSON.stringify(s)})`;
    for (let t = 0; t < 20 && s.shots < shot.shot; t += 0.1) {
      step(0.1);
      s = isl.ships.state();
    }
    if (s.shots < shot.shot) return `only ${s.shots} shots fired (state: ${JSON.stringify(s)})`;
    step(shot.after);
    s = isl.ships.state();
    const { galleon: g, pirate: p } = s;
    const mx = (g.x + p.x) / 2, mz = (g.z + p.z) / 2, mr = Math.hypot(mx, mz);
    // horizontal direction from the target to the camera: square to the ships' separation, on the sea side
    let cx = g.z - p.z, cz = p.x - g.x;
    if (cx * mx + cz * mz < 0) (cx = -cx), (cz = -cz);
    const { azOffset, elevation, distance, inward, height } = shot.shipCamera;
    const base = isl.setCamera(0, elevation, 1); // returns the default orbit distance
    isl.setCamera(Math.atan2(cx, cz) + azOffset, elevation, distance / base, mx - (mx / mr) * inward, height, mz - (mz / mr) * inward);
    isl.step(dt, 1);
  }
  isl.ui.refresh && isl.ui.refresh();
  return true;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
