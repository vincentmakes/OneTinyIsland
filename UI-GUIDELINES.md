# One Tiny Island: UI guidelines

How the controls on top of the island look and behave, and the rules for changing them. Every
value here is read from `index.html` (the `<style>` block and the `wf` UI code in the bundle). If
you change the page, change this file in the same commit.

## Principles

1. **The island is the show.** Controls are small, glassy and out of the way. One tap hides them
   all (H on a keyboard).
2. **One look everywhere.** Use the tokens below. No new colours, sizes or radii without adding
   them here first.
3. **Readable over anything.** Text has to read over the brightest scene (snow at noon, fog), not
   only over a dark night sky.
4. **Fingers first.** Every control is at least 44 px tall and works by touch, mouse and keyboard.
5. **Kid friendly and calm.** Short, warm words. Nothing scary, nothing that can't be undone.
6. **One file, no requests.** No web fonts, no icon fonts, no images: system fonts and inline SVG.

## Colour tokens

Defined on `:root`. Components use `var(--…)`; a raw colour in a component rule is a bug.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b1424` | Page background, `theme-color`, end colour of the failure gradient |
| `--glass` | `rgba(16, 24, 38, .70)` | Chip, FABs, toast |
| `--glass-strong` | `rgba(14, 20, 32, .80)` | Panel (sheet) |
| `--line` | `rgba(255, 255, 255, .14)` | 1 px borders on every surface and button |
| `--fill` | `rgba(255, 255, 255, .06)` | Button faces: weather buttons, action buttons, speed track |
| `--fill-2` | `rgba(255, 255, 255, .10)` | Round wells: chip icon, close button |
| `--fill-3` | `rgba(255, 255, 255, .22)` | Switch track (off), sheet grab handle |
| `--text` | `#f3f6fb` | Primary text and icons; selected speed segment background |
| `--muted` | `rgba(235, 242, 252, .76)` | Secondary text: chip second line, time, headings, hints, unselected labels |
| `--ink` | `#13202f` | Dark text on light fills (selected speed, "next" badge, loading screen) |
| `--knob` | `#fff` | Switch and slider thumbs |
| `--accent` | `#5fe0d0` | "On": switch track, selected weather and action borders |
| `--accent-bg` | `rgba(95, 224, 208, .18)` | "On" button background |
| `--accent2` | `#ffb25e` | "Next": the badge on the upcoming weather |
| `--hot` | `#ffc28f` | Eruption: Erupt label and icons |
| `--hot-line` / `--hot-bg` | `rgba(255, 150, 80, .5)` / `rgba(255, 120, 40, .14)` | Erupt action border and background |
| `--halo` | `rgba(11, 20, 36, .8)` | Dark halo behind focus rings that sit over the scene |
| `--sa-t/r/b/l` | `env(safe-area-inset-*)` | Safe-area insets, added to every edge offset |

Illustration colours are the only exceptions and stay inline: the time slider's day gradient
(`#142048`, `#3a3f7a`, `#ff9a6a`, `#8fd0ff`), the loading screen's sky gradient (`#b3cde0`,
`#9cb6c8`, `#7593a9`, sampled from the scene's opening frame), its wordmark (sea blues `#1d5a8c`
and `#2974a6`, volcano rock `#8d8378`, `#6e6560`, `#4a4442`, `#2a2120`, lava `#ff7a3c` and
`#ffc46b`, palm `#7a5a3a`, `#2f7a35`, `#63ad45`, ink `#13202f`) and its progress track (ink at
16%), and the failure screen's `#1d4f7a`.

## Glass surfaces

| Surface | Fill | Blur token | Border | Shadow | Radius |
|---|---|---|---|---|---|
| Chip | `--glass` | `--blur` = `blur(14px) saturate(1.3)` | 1 px `--line` | `--shadow` = `0 6px 24px rgba(0,0,0,.2)` | 26 px |
| FAB | `--glass` | `--blur` | 1 px `--line` | `--shadow` | 50% |
| Toast | `--glass` | `--blur` | 1 px `--line` | none | 18 px |
| Panel | `--glass-strong` | `--blur-strong` = `blur(20px) saturate(1.4)` | 1 px `--line` (top edge only on the bottom sheet) | `0 -10px 40px rgba(0,0,0,.3)` | 22 px (bottom sheet: top corners only) |

Stacking: UI layer `z-index: 2`, loading screen 4, failure screen 5. The canvas sits below the UI.

## Type

