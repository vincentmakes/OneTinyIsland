# One Tiny Island: notes for coding sessions

A just-for-fun, procedural low-poly three.js island diorama (volcano, village, lagoon, wildlife, 8 weathers, day/night, boats, a galleon and friendly pirates) in **one self-contained HTML page**, deployed as a static site.

## Layout

- `index.html`: the whole app, in order:
  - `<head>` metadata (social tags, data: favicon) and one `<style>` block.
  - `<script id="boat-hull">`: readable hull builder `window.__islandBoatHull`, used by every boat.
  - `<script id="ships">`: readable plugin with the galleon and the pirate ship.
  - one huge `<script>`: an esbuild-minified IIFE of three.js r187 plus the app. **No sources exist.**
  - `<script id="hints">`: one-time "Drag to look around" toast (`localStorage['oti-hint-drag']`).
- `scripts/screenshots.mjs`: Playwright generator for `docs/screenshots/*.jpg` (read its header).
- `docs/screenshots/`: README images; `hero.jpg` is also the social preview image.
- `UI-GUIDELINES.md`: the UI system (tokens, type, components, accessibility, icons, voice). `THIRD-PARTY-NOTICES.md`: three.js (MIT) and Material Symbols (Apache 2.0) licence texts.
- `_headers`: Cloudflare Pages caching and security headers. `README.md`, `LICENSE` (MIT), `.gitignore`.

## Golden rules

1. One self-contained file: no extra JS/CSS files, no CDN, no fonts, no images loaded by the page.
2. Zero network requests at runtime. No build step: the repo root is the site.
3. Kid friendly: nobody gets hurt, nothing burns or sinks. Cannonballs always miss.
4. Keep `window.__island` (and `__island.ships`) stable: the screenshot script, the README and people's consoles use it.
5. The page must load with a clean console (no errors, no warnings) and keep working without WebGL extras, sound or storage.
6. UI changes follow UI-GUIDELINES.md (and update it in the same commit).

## Editing the minified bundle

- Never reformat, re-minify or rewrite the big script. Change it with **exact string replacements that match exactly once**: count the anchor first (`grep -oF 'anchor' index.html | wc -l` must be 1), then use a short unique anchor with the Edit tool or a script that asserts `s.count(old) == 1`. Lines are hundreds of KB long: never print whole lines, use `grep -o '.\{80\}anchor.\{200\}'`.
- To read it, pretty-print a copy into a scratch dir (never into the repo):
  ```sh
  awk '/^<script>\(\(\)=>\{/{f=1} f{print} /^<\/script>/{if(f)exit}' index.html | sed '1s/^<script>//; $d' > /tmp/x/bundle.js
  prettier --parser babel /tmp/x/bundle.js > /tmp/x/bundle.pretty.js
  ```
- three.js comes first; the app starts at `var _e=i=>new Ct(i),ye={deep:`. Landmarks:

  | Name | What |
  |---|---|
  | `ye` | colour palette |
  | `Qu` | terrain mesh; `te(x,z)` terrain height |
  | `nf` | water and rim wall; `rr(x,z,t,sea)` wave height, the JS twin of GLSL `waveH` (string `Ku`): seven Stokes-shaped trains via `otiWv` (two near main swells that beat into sets, a cross swell, two wind seas, two chop trains growing with sea²). Keep the two identical: boats, ships and dolphins ride on `rr` |
  | `sf` / `of` | sky dome / clouds |
  | `cf` | vegetation |
  | `uf` | village and boats (`ol` = hull helper, delegates to `__islandBoatHull`) |
  | `df` | volcano |
  | `mf` | wildlife (gulls, dolphins, fish, turtles) |
  | `Mf` | Christmas extras (sleigh and friends; the snowman lives in `uf`) |
  | `ci` / `io` / `hl` | weather presets / weather name list / weather state machine class |
  | `wn` | SVG icons: Material Symbols Rounded paths wrapped by `Be` (see UI-GUIDELINES.md, Icons) |
  | `wf` | UI (panel, toasts, keys) |
  | `ul` | audio class |
  | `jx` | main: renderer, scene, lighting `Te(dt)`, simulation step `Et(dt)`, loop `bt`, `window.__island` |
  | `Ri` | material patcher (snow/wet/wind shader hooks) |

  Helpers: `at` tint geometry, `Ue` merge geometries, `Ze` seeded rng, `ce` clamp, `xe` lerp, `Nt` smoothstep, `De` world radius (86).
- Patched-in code uses `oti`-prefixed names (`otiP` plugin list, `otiU` plugin update, `otiF` per-frame shadow throttle + adaptive pixel ratio, `otiSlow`/`otiFT`/`otiAd`/`otiWarm` adaptive resolution state, `otiFS` fish schools, `otiAD`/`otiAR` aurora dice...). Realism pass: terrain `otiQ`/`otiL` (adaptive lattice), `otiV`/`otiG` (per-vertex normal + occlusion cache), land-first index order with the seabed left out of the shadow pass; `otiVG` vegetation vertex gradient; `otiGlow`/`otiPlaza` night plaza light pool uniforms; `otiDry` skips water cells under land. Some short names (`otiF`, `otiV`) are reused as locals in other scopes: grep with context. Use the same prefix for anything new so patches stay greppable.

