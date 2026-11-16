# One Tiny Island: notes for coding sessions

A just-for-fun, procedural low-poly three.js island diorama (volcano, village, a windmill and wheat beds, a villager with a canoe, lagoon, wildlife and macaws, 8 weathers, day/night, boats, a galleon and friendly pirates) in **one self-contained HTML page**, deployed as a static site.

## Layout

- `index.html`: the whole app, in order:
  - `<head>` metadata (social tags, data: favicon) and one `<style>` block.
  - `<script id="boat-hull">`: readable hull builder `window.__islandBoatHull`, used by every boat.
  - `<script id="ships">`: readable plugin with the galleon and the pirate ship.
  - `<script id="farm">`: readable `window.__islandFarm` (`build`, `soil`, called by the bundle) and the `farm` plugin (windmill wheel, wheat, villager and canoe).
  - `<script id="parrots">`: readable `parrots` plugin (three pairs of red-and-blue macaws).
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
4. Keep `window.__island` (and `__island.ships`, `__island.farm`, `__island.parrots`) stable: the screenshot script, the README and people's consoles use it.
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
  | `tf` | island base: the rim wall `a` (non-indexed) plus one indexed mesh for the plinth cylinder (no bottom cap) and lip ring, with vertex colours on `a`'s material (`otiBG`) |
  | `Qu` | terrain mesh; `te(x,z)` terrain height (baked by `Fx` from `Yu` plus rivers, lagoon, lighthouse islet and islets) |
  | `Oe` / `sl` / `sr` | farm field footprint (`x, z` centre, `a, b` ellipse half axes, `rot`, `h` the flat field's height), world to field-local coordinates, footprint test. The footprint is what huts, trees and paths avoid: changing it moves everything placed after |
  | `nf` | water and rim wall; `rr(x,z,t,sea)` wave height, the JS twin of GLSL `waveH` (string `Ku`): seven Stokes-shaped trains via `otiWv` (two near main swells that beat into sets, a cross swell, two wind seas, two chop trains growing with sea²). Keep the two identical: boats, ships and dolphins ride on `rr` |
  | `sf` / `of` | sky dome / clouds |
  | `cf` | vegetation; returns the broadleaf-tree InstancedMesh (made from `Hx()`) as `otiForest` (`kit.forest`) |
  | `uf` | village and boats (`ol` = hull helper, delegates to `__islandBoatHull`); also the field hut (exported as `xmas.paddyHut` for the eave lights in `Mf`; the name stays), the scarecrow, the call to `__islandFarm.build` (its geometries join the merged static mesh), the canoe `Ot` with its hand-over flag `otiCn.busy`, and `otiFarm` (published as `kit.farm`). The lighthouse beams are one geometry holding both cones; their shader fades on `abs(position.x)` |
  | `df` | volcano; the lava streams are one indexed mesh (`otiLS`/`otiLD`/`otiLP`, offset `otiLO` per stream) |
  | `mf` | wildlife (gulls, dolphins, fish, turtles). Gull frame: built with the body along +x and wings along z, then turned a quarter turn about y, so **the head points along local -z** and the wings lie along x; the yaw is `PI - N` (circling with `sp > 0`) or `-N`, and the bank (Euler XYZ: roll about the body, then yaw) leans each bird into its turn. The two lagoon turtles are one InstancedMesh of 2 (`otiTu`), hidden together under ice |
  | `Mf` | Christmas extras (sleigh and friends; the snowman lives in `uf`) |
  | `ci` / `io` / `hl` | weather presets / weather name list / weather state machine class |
  | `wn` | SVG icons: Material Symbols Rounded paths wrapped by `Be` (see UI-GUIDELINES.md, Icons) |
  | `wf` | UI (panel, toasts, keys) |
  | `ul` | audio class |
  | `jx` | main: renderer, scene, lighting `Te(dt)`, simulation step `Et(dt)`, loop `bt`, frame `otiFrame` (mirror pass, scene, post step), `window.__island` |
  | `Ri` | material patcher (snow/wet/wind shader hooks, and the per-pixel surface detail on High). Option `flap`: wings flap by `abs(x)`, scaled under instancing by the flap factor `otiFl = clamp((|instance x scale| / |instance y scale| - 0.5) * 2.5, 0, 1)`: a uniformly scaled bird flaps fully, one squashed along its wingspan to under half stops flapping (folded wings) |

  Helpers: `at` tint geometry, `Ue` merge geometries, `Ze` seeded rng, `ce` clamp, `xe` lerp, `Nt` smoothstep, `De` world radius (86).
- Patched-in code uses `oti`-prefixed names (`otiP` plugin list, `otiU` plugin update, `otiF` per-frame shadow throttle + adaptive pixel ratio, `otiSlow`/`otiFT`/`otiAd`/`otiWarm` adaptive resolution state, `otiFS` fish schools, `otiAD`/`otiAR` aurora dice...). Realism pass: terrain `otiQ`/`otiL` (adaptive lattice), `otiV`/`otiG` (per-vertex normal + occlusion cache), land-first index order with the seabed left out of the shadow pass; `otiVG` vegetation vertex gradient; `otiGlow`/`otiPlaza` night plaza light pool uniforms; `otiDry` skips water cells under land. Farm field (flat at `Oe.h`): `otiTG(f)` scales the rim ellipse round its outline, so the field is **not left-right symmetric**; `otiTQ(lx, lz, inset)` rim metric (< 1 inside), `otiTD` signed footprint distance (blend apron in `Yu`, `sr`), `otiTW` field-local to world; `otiR = Ze(4271)` the field block's own rng (after the `ke` burn of 288 draws, which keeps everything placed later where it was). Inside the field the terrain is grass, tinted toward `ye.soil` by `__islandFarm.soil(lx, lz)` (looked up and tested once through `otiSo`/`otiSoI`; a missing or throwing farm leaves plain grass). The river shader no longer has a still-water branch (`aFade` stays 0..1). Farm hooks: `otiFarm` (kit.farm), `otiCn` (canoe hand-over), the mirror opt-out `userData.otiNoMirror`. Lighthouse islet in `Fx`: `otiLD`/`otiLT` (flat top, kept out of the lagoon gap). Some short names (`otiF`, `otiV`) are reused as locals in other scopes: grep with context. Use the same prefix for anything new so patches stay greppable.

- Surface detail (High only, all inside `Ri`, no textures): the fragment shader reads what a surface is from its vertex colour, height and slope and adds colour variation plus a height `otiBh` that `otiBump` turns into bump lighting after `<normal_fragment_maps>`. `Ri` option `detail`: terrain (`terrain: true`: grass mottling, sand ripples/pebbles, `otiRock` strata, path pebbles), `"rock"` (boulders, `otiRock`), `"veg"` (leaf dapples on green, bark streaks otherwise), `"grain"` (village and boats: grain down each face, thatch rows on warm sloped faces); `ji` picks `"veg"` for swaying instances and `"rock"` for the rest (coral gets none). GLSL helpers: `otiCell` (cellular), `otiN3` (3D value noise), `otiLod(k, fw)` (fades a detail of k cycles per unit before it gets smaller than a pixel: use it on every octave), `otiSp` (sand/snow mask for the sun glints added in the `<opaque_fragment>` hook). `vOP` is the un-swayed local position plus the instance offset, so patterns do not slide when the wind bends a tree or a boat moves. `Zt.otiDet.value` (1 High, 0 Low) is read **when the shader is compiled** and is part of the program cache key: Low compiles without any of this, and `setQuality` disposes the scene's materials so they recompile. New detail must stay in the existing programs (same options on materials that share one), so the program count does not move.

- Gloss (High, in `Ri`): the detail blocks also set `otiGl` (wet-sand band at the waterline, leaves, anything rain-wet); the `<opaque_fragment>` hook adds a sun highlight and a sky-coloured grazing reflection from the bumped normal.
- Beaches (`Yu`, both tiers): outside the island outline the ground follows `otiBe`: a gentle beach slope and a shallow shelf (width varies round the coast), then the drop-off to `qu`. The distance it works from is the smooth minimum of the distance to the outline, to an apron round the north mesa (`wi`) and to an apron round the volcano's foot (`he`), which is what gives those two a beach instead of a plunge. Sand islets (`Nx`) end in a beach slope too. In `Qu` the lattice thresholds were tightened (cells wholly under water use the coarser sizes) to pay for part of the extra shallow ground. Depth on the boat lanes: at least 2.7 at r 70, 5.8 at r 73, 8.7 at r 79.
- Cliffs (`Qu`, both tiers): steep sand/dune/shallow-seabed faces are coloured as rock, steep faces (`X > .6`) take their colour per corner from the corner's own height and slope, and keep part of the smoothed normal (`otiS`), so cliff and islet sides do not break into stretched sand-and-rock slivers.
- Grass (`cf`): `otiXx()` is the High tuft (5 curved blades); `otiGX` are the extra High tufts from a jittered grid with their own rng (`Ze(4711)`/`Ze(4712)`; acceptance scaled by 0.93 to make room for the farm), appended after the original 950 in the same instanced mesh. Low keeps `Xx()` and the original count. Do not draw from `ve` for new placements: it would move everything placed after.
- Frame (`otiFrame(force)` in `jx`, called by the loop and by `__island.step`): resets `renderer.info` (autoReset is off, so `info()` reports whole-frame totals), runs `otiMirror`, renders the scene to the canvas as before, then `otiPostRun`.
  - `otiPostRun` (High): copies the finished frame into a texture (`copyFramebufferToTexture` on a plain texture flagged `isFramebufferTexture`), bright-pass plus three downsamples and three additive upsamples over four 8-bit targets (1/2 to 1/16), then one premultiplied full-screen quad adds the glow and the vignette. Threshold and strength follow `uNight` and snow cover. The scene render itself is untouched (display-space glow, not HDR). State in `otiPo`; freed on Low.
  - `otiMirror` (High): planar water reflection. Mirrored camera about y = 0 with an oblique near plane, half-size target `otiMi.rt`, flagged `isXRRenderTarget` with an sRGB texture so the pass uses the **same programs** as the canvas (without that every material compiles a second variant); the water shader (`OTI_REFL` define, uniforms `otiRT`/`otiRM`/`otiRK`) undoes sRGB and the tone curve before mixing it into its sky reflection. Hidden in the pass: water, rim wall, sky dome, clouds (they read as white patches lying on the sea), rain, snow, wildlife, shadowless plants, anything with `userData.otiNoMirror` (set once, before the first pass builds the list) and **every additive material** (they write alpha 1 over empty sky, which shows as black blocks); the seabed is skipped through the terrain's `onBeforeShadow` draw range. Skipped when `otiRK` is 0 (rough sea, rain, ice, camera steep or very low) and, in the live loop, on shadow-map frames; `step` always renders it.
  - Shedding: when the adaptive check finds the page slow it sets `otiMiOff` (reflections) first, then lowers the pixel ratio, then sets `otiPoOff` (glow); `setQuality` clears both. `setAdaptiveResolution(false)` freezes all of it.

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

Also `worldRadius` (`De`), `scene`, `camera`, `controls`, `state`, `toast(msg)`, `audio()` (the `ul` instance) and `farm` (`uf`'s `otiFarm`): `material` (the boats' `St`), `canoe` (`{mesh, moor, busy}`), `jetty` (`J0`, `JE`, `dir`, `deck`, `len`, `width`), `huts`, `bridges`, `bungalows`, `fishing` (`{x, z, drift}`), `props` (well and campfire as `[x, z, r]`), `plaza`, `paths` (`to`), `river` (`Vn[0].pts`), `riverAt(u)`, `riverSurface(u)` (the water height `_f` bakes), `riverWidth(u)`; and `forest`: the broadleaf trees' InstancedMesh (perch trees for the parrots).

## Boats and ships

- `__islandBoatHull(T, length, beam, height, hullColor, deckColor, options)`: bow +x, keel at -h/2, deck at +h/2; `geometry.userData` has `deckAt`, `sheerAt`, `sideAt` for seating masts and gun ports.
- Ships plugin: galleon lane r 79 (outer, angle increasing), pirate lane r 73 (inner, the other way round); the sailboat circles at r 70, sand spits reach r 67.5, the hard rim is r 86. Ships stay away (or leave) when `ice > 0.2`, `sea > 0.8`, `calmK < 0.7` or `wind > 0.8`.
- Encounter phases: `approach` → `volley` → `escape` → `peel`. Every shot aims well ahead of the bow or astern of the target and is checked against both hulls; `state().minMiss` must stay above `hullRadius`, and a landing inside a hull radius logs a console warning (treat it as a failure).
- The pirate main sail carries one flat skull badge per face; `sailSurfaceX()` (next to `sailStrip()`) gives the sail's real surface so the badges sit a hair off it.
- Everything is pooled: no per-frame allocations, at most 8 extra draw calls while ships are out, 0 while away.

## Farm (`<script id="farm">`)

- Field layout (field-local, +lz downhill toward the default camera): four wheat beds round a cross-shaped lane, the windmill at its centre (wheel facing field angle 0.3), jars by the trestle, the scarecrow at the west end, the field hut east of the rim. Beds are seeded superellipses (`SHAPES`, `rho`, `halfWidth`) with ridged soil and a low skirt; `soil(lx, lz)` gives the terrain halo. Every corner stays 0.5 inside the lop-sided rim.
- `build(T)` returns tinted, world-placed, non-indexed geometries (position, normal, color) that `uf` merges into its static mesh: beds, trestle, jars. Wrapped in a try with a console warning; without `__islandFarm` the page loads with an empty field.
- Windmill wheel (one mesh): eases (`1 - exp(-0.8 dt)`) toward `0.25 + 3.2 wind` rad/s, at most 4.5, 0.05 under ice.
- Wheat (one InstancedMesh, no shadow, `otiNoMirror`, on the grass program: `weatherMaterial(Lambert{vertexColors, DoubleSide}, {detail: 'veg', sway})`, instance colours set before the first render). Per bed a phase 0..1: sown < 0.06 < sprouts < 0.16 < growing < 0.5 < ripening < 0.7 < ripe < 0.88 < harvest sweep (cut across the bed) < 0.96 < stubble. Rates (x sqrt(speed)): growth `0.006 (0.35 + 1.4 moisture)`, ripening `0.006 (0.5 + 0.7 (1 - rain))`, harvest 0.12 over 14 s; nothing grows with snow cover > 0.3 or ice > 0.2. Moisture rises quickly with rain and dries in about 5 minutes. A dry cycle is about 5 minutes, a rainy one about 2.5. A bed's instances are rewritten only when its look changes by a step, at most 10 times a second.
- The wheel and the villager use a copy of the boats' material (`onBeforeCompile` and `customProgramCacheKey` copied, so the same program) with `shadowSide = BackSide`: the shared shadow depth material only re-picks its program when it switches between instanced and plain meshes, and with `St` itself the wheel (right after the instanced wildlife) compiled a new double-sided depth program. Thin parts (sails, paddle blade) are two-layered so they still cast from both sides. Keep anything new that casts shadows on that copy.
- Canoe: the dinghy `Ot` (same hull builder and triangle count). While `kit.farm.canoe.busy` the plugin owns its transform; otherwise `uf` bobs it at its mooring `Bt`.
- Villager (one rigid mesh, `matrixAutoUpdate` off). Phases: `home` (hidden) → `walkOut` (hut door → jetty) → `board` → `toLanding` (slides out of the berth keeping its heading, backs onto the beach) → `disembark` → `lift` → `portage` (canoe upside down on the shoulders: jetty root, `to[3]`, round the north of the well, `to[0]`, round the field's east edge, `to[2]` to the bank below the upstream footbridge) → `launch` → `embark` → `river` (smoothed centre line, rides `riverSurface`, ducks under the downstream footbridge) → `lagoon` (the long way round from the mouth, never across the jetty) → back to `disembark`. Going home: `toMooring` (from a short window after the branch point near the end of the lap) → `berth` (backs in, heading fixed) → `unboard` → `walkHome`; called home after the window, it lands and takes `reMoor` (backs off the beach) into `toMooring`. Speeds: walk 1.3, carry 1.2, river 1.8, lagoon 1.2 (the stroke surge averages out). A loop takes about 2 minutes.
- Rules: out while `night < 0.25`, `rain < 0.5`, `calmK > 0.78`, `snowCover < 0.2`, `ice < 0.1`; turned back by `night > 0.4`, `rain > 0.66`, `calmK < 0.62`, `snowCover > 0.38`, `ice > 0.2` (finishes the leg down to the lagoon, then moors). A carry is only started (morning start, branch point, landing) if the rest of the loop and the way home fit before dusk (`night` 0.45, from the bundle's sun curve, the clock and `state.speed`; unlimited when the day cycle is paused). In time-lapse the villager hurries up to 3x; above that a loop never fits and they stay home. Ice or snow cover over 0.5 snaps them home (canoe back at its mooring).
- API `__island.farm`: `state()` (`beds[{phase, stage, height}]`, `moisture`, `windmill{speed, angle}`, `villager{phase, x, y, z, progress, afloat, visible}`, `canoe{x, y, z, busy}`), `setGrowth(p | [p0..p3])`, `setMoisture(m)`, `setVillager(phase, progress)` (bad input is ignored), `check()` (samples every leg: walker and carried canoe against huts and props, ground under the walk, river banks, footbridge headroom, lagoon depth, jetty, bungalows, fishing boat, berth manoeuvres; worst values with `where`, `ok`).
- Draw calls: wheel, wheat, villager (+ wheel and villager in the shadow pass and the reflection); 0 for the villager at night. Nothing is allocated per frame.

## Parrots (`<script id="parrots">`)

- One InstancedMesh of 6 birds (three pairs, 19 triangles each) on the gulls' program (`weatherMaterial(Lambert{vertexColors, DoubleSide}, {snow: 0, wet: 0, flap: true})`), no instance colours, `castShadow = false`, `frustumCulled = false`, `userData.otiNoMirror`: one draw call. Red with blue flight feathers and tail tip, a pale face patch and a charcoal beak: **no yellow, no green**. About twice a real macaw's size so the colours read from afar.
- Bird frame: wingspan along x, **head along local +z** (unlike the gulls), y up; yaw `atan2(dx, dz)`, Euler YXZ (yaw, pitch, then roll about the body). Wings are swept back so that, perched (x scale 0.32 of the bird's, the flap factor then 0), they lie along the flanks; taking off and landing ease the x scale to 1 and back over 0.7 s.
- Perches: up to 8 broadleaf treetops (the canopy's highest vertex through each instance matrix) picked with `Ze(7171)`: dense forest, at least 12 apart, more than 10 from the plaza and the field, off the volcano. Arcs between perches 10 to 35 apart are precomputed: a sideways bulge, a hump high enough to clear the treetops and ground by 1.6 along the way, a flight time of 1.15 x distance / 4.2 + 1.6 s. The mate follows 0.5 s behind, 0.6 to the side.
- Cycle per pair: perched 10 to 25 s (a look-around wiggle), then off to a free perch in reach; pairs start staggered. They only take off in fair weather (`rain < 0.4`, `night < 0.5`, `wind < 0.8`, `snow < 0.3`; grounded above 0.5 / 0.6 / 0.9 / 0.4); a flight in progress always lands. Perched birds stay visible at night and in rain.
- API `__island.parrots`: `state()` (`fair`, `birds[{phase, x, y, z}]`, `pairs[{phase, from, to, t}]`, `perches`), `fly(pair?)` (sends a perched pair off now, weather or not; bad input returns a reason string), `check()` (worst clearance of every arc above the treetops, `ok`).

## Verifying changes headless

- Chromium flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Playwright may be installed globally (`npm root -g`); do not add it to the repo.
- Pause the page's own loop with an init script that wraps `requestAnimationFrame` and checks a `window.__pauseLoop` flag (see `scripts/screenshots.mjs`), then drive time with `__island.step(dt, n)` (runs n simulation steps, renders once).
- Useful API: `setWeather(name, instant)`, `setTime(h)`, `setSpeed`, `setAuto`, `setDayCycle`, `setAutoRotate`, `erupt()`, `setSnowCover`, `setCamera(az, el, distScale, tx, ty, tz)` (elevation 0.07 to 1.55 rad, was 0.21 to 1.39; distance clamped to `max(6, 3%)`–170% of the default, was `max(20, 8.5%)`–145%), `reset()`, `info()`, `ui.setOpen/setHidden/showToast`, `setAdaptiveResolution(false)`, `ships.summon()`, `ships.state()`, `farm.state()`, `farm.setGrowth`, `farm.setVillager`, `farm.check()`, `parrots.state()`, `parrots.fly()`, `parrots.check()`.
- Baseline from `info()` at load (1280x720), whole frame: **Low: 54 draw calls, 348,884 triangles, 29 programs, 4 textures. High: 86 draw calls and 681,040 triangles with the water reflection pass running (62 and about 513k without it, e.g. looking steeply down), 32 programs, 10 textures** (`probe`-style vertex-buffer bytes: about 8.98 MB Low, 12.33 MB High). These include the farm (wheel, wheat and villager by day), the parrots (one call, paid for by the turtles' merge) and the merges in `tf`, `df` and the lighthouse. Ships add at most 8 calls (16 while reflected).
- Budget rule: a change must not raise draw calls, triangles, programs, textures or vertex-buffer bytes at load, on High or Low. Low is the floor that must not move at all; the High figures above already include the glow, reflections and dense grass, which were added knowingly and are not a licence for more.
- Collect `console` errors/warnings and `pageerror`; a clean run has none.
- To test Low headless, make the page pick it at start-up: an init script that reports `(pointer: coarse)` as matching and `navigator.hardwareConcurrency` as 2 (the debug API has no quality setter; the panel's Quality button, `.a-q`, toggles it at runtime).
- Swiftshader is slow: step in chunks, and give `page.screenshot` a long timeout (new effects compile shaders on first sight).
- Screenshots: `node scripts/screenshots.mjs [--only a,b] [--out DIR]` (about 3 minutes). Look at every image you regenerate; keep the nine under about 3 MB total.

## Deployment

Live at https://onetinyisland.verdet.me (production branch `main`). Cloudflare Pages Git integration, no build: framework preset None, empty build command, output directory `/`, production branch `main`; other branches get preview URLs. The whole repo root is published, so never commit anything private. `_headers` controls caching and security headers.

## Commits

- Small, focused commits with a clear message; branch off `main` for work.
- Never commit scratch files, pretty-printed bundles, test screenshots or `node_modules/`.
- Only regenerate `docs/screenshots/` when the visuals changed, and look at the results first.