System UI stack only: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
sans-serif`, antialiased. No web fonts.

| Size | Weight | Where |
|---|---|---|
| 20 px | 700 (`b`) | Failure screen title |
| 17 px | 700 | Panel title |
| 15 px | 600 / 400 | Chip weather name (600), switch row labels (400), time value (600, tabular), loading and failure text |
| 14 px | 600 | Speed segments (tabular), action buttons, source link |
| 13 px | 600 | Toast; section headings (uppercase, 1.2 px tracking, `--muted`) |
| 12 px | 400 | Chip second line, row hints, weather labels, footnote |
| 10 px | 600 | "next" badge only |

Weights are 400, 500 (chip time), 600 and 700. No half-pixel sizes. Numbers that change (time,
countdown, speed) use `font-variant-numeric: tabular-nums` so they don't wobble.

## Spacing and radii

- Edge offsets: 10 px (chip, side panel), 14 px right / 16 px bottom (FABs), always plus the
  matching `--sa-*` inset.
- Gaps: 8 px between grid items (weather, actions), 10–12 px inside rows and the chip, 2 px
  between speed segments.
- Panel padding: 16 px sides, 18 px bottom (+ safe area); 8–10 px top.
- Section headings: 16 px above, 10 px below.
- Radii: 26 chip, 22 panel, 18 toast, 14 buttons and the speed track, 11 speed segment,
  13 switch track, 50% for FABs, thumbs and icon wells.

## Touch targets

Minimum 44 x 44 px for anything you can press.

| Control | Size |
|---|---|
| Chip | min-height 48 px |
| Menu FAB / Erupt FAB / restore button | 56 / 48 / 44 px round |
| Close button | 44 px round |
| Switch | 56 x 44 px (visual track 48 x 26) |
| Weather button | min-height 64 px, a quarter of the panel width (66 px wide on a 320 px phone) |
| Speed segment | min-height 44 px |
| Action button | min-height 56 px, min-width 96 px |
| Source link | min-height 44 px, full panel width |
| Time slider | 44 px tall, 28 px thumb |

Known exception: the seven speed segments share the panel width, so on a 320 px phone they are
36.5 to 42.9 px wide (44 px in the desktop panel, 48.6 px on a 390 px phone). They are 44 px tall and sit
2 px apart. Don't add an eighth speed.

## Components

### Weather chip (top left)
Icon well (36 px, `--fill-2`, 24 px icon) + two lines: weather name (15/600) and time (`--muted`,
tabular), then "Next: **Rain** in 1:05" or "Auto weather off", plus " · 5×" when the speed isn't 1.
Clear and Partly cloudy swap to night icons after dark (before 6:00, after 19:30). The chip keeps
the full weather name ("Thunderstorm"). It toggles the panel; it has `aria-expanded` and an
`aria-label` of "<weather>, island controls". Max width `100vw - 90px`, second line ellipsised.

### FABs (bottom right)
Menu (56 px, `menu` icon) opens the panel; Erupt (48 px, above it, icon in `--hot`) sets the
volcano off. Both fade out while the panel is open. Each has an `aria-label`.

### Panel (sheet)
Bottom sheet on phones: full width, `max-height: min(66vh, 600px)`, grab handle, scrolls inside.
Side panel at the desktop breakpoint: 360 px wide, full height, inset 10 px. `role="dialog"`,
`aria-label="Island controls"`. Closed, it is off screen and `visibility: hidden` (out of the Tab
order). Opening it from the chip or the menu button moves focus to its close button; closing it
(close button, chip, Esc) while focus is inside sends focus back to whatever opened it.
Order: Weather (auto switch, grid), Speed, Time of day (cycle switch, slider), Island (actions),
footnote, source link. The footnote reads: "Drag to orbit, pinch or scroll to zoom, drag with two fingers or
the right button to move, double-tap to reset. Press H to hide the controls and Esc to close this
panel. Everything here is procedural: no images, no downloads." Keep it to these gestures: it
wraps to five lines on a 320 px phone (four at 390 px and in the side panel).

### Switch
`role="switch"` with `aria-checked`; label in `aria-label`, visible label and hint in the row to its
left. Track `--fill-3` off, `--accent` on; white thumb slides 22 px with a small overshoot.

### Weather grid
Eight buttons in a fixed **4 x 2 grid** at every width (`repeat(4, minmax(0, 1fr))`). Icon 24 px in
`--text`, label 12 px in `--muted` (`--text` when selected), centred, may wrap to two lines
("Partly cloudy"). Grid labels must fit about 56 px at 12 px (the 320 px phone), so long names get
a short grid label: Thunderstorm shows "Storm", with the full name in `aria-label` and `title`.
States: selected `.on` (`--accent-bg`, `--accent` border, `aria-pressed="true"`); upcoming `.next`
(a `--accent2` pill reading "next" sitting on the top border; the button's `aria-label` becomes
"<name>, up next"). The grid is `role="group"`, `aria-label="Weather"`.

### Speed control
Segmented control on a `--fill` track: 0.5×, 1×, 2×, 5×, 10×, 30×, 60×. Selected segment is a
`--text` pill with `--ink` text. Each segment has `aria-label="Speed 5x"` and `aria-pressed`; the
track is `role="group"`, `aria-label="Speed"`.

### Time slider
Native `input type=range`, 0–24, step 0.05, `aria-label="Time of day"`. 8 px track with the
day gradient (night, dawn, day, dusk, night), 28 px white thumb. The time is shown at its right in
15/600 tabular numerals. Dragging it doesn't fight the clock: the value isn't refreshed while the
slider has focus.

### Action buttons
Grid `repeat(auto-fill, minmax(96px, 1fr))`: three columns in the side panel and on a 390 px phone, two on a 320 px phone.
Icon 22 px + label 14/600. Toggles (Auto-rotate, Sound) use `.on` and `aria-pressed`. Erupt is
`.hot`. The quality button reads "Quality: High" or "Quality: Low"; Sound swaps its icon
(`volume_up` / `volume_off`).

### Source link
The last thing in the panel, 12 px under the footnote: `<a class="srcl">` to the project's
repository (`https://github.com/vincentmakes/OneTinyIsland`), `target="_blank"` with
`rel="noopener noreferrer"`. It looks like a quiet action button laid out as one row: full
width, min-height 44 px, radius 14, `--line` border on `--fill`, `--text`, the GitHub mark
at 22 px + "Source on GitHub" (14/600), centred, never underlined. It is the only link out of
the page and the only `<a>` in the UI; it gets the standard focus ring and is the last Tab
stop of the panel.