- Camera (`l` = OrbitControls in `jx`): pan over the ground (right-drag, two fingers, arrows on the focused canvas), tilt 0.02–1.5 rad, distance `max(6, q*.03)`–`q*1.7`, pivot within 70 of the default `(-1, 2.5, 3)` (`l.cursor`, `l.maxTargetRadius`). `otiCam` (set by user input, cleared by `setCamera`/`reset`) makes the pivot ride the ground (`max(te,0)+otiCamK`) and eases the camera up to terrain + 9.5 over land (`otiCamH`/`otiCamU`); the hard floor at terrain + 3.5 applies to every camera. `otiHome` is the reset view (double-click/double-tap via `otiTap*`, Home key). Scripted cameras are unaffected.

## Plugin hook and `kit`

`jx` calls every factory in `window.__islandPlugins` with `kit`, adds the returned `group` to the scene, calls `update(t, dt, env)` every frame (`t` wave clock, `env` = `{t, rain, snow, wind, sea, lights, snowCover, night, erupt, fogK, sailAngle, ice, calmK, gulls, xmas}`) and publishes `api` as `window.__island[name]`. A throwing plugin is disabled with a console warning. `kit`:

| kit | bundle | kit | bundle |
|---|---|---|---|
| Group | `Le` | Color | `Ct` |
| Mesh | `Wt` | Vector3 | `z` |
| InstancedMesh | `ni` | Matrix4 | `ge` |
| BoxGeometry | `Kt` | Quaternion | `qe` |
| CylinderGeometry | `ee` | Euler | `Sn` |
| ConeGeometry | `Se` | DoubleSide | `Ee` |
| SphereGeometry | `Jn` | AdditiveBlending | `En` |
| IcosahedronGeometry | `Re` | tint | `at` |
| PlaneGeometry | `Hi` | merge | `Ue` |
| RingGeometry | `Ir` | hull | `ol` |
| BufferGeometry | `oe` | weatherMaterial | `Ri` |
| Float32BufferAttribute | `Lt` | waveHeight | `rr` |
| MeshLambertMaterial | `Ye` | terrainHeight | `te` |
| MeshBasicMaterial | `un` | rng / clamp / lerp / smoothstep | `Ze` / `ce` / `xe` / `Nt` |

Also `worldRadius` (`De`), `scene`, `camera`, `controls`, `state`, `toast(msg)` and `audio()` (the `ul` instance).

## Boats and ships

- `__islandBoatHull(T, length, beam, height, hullColor, deckColor, options)`: bow +x, keel at -h/2, deck at +h/2; `geometry.userData` has `deckAt`, `sheerAt`, `sideAt` for seating masts and gun ports.
- Ships plugin: galleon lane r 79 (outer, angle increasing), pirate lane r 73 (inner, the other way round); the sailboat circles at r 70, sand spits reach r 67.5, the hard rim is r 86. Ships stay away (or leave) when `ice > 0.2`, `sea > 0.8`, `calmK < 0.7` or `wind > 0.8`.
- Encounter phases: `approach` → `volley` → `escape` → `peel`. Every shot aims well ahead of the bow or astern of the target and is checked against both hulls; `state().minMiss` must stay above `hullRadius`, and a landing inside a hull radius logs a console warning (treat it as a failure).
- The pirate main sail carries one flat skull badge per face; `sailSurfaceX()` (next to `sailStrip()`) gives the sail's real surface so the badges sit a hair off it.
- Everything is pooled: no per-frame allocations, at most 8 extra draw calls while ships are out, 0 while away.

## Verifying changes headless

- Chromium flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Playwright may be installed globally (`npm root -g`); do not add it to the repo.
- Pause the page's own loop with an init script that wraps `requestAnimationFrame` and checks a `window.__pauseLoop` flag (see `scripts/screenshots.mjs`), then drive time with `__island.step(dt, n)` (runs n simulation steps, renders once).
- Useful API: `setWeather(name, instant)`, `setTime(h)`, `setSpeed`, `setAuto`, `setDayCycle`, `setAutoRotate`, `erupt()`, `setSnowCover`, `setCamera(az, el, distScale, tx, ty, tz)` (elevation 0.07 to 1.55 rad, was 0.21 to 1.39; distance clamped to `max(6, 3%)`–170% of the default, was `max(20, 8.5%)`–145%), `reset()`, `info()`, `ui.setOpen/setHidden/showToast`, `setAdaptiveResolution(false)`, `ships.summon()`, `ships.state()`.
- Baseline from `info()` at load (1280x720): **54 draw calls, about 440k triangles on High (about 338k on Low)**. Ships add at most 8 calls.
- Budget rule: a change must not raise draw calls, triangles, programs, textures or vertex-buffer bytes at load, on High or Low.
- Collect `console` errors/warnings and `pageerror`; a clean run has none.
- Swiftshader is slow: step in chunks, and give `page.screenshot` a long timeout (new effects compile shaders on first sight).
- Screenshots: `node scripts/screenshots.mjs [--only a,b] [--out DIR]` (about 3 minutes). Look at every image you regenerate; keep the nine under about 3 MB total.

## Deployment

Live at https://onetinyisland.verdet.me (production branch `main`). Cloudflare Pages Git integration, no build: framework preset None, empty build command, output directory `/`, production branch `main`; other branches get preview URLs. The whole repo root is published, so never commit anything private. `_headers` controls caching and security headers.

## Commits

- Small, focused commits with a clear message; branch off `main` for work.
- Never commit scratch files, pretty-printed bundles, test screenshots or `node_modules/`.
- Only regenerate `docs/screenshots/` when the visuals changed, and look at the results first.
