# Bezel — Specification

Bezel is a free, public, fully client-side web app for producing App Store screenshot sets for iPhone. The user uploads raw screenshots, picks a built-in layout per slide, writes a headline, and exports a numbered set of PNGs at the App Store 6.9" size.

This document is the result of a requirements interview and is the source of truth for v1. Decisions and their tradeoffs are recorded in section 14.

---

## 1. Goals and non-goals

### Goals

- Produce a set of up to 10 App Store screenshots for iPhone (6.9" display class, 1320×2868, portrait) from raw screenshots and short text.
- Fixed, curated templates so output looks good with zero design skill.
- Realistic device bezel, rendered from a vector asset.
- Pixel-exact export. What the user sees in the preview is what the PNG contains.
- Zero network. Screenshots never leave the browser. No analytics, no fonts fetched, no CDN.
- Work survives reloads via local autosave. Multiple named projects.

### Non-goals (v1)

- iPad, Mac, Watch, Vision Pro, Android, or Google Play sizes.
- Landscape orientation.
- User-authored or editable templates.
- Localization (multiple languages per project).
- Free-form positioning of text or device.
- Custom fonts, Google Fonts, or font upload.
- Background images.
- Mobile or tablet browser layout.
- PWA / service worker / offline install.
- Accounts, sync, sharing links.

---

## 2. Target users and deployment

- **Audience:** indie iOS developers and small teams preparing an App Store listing.
- **Deployment:** static site (Vite build output) hosted on GitHub Pages, Netlify, Cloudflare Pages, or similar. No server component. The app must function when opened from `file://` as well, though this is not a supported path.
- **Browsers:** latest two versions of Chrome, Safari, Firefox, and Edge on desktop (macOS, Windows, Linux). Minimum viewport width 1024 px. Below that, show a "Bezel needs a wider window" notice rather than a broken layout.

---

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | React 19 + TypeScript | Strict mode, `noUncheckedIndexedAccess` |
| Build | Vite | Static output to `dist/` |
| State | Zustand with `zundo` middleware for undo/redo | Single store; temporal middleware tracks only project state, not UI state |
| Persistence | IndexedDB via `idb` | Two object stores: `projects` (JSON) and `assets` (Blobs) |
| Rendering | Canvas 2D API, `OffscreenCanvas` where available | One pure render function used for preview, thumbnails, and export |
| ZIP | `fflate` | Streaming zip of PNG blobs, no worker needed at 10 files |
| Drag and drop | `@dnd-kit/sortable` | Filmstrip reordering |
| Color picker | `react-colorful` | Small, no deps |
| Styling | CSS modules + CSS variables | Editor follows `prefers-color-scheme` |
| Fonts | Three bundled variable `.woff2` families, self-hosted, registered via the `FontFace` API | Inter, Plus Jakarta Sans, Source Serif 4; latin + latin-ext subsets from Google Fonts, committed to the repo under OFL. Never fetched from a CDN |
| Testing | Vitest for pure modules (layout, text fitting, model), Playwright for one export smoke test | Render function tested by golden-image comparison at reduced scale |

No runtime network requests of any kind. A CI check greps the build output for `http://` and `https://` in script, CSS and HTML and fails if any are found (except source-map comments and license headers). HTML is scanned so a `<link>` to a font or script host cannot slip past — which is why the bundled fonts are committed rather than loaded from Google's CDN.

---

## 4. Output specification

- **Canvas size:** 1320 × 2868 px, portrait, sRGB, PNG, no alpha (composited onto the background; alpha channel fully opaque).
- **Set size:** 1 to 10 slots. A standalone slide occupies 1 slot. A panoramic pair occupies 2 slots.
- **Panoramic pair:** rendered on a single 2640 × 2868 canvas and then split into two 1320 × 2868 PNGs, left half and right half.
- **File naming:** `01.png` … `10.png` in filmstrip order. A pair produces two consecutive numbers. The ZIP is named `<project-name-slug>-iphone-6.9.zip`.
- **Single slide download:** the same filename as it would have in the set, e.g. `03.png`. For a pair, "Download" produces both halves, two separate downloads.

Only the 6.9" size is produced. App Store Connect scales 6.9" assets to the smaller iPhone size classes automatically when those are not uploaded.

---

## 5. Data model

All IDs are UUID v4 strings. Everything below is JSON-serializable. Screenshot pixels live in the `assets` object store and are referenced by `assetId`.

```ts
type ProjectMeta = {
  id: string
  name: string
  createdAt: number   // epoch ms
  updatedAt: number
  schemaVersion: 3
}

type Project = ProjectMeta & {
  theme: Theme
  items: SlideItem[]      // ordered; sum of slot widths ≤ 10
}

type Theme = {
  background: Background
  font: FontId                     // set-level, like the bezel finish
  headline: TextStyle
  subheadline: TextStyle
  bezel: { finish: BezelFinish; shadow: boolean }
}

type FontId = 'inter' | 'jakarta' | 'sourceSerif'

type Background =
  | { kind: 'solid'; color: string }                              // hex
  | { kind: 'linear'; angle: number; stops: GradientStop[] }      // angle in degrees, 0 = bottom→top
  | { kind: 'radial'; stops: GradientStop[] }                     // centered

type GradientStop = { offset: number; color: string }             // offset 0..1

type TextStyle = {
  size: number                     // px at 1320×2868; headline default 96, subheadline default 56
  weight: 400 | 500 | 600 | 700
  color: string
  align: 'left' | 'center' | 'right'
}

type BezelFinish = 'black' | 'white' | 'blue' | 'orange'

type SlideItem = Slide | Pair

type Slide = {
  kind: 'slide'
  id: string
  template: SlideTemplateId  // 'textTop' | 'textBottom' | 'deviceOnly' | 'tilted'
  screenshot: ScreenshotRef | null
  headline: string          // may be empty; ignored by deviceOnly
  subheadline: string
  device: { scale: number; offsetY: number }   // scale 0.8..1.25, offsetY in px, clamped by template
  textNudge: { offsetY: number }               // px, clamped by template
  tilt?: TiltDirection                         // tilted templates only; absent = 'left'
  overrides: Partial<Pick<Theme, 'background' | 'headline' | 'subheadline'>>
}

type Pair = {
  kind: 'pair'
  id: string
  template: PairTemplateId  // 'panorama' | 'panoTilted'
  screenshot: ScreenshotRef | null
  headline: string          // left slide; either side may be empty
  subheadline: string
  headlineRight: string     // right slide
  subheadlineRight: string
  device: { scale: number; offsetY: number }
  textNudge: { offsetY: number }       // left slide
  textNudgeRight: { offsetY: number }  // right slide
  tilt?: TiltDirection                 // panoTilted only; absent = 'left'
  overrides: Partial<Pick<Theme, 'background' | 'headline' | 'subheadline'>> & { headlineRight?: TextStyle; subheadlineRight?: TextStyle }
}

type TiltDirection = 'left' | 'right'

type WidgetKind = 'lockActivity' | 'island'
type WidgetMode = 'none' | WidgetKind
type WidgetCrop = { kind: WidgetKind; x: number; y: number; w: number; h: number; radius: number }  // stored-screenshot px
type WidgetState = { mode?: WidgetMode; crop: WidgetCrop | null; screen?: 'screenshot' | 'placeholder'; placeholderColor?: string | null; scale: number | null; offsetY: number; notFound: boolean }
// Items carry an optional `widget?: WidgetState`; absent, or with mode 'none', means no Live Activity.

type ScreenshotRef = {
  assetId: string
  width: number            // stored (possibly downscaled) dimensions
  height: number
  originalWidth: number
  originalHeight: number
  fileName: string
}
```

Rules:

- `overrides` holds only keys the user has explicitly overridden on that slide. Clearing an override deletes the key. The resolved style is `{ ...theme[key], ...overrides[key] }` for text styles and `overrides.background ?? theme.background` for background.
- Bezel finish, shadow and font are set-level only. No per-slide override. The font is deliberately not part of `TextStyle`: an override snapshots the whole resolved style, so a slide whose size had once been customised would otherwise keep the old family when the set's font changed.
- `device.scale` and both `offsetY` values are clamped by the template's limits at render time as well as in the UI, so a corrupt or hand-edited project cannot produce an off-canvas device. `widget.scale` and `widget.offsetY` are clamped the same way, against the shared widget limits (§6.3).
- `tilt` and `widget.mode` are options that cut across the template axis: every item stores them, and a template that does not use one ignores it. Switching template therefore never discards either, the same way text survives a switch to `deviceOnly`.

---

## 6. Templates

Templates are code, not data. Each template is a TypeScript module exporting a `layout(ctx: LayoutInput): LayoutOutput` function plus its limits. Templates never draw; they return geometry that the renderer draws.

A template describes a **layout** and nothing else. Two things that read like layouts are options on top of one instead, available on every template: the tilt direction (§6.1, on the tilted templates) and the Live Activity cut-out (§6.3, on all of them). The single entry point is `layoutItem(input)` in the registry: it calls the template's own `layout`, then merges the widget overlay if the item has one, so no template has to know about the widget beyond leaving room for it.

```ts
type LayoutInput = {
  canvasW: number; canvasH: number     // 1320×2868 or 2640×2868
  slide: Slide | Pair
  resolvedTheme: Theme
  screenshotSize: { w: number; h: number } | null
  measureText: (text: string, style: TextStyle, maxWidth: number) => TextMetricsResult
}

type LayoutOutput = {
  device: { x: number; y: number; w: number; h: number; rotation: number } | null   // frame bounding box before rotation, rotation about center
  headline: TextBlock | null
  subheadline: TextBlock | null
}

type TextBlock = {
  x: number; y: number; w: number       // slot box; y is top of first line
  lines: string[]
  style: TextStyle                      // style after auto-shrink
  shrunk: boolean
}

type TemplateDef = {
  id: string
  name: string
  slots: 1 | 2
  hasText: boolean
  hasTilt: boolean          // reads item.tilt, so the inspector offers a direction control
  limits: {
    scale: [number, number]
    deviceOffsetY: [number, number]
    textOffsetY: [number, number]
  }
  layout: (input: LayoutInput) => LayoutOutput
}
```

### 6.1 Single-slide templates

**textTop — "Text top, device bottom"**
- Headline slot: top padding 200 px, horizontal padding 120 px, max 3 lines.
- Subheadline slot: 32 px below headline, max 3 lines.
- Device: frame width = 1080 × scale, centered horizontally, top edge placed 140 px below the subheadline bottom (or headline bottom if subheadline empty). The bottom of the device is intentionally cropped by the canvas edge.
- Limits: scale 0.85–1.15, deviceOffsetY −200…+300, textOffsetY −80…+120.

**textBottom — "Text bottom, device top"**
- Inverse of textTop: the text block is anchored so its bottom sits 200 px above the canvas bottom; the device (frame width 1080 × scale) hangs from the top edge with its bottom edge 140 px above the text. Top of the device is cropped.
- Limits: scale 0.85–1.15, deviceOffsetY −300…+200, textOffsetY −120…+80.

**deviceOnly — "Device centered"**
- No text slots. Headline/subheadline fields are hidden in the inspector.
- Device fully visible, frame height = 2868 − 2 × 180 px padding at scale 1, centered.
- Limits: scale 0.7–1.0, deviceOffsetY −120…+120, textOffsetY n/a.

**tilted — "Device tilted"**
- Device rotated 12°, anchored so its rotated bounding box extends past the bottom edge and past the side it leans towards. Frame width = 1180 × scale.
- Headline slot in the opposite top corner: 120 px from that side, top padding 200, width 900, max 3 lines. Subheadline below it, max 2 lines.
- `tilt` picks the direction and the two are exact mirrors. `left` (the default, and what every item saved before the option carries) rotates −12° — counter-clockwise, top leaning left — overhangs the right and bottom edges, and puts the text top-left. `right` rotates +12°, overhangs the left and bottom edges, and puts the text top-right.
- Limits: scale 0.9–1.2, deviceOffsetY −150…+250, textOffsetY −80…+120.
- The angle itself is fixed by the template. Only the direction is user-controlled.

### 6.2 Panoramic pair templates

Both render on a 2640 × 2868 canvas.

Every pair has a text slot on each slide: `headline` / `subheadline` for the left, `headlineRight` / `subheadlineRight` for the right. To put text on one side only, leave the other side empty. Each side has its own text styles. The left side overrides the set theme (`overrides.headline` / `subheadline`); the right side overrides the left (`overrides.headlineRight` / `subheadlineRight`), so until it is customised the right side follows the left. Customising the right side starts from the left side's current style, so for example the left can be left-aligned and the right right-aligned. Each side also has its own vertical text offset (`textNudge` for the left, `textNudgeRight` for the right), clamped to the template's textOffsetY limits. A pair saved before the offsets were split gets a right offset equal to its old shared one when loaded, so nothing moves.

**panorama — "Panorama"**
- Text slots: left x=120, right x=1440, y=260, width 1080, headline max 4 lines, subheadline max 3.
- Device frame width = 1500 × scale, centred on x = 1320 (the seam), bottom cropped by the canvas edge. Top edge at y = 720, or 100 px below the lower of the two text blocks if that is further down, plus deviceOffsetY.
- Limits: scale 0.85–1.1, deviceOffsetY −200…+300, textOffsetY −100…+200.

**panoTilted — "Tilted panorama"**
- Device frame width 1400 × scale, rotated about its centre on the seam, with its rotated bounds overhanging the canvas bottom by 1000 px. `tilt` picks the direction: −12° (top leaning left, the default) or +12°.
- Text slots are mirror images, 120 px from the outer edge and 200 px from the seam, whichever way the device leans: left x=120, right x=1520, y=260, width 1000, headline max 3 lines, subheadline max 2.
- Limits: scale 0.85–1.1, deviceOffsetY −200…+300, textOffsetY −100…+200.

The background gradient is evaluated over the full 2640-wide canvas, so it is continuous across the seam. Text never crosses the seam.

### 6.3 The Live Activity option

Any template, single or pair, can lift a Live Activity off the screen. `widget.mode` picks which — `none`, `lockActivity` (the lock-screen card) or `island` (the expanded Dynamic Island) — and the rest of `WidgetState` applies to whichever is chosen. The cut-out is a rounded crop of the same screenshot (see §7.6), so no second asset is stored.

- **Geometry.** The crop is mapped into the device's screen area and drawn again on top with a drop shadow, enlarged around its own centre (default 1.35×, limits 1–2, capped so it keeps 60 px side margins on the canvas) so it overshoots the bezel. The overshoot is the emphasis. `widget.offsetY` (−400…+400) nudges it along the device's own vertical axis before any rotation. On a rotated device the cut-out turns with it: the rect is computed in the device's unrotated frame, then rigidly rotated about the device centre, so it stays flat on the screen.
- **Room for the overshoot.** Templates that anchor the device against their text account for how far the enlarged cut-out pokes past the device's edges: `textTop` and `panorama` drop the device by the top overshoot, `textBottom` lifts it by the bottom overshoot. The gap between text and cut-out is then the same as the gap between text and device would have been. `deviceOnly` and the tilted templates place the device without regard to it; their offset slider covers the rest.
- **Screen behind the widget** (`widget.screen`): `screenshot` shows the screenshot dimmed 35% black; `placeholder` draws a stand-in lock screen (lockActivity) or home screen (island) and anchors the cut-out at the standard iOS position on the 1320×2868 screen: the card full width with 14 pt margins and its bottom at 85.3% of the height; the island 94.8% wide, 1.2% from the top. The home-screen placeholder is deliberately recessive: a blue-to-plum wallpaper with the icon grid, page dots and dock blurred (about 20 px, drawn as offset shadows so every browser renders it the same), and a sharp status bar with the time, signal, Wi-Fi and battery. Each placeholder takes an optional base colour per slide (`widget.placeholderColor`); without one the designed palette is used. A custom colour drives a three-stop gradient with small hue and lightness shifts (lighter and slightly cooler at the top, slightly warmer below), and when the colour is light (relative luminance above 0.4) the icons, status bar and lock-screen text switch to dark ink.
- **Crop kind.** `widget.crop.kind` records which kind the stored crop belongs to. A crop that does not match the selected mode is ignored — nothing is drawn and the inspector says "Not detected yet" — until detection runs again, which switching the mode does automatically when there is a screenshot.

---

## 7. Rendering pipeline

One pure function renders everything:

```ts
renderItem(target: CanvasRenderingContext2D, item: SlideItem, theme: Theme, assets: AssetLookup, scale: number): RenderReport
```

`scale` is the ratio between the target canvas and the logical canvas (1 for export, ~0.3 for preview, ~0.08 for thumbnails). The function applies `ctx.scale(scale, scale)` once and then draws in logical 1320 × 2868 coordinates. All measurements, shadows, and line widths are expressed in logical pixels so preview and export agree.

`RenderReport` carries non-fatal findings for the UI: `{ textShrunk: boolean; screenshotAspectMismatch: boolean; missingScreenshot: boolean }`.

### 7.1 Draw order

1. Background (solid, linear, or radial gradient) over the full canvas.
2. Device shadow, if enabled: drawn as the frame silhouette path filled black with `shadowBlur: 60`, `shadowOffsetY: 30`, alpha 0.35, all in logical px.
3. Screenshot, clipped to the screen path (rounded rect with the frame's corner radius), cover-fitted and center-cropped.
4. Frame body (the bezel SVG for the selected finish), drawn over the screenshot.
5. Dynamic Island overlay, part of the frame asset.
6. Headline, then subheadline.

For the tilted template, steps 2–5 happen inside a `save / translate / rotate / restore` block around the device center.

### 7.2 Preview strategy

- The full-res render runs on an `OffscreenCanvas` (fallback: a detached `<canvas>`) at scale 1 for the selected item only, debounced at 40 ms after the last edit. The visible preview canvas then does a single `drawImage` scaled to fit the viewport. This guarantees WYSIWYG including text wrapping, since wrapping is measured at scale 1.
- Slider drags (scale, offset, size) render at preview scale directly during the drag for responsiveness, then trigger one full-res render on release.
- Thumbnails render at scale 0.08 on state commit, not during drags. Thumbnails of the selected item update after the debounced full-res render completes.

### 7.3 Text measurement and wrapping

- Font family: one of three bundled variable families, chosen per set by `theme.font` — Inter (the default), Plus Jakarta Sans, Source Serif 4. Each resolves to its own family followed by the old system stack, so a face that fails to load still renders. The files are self-hosted `.woff2` (latin and latin-ext subsets), so the same project measures and exports identically on every machine — a system stack resolved to SF Pro on macOS, Segoe UI on Windows and Roboto on Linux, which changed wrapping, auto-shrink and device placement with the operating system.
- Every family covers weights 400–700, the range the Weight control offers, so no weight is ever synthesised as a faux bold.
- The faces are declared in `src/assets/fonts/fonts.ts` and registered at startup through the `FontFace` API rather than a stylesheet, so family names, weight ranges, subset ranges and file paths live in exactly one place and cannot drift between CSS and TypeScript. Before the first render the app awaits `fontsReady`, which loads every face and resolves when all have settled. Waiting on `document.fonts.ready` instead would not be enough: it only waits for faces something has actually requested, and a weight used only on the canvas is never requested by the DOM, so the first render would silently measure against the fallback's metrics. A face that arrives after the 1 s ceiling triggers a re-render through the `loadingdone` event.
- The drawn lock and home placeholders (§6.3) always use Inter, whatever the set's font: they imitate iOS chrome, so their clock and status bar must not move with the project's font either.
- Wrapping: greedy word wrap using `ctx.measureText`. A single word wider than the slot is broken by character.
- Line height: 1.15 × font size. Paragraph gap between headline and subheadline: fixed per template.
- Explicit newlines in the input are honored as hard breaks.

### 7.4 Auto-shrink

If wrapped text exceeds the slot's max line count, reduce the font size by 4 px and re-wrap, repeating until it fits or until size reaches 55% of the requested size. If it still does not fit at the floor, render at the floor, truncate to the max line count, and set `textShrunk` and mark the last line with an ellipsis. The UI shows "Text was shrunk to fit" beneath the text field and a small badge on the thumbnail.

### 7.6 Live Activity detection

Detection locates the Live Activity in the screenshot with pure pixel heuristics, run on import, on choosing a Live Activity mode, or on demand:

- **Expanded Dynamic Island:** flood-fill near-black pixels (all channels < 40) from the pill's expected centre near the top; the bounding box is the crop. Rejected unless it is at least half the width, 4–40% of the height, within the top 10%, and at least 60% filled. The corner radius is measured from the fill: the first row where the black region reaches the box's left edge is one radius below the top.
- **Lock-screen card:** iOS keeps the card full width with fixed side margins. A column just inside the margin is compared with one in the margin: rows where the inside column is flat and differs from the wallpaper are card rows. The longest plausible run (5–25% of the height, in the lower 35–97%) wins; edges are then refined outward in several columns clear of the rounded corners.

The result is stored on the item as `widget.crop` in stored-screenshot pixels with a corner radius. A miss sets `widget.notFound` and shows a toast; the inspector offers "Detect" and "Adjust…", the latter opening a sheet with a draggable, resizable crop box, numeric fields, and a "Detect again" button.

### 7.5 Screenshot fitting

- Screen area aspect ratio in the frame asset is 1320 : 2868 (0.4603).
- Cover-fit: scale so the image covers the screen area, then center-crop. If `|imageAspect − screenAspect| / screenAspect > 0.01`, set `screenshotAspectMismatch`. The UI shows a warning badge on the thumbnail and a message in the inspector: "This screenshot is W×H. It will be cropped to fit the 6.9" screen."
- Image smoothing is enabled with `imageSmoothingQuality: 'high'` when downscaling.
- No screenshot: draw the screen area as a neutral checkerboard-free 12% grey with a centered "Drop screenshot" label on the preview only. On export, the screen area is solid black and `missingScreenshot` is reported; the export dialog warns before proceeding.

---

## 8. Bezel asset

- A single hand-authored SVG approximating the iPhone 17 Pro, drawn for this project and licensed with the repository. It is not an Apple asset.
- Canonical size: frame bounding box 1436 × 2984 logical px containing a screen area of 1320 × 2868 with corner radius 176 px, centered behind a uniform 44 px bezel, so that at device scale 1 in a template the screenshot is not upscaled.
- The asset is structured as layers: `frame-body`, `screen-cutout` (used only to derive the clip path), `dynamic-island`, `buttons`, `highlights`. Finish colors are applied via CSS custom properties inside the SVG (`--body`, `--edge`, `--highlight`). Four finishes: black, white, blue, orange. Each finish is a set of three colors defined in code.
- At load, the SVG is instantiated once per finish as an `Image` from a Blob URL and cached. Screen path geometry (rect + radius) is stored as constants in code, not parsed from the SVG, so rendering does not depend on SVG DOM parsing.
- Rendering the SVG through `drawImage` at 1436 px width produces crisp edges; the asset must not contain raster or filter elements that Canvas ignores. Shadows are drawn by the renderer, not baked into the SVG.

---

## 9. Editor UI

Three-region layout, all in one screen once a project is open:

```
┌──────────────────────────────────────────────────────────────┐
│ Top bar: ‹ Projects   Project name (editable)     Export ▾    │
├───────────┬────────────────────────────────┬─────────────────┤
│ Filmstrip │           Preview              │   Inspector      │
│ (vertical,│   selected slide/pair centered │   Slide tab      │
│  thumbs)  │   fit-to-height, zoom off      │   Theme tab      │
│           │                                │                  │
│  + Add    │                                │                  │
└───────────┴────────────────────────────────┴─────────────────┘
```

### 9.1 Projects screen

- Grid of project cards: name, thumbnail of the first slide, slot count, last edited. Actions: open, rename, duplicate, delete (confirm dialog), sorted by `updatedAt` desc.
- "New project" creates a project named "Untitled N" with one empty `textTop` slide and opens it.
- Empty state: a short three-line explainer and a "New project" button. Also accepts dropped image files: dropping creates a project and one slide per file.

### 9.2 Filmstrip

- Vertical list of thumbnails, numbered with the export number(s) they will receive. Pairs show as one thumbnail twice as wide, labelled "3–4".
- Drag to reorder with `dnd-kit`. A pair moves as one unit.
- Hover actions: duplicate, delete. Delete does not confirm because undo covers it. Duplicating when the result would exceed 10 slots is disabled with a tooltip.
- "+ Add" opens a layout chooser popover with a preview tile per template. Options that cut across templates — tilt direction, Live Activity — are not in the chooser; they are set on the slide afterwards. Adding a pair when fewer than 2 slots remain is disabled.
- Slot counter "7 / 10" in the filmstrip footer.
- Multi-file drop onto the filmstrip appends one `textTop` slide per file, stopping at 10 with a toast "Only the first N screenshots were added, the set is full."

### 9.3 Preview

- Renders the selected item fit-to-height with 32 px margin. For a pair, the seam is shown as a 1 px dashed guide on the preview only.
- Drop target for a single screenshot: replaces the selected item's screenshot.
- No direct manipulation on the canvas in v1. All adjustment happens in the inspector.

### 9.4 Inspector — Slide tab

Sections, top to bottom:

1. **Template** — segmented control of the compatible layouts (slides show the four slide templates, pairs show the two pair templates). Changing the template preserves text, screenshot, tilt direction and Live Activity, and clamps offsets to the new limits. On a tilted template a **Direction** row follows, Left / Right.
2. **Screenshot** — thumbnail, file name and dimensions, Replace and Remove buttons, aspect-mismatch warning when applicable.
3. **Text** — headline textarea (multi-line, max 200 characters), subheadline textarea (max 300). Hidden for `deviceOnly`. Each has an "Override style" toggle; when on, reveals size slider (40–200 px), weight segmented control, color picker, alignment segmented control, and a "Reset to theme" link. A "shrunk to fit" hint appears under the field when reported.
4. **Device** — scale slider and vertical offset slider, ranges taken from the template limits. "Reset" link.
5. **Live Activity** — a Lift control (None / Lock / Island), present on every template. With a kind chosen it reveals the crop status row with Detect and Adjust…, the Screen control, the placeholder Colour row, and Scale and Offset sliders (§6.3).
6. **Text position** — vertical offset slider within template limits.
7. **Background override** — toggle; when on, shows the same background editor as the Theme tab, scoped to this slide.

### 9.5 Inspector — Theme tab

1. **Background** — kind selector (solid / linear / radial); color picker for solid; for gradients, 2–4 stops with color and offset, angle dial for linear.
2. **Font** — one tile per bundled family, each tile's sample and name set in that family so the control shows the choice rather than naming it. Applies to every slide in the set.
3. **Headline style** and **Subheadline style** — size, weight, color, alignment.
4. **Bezel** — finish swatches (4), shadow toggle.

Changing the theme re-renders all thumbnails.

### 9.6 App Store preview

"Preview" in the top bar opens a full-screen, read-only mock of an App Store product page: a placeholder icon and the project name above a horizontal strip of every exported slot, each rendered at the same scale with App Store corner radius and a 12 px gap. Pairs appear as two adjacent slots so the panorama reads as it will in the store. Done or Escape closes it.

### 9.6 Export menu

- "Download this slide" — PNG(s) of the selected item.
- "Download all as ZIP" — renders each item sequentially at scale 1, shows a progress bar with "Rendering 4 of 10", then triggers the ZIP download. If any item has no screenshot, a confirm dialog lists which numbers are affected before rendering starts.
- Rendering happens on the main thread with `await` yields between items so the progress bar paints. At 10 items of 1320 × 2868 this is expected to take under 3 s on a 2020-era laptop.

### 9.7 Keyboard shortcuts

| Keys | Action |
|---|---|
| ⌘Z / ⌃Z | Undo |
| ⌘⇧Z / ⌃Y | Redo |
| ↑ / ↓ | Select previous / next item in the filmstrip (when focus is not in a text field) |
| ⌘D | Duplicate selected item |
| ⌫ | Delete selected item (when focus is not in a text field) |
| ⌘E | Download all as ZIP |
| ⌘S | No-op with a brief "Autosaved" toast, to reassure habitual savers |

### 9.8 Visual design of the editor

- Follows `prefers-color-scheme`. Neutral greys, one accent color. The preview area uses a mid-grey backdrop so both light and dark slide backgrounds read correctly.
- All controls have visible labels or `aria-label`. Sliders show their numeric value and accept keyboard arrows.

---

## 10. Persistence

### 10.1 IndexedDB layout

Database `bezel`, version 1.

- `projects` store, key `id`. Value: `Project` JSON.
- `assets` store, key `assetId`. Value: `{ blob: Blob; projectId: string; width: number; height: number }`.

### 10.2 Autosave

- Every committed state change (not intermediate slider drags) schedules a write, debounced 500 ms, writing the whole project JSON. Writes are serialized so a slow write never races a newer one.
- Screenshot import writes the asset first, then the project referencing it, so a crash between the two leaves at most an orphan asset.
- On project open, the app loads the JSON, then loads all referenced assets into memory as `ImageBitmap`. Missing assets (e.g. cleared by the browser) render as "missing screenshot" with a toast.
- Deleting a project deletes its assets. On startup, a sweep deletes assets whose `projectId` no longer exists.

### 10.3 Screenshot import processing

- Accepted types: PNG, JPEG, WebP. HEIC and others are rejected with "Bezel can't read this format. Export as PNG from Photos or Simulator."
- Decoded via `createImageBitmap`. If decoding fails, the same message is shown.
- If the image is larger than 2868 px on its longest side (the native 6.9" height, so a native screenshot is stored untouched), it is downscaled to that bound with high-quality smoothing and re-encoded as PNG before storing. Original dimensions are kept in `ScreenshotRef` for the inspector label.
- Max file size 40 MB. Larger files are rejected with a message.
- Storage quota: if a write throws `QuotaExceededError`, the import is rolled back and the user is told to delete other projects.

### 10.4 Undo/redo

- The `zundo` temporal store tracks the `Project` object only. Selection, tab, and dialog state are not undoable.
- Slider drags are batched: history entries are created on pointer-up, not on every change.
- History is capped at 100 entries and is session-scoped. It is not persisted.
- Asset blobs are not part of history. Undoing a screenshot removal restores the `ScreenshotRef`; the blob still exists in IndexedDB because assets are only garbage-collected on project delete or on the startup sweep. This means a removed screenshot's blob lingers until the project is deleted, which is accepted for v1.

### 10.5 Schema migration

`schemaVersion` is checked on load and older projects are upgraded through a chain of `migrate_N_to_N+1` steps. The current version is 4. An unknown higher version shows "This project was made with a newer version of Bezel."

- **v1 → v2:** pairs gain a text slot on each slide. The v1 templates "Text left" (`panoLeftText`) and "Text right" (`panoRightText`) merge into `panorama`. Text from "Text right" and "Tilted right" moves into the right-hand fields, so every existing pair renders as before.
- **v2 → v3:** Lock, Island and tilt direction stop being templates and become options. `lockActivity` and `island` become `textTop` with `widget.mode` set to the kind they were, keeping the crop and every widget setting; those slides adopt textTop's device width (1080 rather than 1000), so they render slightly larger than before. `panoTiltedRight` becomes `panoTilted` with `tilt: 'right'`, and `tilted` / `panoTilted` gain `tilt: 'left'` — both render exactly as before.

- **v3 → v4:** the font moves from the machine into the project. `theme.font` is added, defaulting to `inter`, so existing projects change face once — they were previously drawn in whatever the OS resolved from a system stack.

A font id this build does not recognise is replaced on load with the default, and a template id this build does not recognise is replaced with the default for that item's width (`textTop` for a slide, `panorama` for a pair) rather than failing the whole project.

Project listings migrate each record for display and skip ones they cannot read. The orphan-asset sweep works from raw stored project ids, so a project this build cannot read never has its screenshots deleted.

---

## 11. Edge cases and error handling

| Situation | Behavior |
|---|---|
| Set is full (10 slots) | "Add" and "Duplicate" disabled with tooltip; drop is truncated with a toast |
| Only 1 slot left, user wants a pair | Pair templates disabled in chooser with tooltip "Needs 2 free slots" |
| Converting a pair to a slide or vice versa | Not supported. Template control only shows same-slot-width templates |
| Switching template `textTop` → `deviceOnly` | Text is preserved in the model, hidden in the UI, and restored if switched back |
| Switching template with a Live Activity or tilt direction set | Both are options, not template state: they are preserved and keep applying wherever the new template uses them |
| Live Activity mode switched to the other kind | The stored crop no longer matches, so nothing is drawn and detection re-runs for the new kind if there is a screenshot |
| Headline is empty | Slot is omitted; subheadline moves up into the headline position in `textTop`/`tilted`/pano templates |
| Both text fields empty on a text template | Device placement uses the position it would have with a one-line headline, so slides stay visually aligned across the set |
| A bundled font fails to load | One face failing does not block the others; text is drawn in the system stack behind that family, and if the face arrives later `loadingdone` triggers a re-render and the text re-wraps |
| Text contains a character outside latin and latin-ext | Falls back to the system stack for those glyphs only. Both subsets are preloaded up front, so this does not happen mid-typing for European copy |
| Screenshot with alpha | Composited over black inside the screen area |
| Screenshot smaller than screen area | Upscaled with smoothing; inspector shows "Low resolution: W×H, may look blurry" when the stored width is under 1000 px |
| Very wide image (landscape) dropped | Cover-fit still applies; mismatch warning shown |
| Deleting the last item | Allowed; the preview shows an empty state with an "Add slide" button |
| Two projects with the same name | Allowed; IDs are unique. ZIP names collide only in the download folder, which the browser handles |
| Browser without `OffscreenCanvas` (older Safari) | Falls back to a detached `<canvas>`; behavior is identical |
| `canvas.toBlob` returns null | Export aborts with "Export failed, try a smaller set" and the console logs the item id |
| IndexedDB unavailable (private mode in some browsers) | App runs in memory-only mode with a persistent banner "Autosave is unavailable in this browser mode" |
| Window narrower than 1024 px | Full-screen notice; the project is not loaded, so nothing is at risk |
| A bundled face never finishes loading | `fontsReady` resolves after a 1 s timeout regardless and the render proceeds on the fallback stack |
| User pastes an image (⌘V) with the editor focused | Treated like a drop onto the selected item |

---

## 12. Performance budgets

- Initial bundle under 300 KB gzipped, excluding the bezel SVGs (~4 × 40 KB) and the bundled fonts (~280 KB of `.woff2` across three families × two subsets; the browser fetches only the subsets a set's text needs).
- Full-res render of one slide under 60 ms on an M1 MacBook Air, under 150 ms on a 2019 Intel laptop.
- Preview updates within one frame after the debounce for typing; sliders track at 60 fps at preview scale.
- Peak memory for a full 10-slot project with 2868 px-bound screenshots under 400 MB.

---

## 13. Project structure

```
src/
  app/            routing between Projects screen and Editor, global providers
  assets/         bezel finishes, bundled font files + registry, licences
  model/          types, defaults, migrations, clamping helpers (pure)
  store/          zustand store, temporal middleware, persistence bridge
  persistence/    idb wrappers, asset import pipeline, GC sweep
  templates/      one module per template, the widget option, + registry
  render/         renderItem, text wrapping, auto-shrink, background, bezel drawing
  assets/bezel/   frame SVG source and finish definitions
  ui/
    projects/     project grid and cards
    editor/       top bar, filmstrip, preview, inspector
    controls/     slider, color picker wrapper, segmented control, gradient editor
  export/         PNG encoding, ZIP assembly, download helpers
tests/
  render/         golden images at scale 0.25
  templates/      layout unit tests
  model/          clamping and migration tests
```

---

## 14. Decision log and tradeoffs

Each row records a decision made during the interview and what was given up.

| Decision | Alternative rejected | Tradeoff accepted |
|---|---|---|
| Canvas 2D rendering with one render function for preview and export | DOM + html-to-image; SVG foreignObject | More hand-written layout code and no CSS for the slide itself. In exchange, exact pixel output and no font-rendering surprises between preview and export |
| Full-res offscreen render, scaled down for preview | Render at preview scale, full-res only on export | Higher CPU per edit, mitigated by debounce and drag-time preview-scale rendering. Guarantees identical wrapping and shrink decisions |
| Three bundled open fonts, self-hosted | System font stack; Google Fonts over their CDN | 280 KB of `.woff2` in the bundle, and a curated three rather than any font the user owns. In exchange, one project exports identically on every machine — the system stack resolved to SF Pro on macOS, Segoe UI on Windows and Roboto on Linux, changing wrapping and device placement with the OS. Self-hosting rather than the CDN keeps the zero-network guarantee and means an export never depends on being online |
| Hand-drawn SVG bezel | Apple Design Resources PNGs | Less photorealistic. Fully redistributable, trivially recolorable, scales without artifacts |
| Single device model (iPhone 17 Pro approximation) | Multiple models and sizes | Users cannot match a specific phone. One asset keeps the design consistent and the bundle small |
| 6.9" export only | Also 6.5" and legacy sizes | Relies on App Store Connect downscaling. Users needing pixel-tuned legacy sizes are out of scope |
| Fixed templates with nudge controls | User-defined templates; free positioning | Less flexibility. Every output stays within a layout that is known to look right |
| Templates as code, not data | JSON template format | Adding a template needs a code change. Avoids designing and versioning a layout DSL before there is demand |
| Pair = one unit occupying 2 slots | Two linked slides | Cannot unlink or edit halves separately. Simpler model, no partial-pair states to handle |
| Bezel finish set-level only | Per-slide finish | Mixed finishes in one set are impossible, which is almost always what you want anyway |
| Cover-fit + warning for mismatched screenshots | Reject non-matching sizes; contain with letterbox | Some content may be cropped. Never blocks the user, and the warning makes the crop discoverable |
| Auto-shrink with a 55% floor and ellipsis | Wrap and overlap; wrap with warning only | The user's chosen size may be silently reduced. The hint and thumbnail badge make it visible |
| IndexedDB autosave, multiple projects | Explicit project file; single project | No portable project file in v1. Moving work between browsers is not possible. Export/import is the second candidate for v1.1 |
| Undo history session-only, blobs not tracked | Persisted history | Refresh clears undo. Removed screenshot blobs linger until project deletion |
| Zero network, no analytics | Privacy-friendly page analytics | No usage data at all. The privacy claim becomes a marketable feature and a CI-enforced invariant |
| Desktop evergreen browsers only | PWA; iPad support | Not installable, not offline after a cache eviction, not usable on a tablet |
| Cap at 10 slots | Warn above 10 | Cannot prepare more variants than Apple accepts and choose later |

---

## 15. Open questions

None blocking. Items deferred to after v1, in suggested priority order:

1. Bundle one open-licensed font (e.g. Inter) so output is identical across operating systems.
2. Project export/import as a `.bezel` ZIP (JSON + assets).
3. Additional templates: text bottom / device top; two devices side by side; device with a caption bubble.
4. 6.5" export, produced by re-rendering the same layout at 1284 × 2778.
5. Localization: per-locale text variants and per-locale export folders.
6. A free rotation angle for the tilted templates; the direction is already an option.

---

## 16. Milestones

1. **Model and render core** — types, defaults, templates, `renderItem`, bezel asset, golden tests. Deliverable: a script that renders a hard-coded project to PNG.
2. **Editor shell** — projects screen, filmstrip, preview, inspector, undo/redo, keyboard shortcuts. In-memory only.
3. **Persistence** — IndexedDB autosave, asset import pipeline, GC sweep, quota handling.
4. **Export** — single PNG, ZIP, progress, missing-screenshot confirm.
5. **Polish and release** — empty states, warnings, dark mode pass, performance check against section 12 budgets, network-free CI check, README, deploy.