### Toast
Top centre, 70 px below the top (+ safe area), `role="status"`, `aria-live="polite"`. Text 13/600,
centred, wraps (balanced) within `min(420px, 100vw - 32px)`. It stays up
`clamp(2.2 s, 1 s + 60 ms per character, 6 s)`: 2.2 s for short messages, about 3.9 s for a
48-character one. One toast at a time; a new one replaces the old.

### Restore button
Shown only while the UI is hidden: 44 px glass circle bottom right with the `visibility` icon,
deliberately faint (opacity .38) so screenshots stay clean; 0.8 on hover, 1 on keyboard focus.
Hiding the UI while focus is inside it moves focus here; restoring moves it to the menu button.

### The island view (canvas)
The canvas is part of the UI: it takes keyboard focus (`tabindex="0"`, last in the Tab order,
`role="application"`, `aria-label` "Island view. Arrow keys move, Shift and arrow keys turn, plus
and minus zoom, Home resets."). Camera keys only act while it has focus, so the time slider keeps
its arrow keys. Clicking or tapping the scene focuses it without a ring; closing the panel only
moves focus back to its opener when focus was inside the panel.

| | Mouse | Touch | Keyboard (canvas focused) |
|---|---|---|---|
| Orbit | drag | one finger | Shift + arrows (15 × 360° / view height a press: 7.5° at 720 px) |
| Move (pan over the ground) | right-drag, or Shift / Ctrl + drag | two fingers | arrows |
| Zoom | scroll wheel | pinch | `+` / `=` in, `-` out (1.25× a press) |
| Reset view | double-click | double-tap | Home |

Reset is instant (no animation, so nothing to turn off for reduced motion): pivot back to the
default, default framing. A double-tap is two pointer-ups within 300 ms and 25 px with no drag and
no second finger in between. Any camera input stops Auto-rotate; it resumes 5 s after the last
input when it is switched on.

Guard rails: tilt 0.02–1.5 rad from straight up; distance `max(6, 3% of the default framing
distance)` to 170% of it; the pivot stays within 70 of the default pivot and, once you have moved
the camera, glides along the ground; the camera never goes below terrain + 3.5 (or the sea), and
a camera you moved eases up to 9.5 above land so it stays over the treetops.

### Loading and failure screens
Loading: a pale sky gradient matched to the scene's opening frame (so the cross-fade is not a
jolt) and, centred on it with 12 px gaps, the wordmark, the line "Shaping a tiny island…" (15/400,
`--ink`: 7.8:1 to 10:1 on the gradient behind it, 5.1:1 at its darkest corner) and a progress bar.
- **Wordmark:** one static inline SVG (`.ld-name`, `clamp(220px, 64vmin, 380px)` wide, 480 x 190
  frame, `role="img"`, `aria-label="One Tiny Island"`). Low-poly block capitals with straight
  edges only: "ONE TINY" small in ink over a large "ISLAND" in two sea blues (a jagged lighter
  facet across the top, clipped to the letters) with an ink extrusion down and to the right. The
  A is the volcano (three rock facets, crater, lava) and a palm stands on the foot of the L. The
  blues hold at least 3:1 on the gradient behind them. It is the only place the name is drawn
  this way; the panel title stays plain text.
- **Progress bar:** `.ld-bar`, `clamp(160px, 46vmin, 260px)` wide, 8 px tall, radius 4 (the
  slider track's size), track ink at 16%, fill `--ink`, `aria-hidden` (the line above it says
  what is happening). The scene build blocks the main thread, so the bar cannot measure anything:
  it is an estimate that eases from 0 toward 95% over 8 s, quick at first (about half way after
  1.5 s). When the first scene frame is drawn a second fill sweeps to 100% in 0.25 s while the
  loader fades.
- Only `transform` and `opacity` are animated, on HTML elements, so the compositor keeps the bar
  moving while the scene build blocks the main thread; never animate anything else here, and
  never animate elements inside the SVG. Any frame of it must look finished, because a fast
  machine shows it for a fraction of a second: no minimum display time. It fades out over 0.6 s
  once the first scene frame has been drawn, then is removed. With reduced motion there is no
  bar (the wordmark and the line stay) and the loader disappears at once.

Without JavaScript a `<noscript>` style hides the loader, so only the noscript message shows and
nothing animates. Failure: dark radial gradient, bold title + one friendly line in `--muted`; the
loader is removed at once underneath it.

## Breakpoints

| Condition | Layout |
|---|---|
| default (portrait phones) | Bottom sheet, actions in two columns |
| `(min-width: 760px)`, or `(orientation: landscape) and (max-height: 560px)` | Side panel, 360 px, inset 10 px, no grab handle |
| `(orientation: landscape) and (max-height: 560px)` | Side panel `min(360px, 52vw)`; chip second line capped at 40vw |

Check every UI change at 1280 x 720, 390 x 844 and 320 x 568.

## Motion

| What | Duration | Easing |
|---|---|---|
| Panel slide | .38 s | `cubic-bezier(.2, .8, .2, 1)` |
| Hide / show UI | .35 s | ease (fade + 6 px drop) |
| Toast, restore button | .3 s | ease |
| Switch track / thumb | .2 s / .22 s | ease / `cubic-bezier(.3, 1.4, .5, 1)` (overshoot) |
| Loading fade | .6 s | ease |
| Loading bar estimate | 8 s, 0 to 95% | `cubic-bezier(.2, .7, .3, 1)` (quick start, long tail) |
| Loading bar completes | .25 s | ease-out |

`prefers-reduced-motion: reduce` turns all of these off: no transitions on the panel, toast,
hidden UI, switch, restore button or UI layer, no loading fade (the loader disappears at once),
and no loading bar (the wordmark and the line are enough). Auto-rotate also starts off.
Any new animation needs its reduced-motion rule in the same change.

## Accessibility

- **Focus ring:** `:focus-visible` only (mouse and touch clicks stay ring-free): 2 px `--text`
  outline, 2 px offset. The switch draws it inside (offset -2 px), the slider at 0. The chip and
  FABs, which sit over the scene, add a 6 px `--halo` so the ring shows on snow. The island view's
  ring is drawn inside the viewport (a fixed `body::after` frame at z-index 1, under the UI layer, inset 4 px, 2 px `--text` border,
  radius 14, 4 px `--halo` on both sides); browsers without `:has()` get a plain 2 px outline at
  offset -8 px.
- **Roles and state:** buttons are `<button>`; toggles carry `aria-pressed` (weather, speed,
  Auto-rotate, Sound), switches `role="switch"` + `aria-checked`, the chip `aria-expanded`. State
  attributes are updated in the same refresh that updates the classes (`N()` in `wf`, every
  0.25 s and after every click). Icon-only buttons have an `aria-label`; icons are
  `aria-hidden="true" focusable="false"`.
- **Hidden means hidden:** anything faded out is also `visibility: hidden`, so it leaves the Tab
  order and the accessibility tree.
- **Contrast targets:** text 4.5:1 and icons/borders 3:1, measured over the brightest scenes
  (snow cover at noon, fog, from above and from the default camera, desktop and phone), not over
  the night sky. Measured worst cases now: chip muted text 4.93:1 (was 3.18 with `--glass` .58 and
  `--muted` .66), chip weather name 7.42, toast 6.44, panel muted text 5.60–6.71, Erupt FAB icon
  about 4.6, loading text 7.8–10 (5.1 at the gradient's darkest corner), loading wordmark blues 3.1 and 4.4. Exception: the restore button at rest (about 1.8:1, on purpose; full contrast on
  hover and focus).
- **Keyboard:** Tab reaches everything visible, then the island view. **H** hides or shows the UI,
  **Esc** closes the panel. Enter / Space activate buttons, arrows move the slider. With the island
  view focused: arrows move, Shift + arrows orbit, `+` / `-` zoom, Home resets (see The island
  view).
- **Zoom:** the viewport has `user-scalable=no` on purpose: pinch is the camera zoom. Text sizes
  are therefore never below 12 px (10 px for the "next" badge only).

## Icons

Material Symbols Rounded, inlined as SVG path data in the `wn` map. Style is fixed: **FILL 1,
wght 400, GRAD -25, opsz 24**.

- **Source:** `github.com/google/material-design-icons`, pinned commit
  `10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`, file
  `symbols/web/<name>/materialsymbolsrounded/<name>_gradN25fill1_24px.svg`
  (raw URL: `https://raw.githubusercontent.com/google/material-design-icons/<commit>/symbols/web/<name>/materialsymbolsrounded/<name>_gradN25fill1_24px.svg`).
  Don't use the npm `@material-symbols/svg-400` package (opsz 48, grade 0: a different look).
- **Adding one:** download the file, check it has one `<path>` and `viewBox="0 -960 960 960"`,
  and add `key:Be("<d>")` to `wn` with an exact-once replacement. Copy the `d` unmodified.
  `Be` wraps it in `<svg viewBox="0 -960 960 960" width="24" height="24" fill="currentColor"
  aria-hidden="true" focusable="false">`. Add the glyph to `THIRD-PARTY-NOTICES.md`.
- **Colour:** always `currentColor`; set `color` on the parent (e.g. `--hot` on Erupt).
- **Sizes:** 24 px in the chip, FABs and weather buttons; 22 px in action buttons and the source link. Nothing else.
- **Current glyphs:** `sunny`, `bedtime`, `partly_cloudy_day`, `partly_cloudy_night`, `cloud`,
  `foggy`, `rainy`, `thunderstorm`, `air`, `weather_snowy`, `menu`, `close`, `volcano`, `360`,
  `volume_up`, `volume_off`, `visibility`, `visibility_off`, `speed`, `sailing`.
- **The one brand mark:** `wn.github` is the GitHub mark from Octicons (`mark-github-24`,
  release v19.15.0, MIT), used only on the source link, where it says where the link goes. It
  is not a Material Symbol: it keeps its own `viewBox="0 0 24 24"`, so it is stored as a whole
  `<svg>` string instead of going through `Be` (same attributes otherwise: `currentColor`,
  `aria-hidden`, `focusable="false"`). Path data unmodified; listed in
  `THIRD-PARTY-NOTICES.md`. No other logos.

## Voice and tone

- Short, present tense, sentence case: "The volcano erupts!", "Drag to look around",
  "Changes the weather now and then".
- Title case only for the app name ("One Tiny Island"). Button labels are one or two words.
- Playful but plain: "Ahoy!", "Pirates ahoy!", "Shaping a tiny island…". No jargon (not
  "FPS", "LOD", "render").
- Explain instead of failing: "Too stormy for ships right now", "The sea is frozen, the ships
  are staying in port", "Sound is not available here".
- State labels read as "Name: Value" with a capital value: "Quality: High", "Quality: Low",
  in the button and the toast alike.
- Toasts stay under about 50 characters; the toast wraps, but shorter is kinder.
- Use the weather names from the presets: Clear, Partly cloudy, Overcast, Fog, Rain,
  Thunderstorm (grid: Storm), Gale, Snow. "Weather" is uncountable: "the weather", not
  "weathers".

## Kid-friendly content

- Nobody gets hurt, nothing burns or sinks; cannonballs always miss. Storms, eruptions and
  pirates are spectacle, never danger.
- No scary imagery or words ("explode", "destroy", "die", "warning").
- No text input, no accounts, no data collection. One link out of the page: the source link at
  the bottom of the panel, which opens the project's GitHub repository in a new tab. The only stored
  thing is the hint flag `oti-hint-drag` in `localStorage`.
- Everything is reversible in one tap: the weather changes back, the volcano calms down, hidden
  controls come back with one button or H.
- Sound starts off and is opt-in.
