# Bezel

Bezel is a free, fully client-side web app for producing App Store screenshot sets for iPhone. Drop raw screenshots, pick a built-in layout per slide, write a headline, and export a numbered set of PNGs at the App Store 6.9" size (1320 × 2868).

- Six locked layouts: text top, text bottom, device only and tilted for a single slide, plus two panoramic pair layouts that render one device across two adjacent slides, straight or tilted, with text on either slide. Tilted leans either way, and any layout can lift a Live Activity — the lock-screen card or the expanded Dynamic Island, cut out of the screenshot automatically — off the screen.
- Type set in one of three bundled fonts — Inter, Plus Jakarta Sans or Source Serif 4 — chosen per set. The files ship with the app, so a project exports identically on any machine instead of picking up whatever font the operating system happens to resolve.
- Realistic vector iPhone bezel in four finishes, with optional drop shadow.
- Set-level theme (background, font, text styles, bezel) with per-slide overrides that are shown as overrides.
- Auto-shrinking headlines, cover-fit screenshots with crop warnings, a hard cap of 10 slots.
- Autosave to IndexedDB, multiple named projects, full undo/redo.
- Zero network. Screenshots never leave the browser, fonts are bundled rather than fetched, and the build is checked for external URLs in scripts, stylesheets and HTML.

`SPEC.md` describes what the app does. `DESIGN.md` describes how it looks and behaves.

## Development

```
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest, pure modules only
npm run build      # tsc + vite build, then the no-network check
npm run preview
```

Requires Node 20+. Desktop browsers only, minimum viewport width 1024 px.

## Deploying

`npm run build` writes a static site to `dist/` with relative asset paths. Upload that folder to any static host (GitHub Pages, Netlify, Cloudflare Pages). No server, no environment variables.

## Layout

```
src/
  model/         types, defaults, clamping, slot budget, migrations
  templates/     one module per template plus the registry
  render/        renderItem, text wrapping and auto-shrink, backgrounds, bezel SVG
  store/         zustand project store with zundo undo, UI store, actions, history batching
  persistence/   IndexedDB wrappers, screenshot import, autosave, orphan sweep
  export/        PNG rendering, ZIP assembly, download helpers
  ui/            projects screen, editor (filmstrip, stage, inspector), controls, hooks
tests/           Vitest suites for the pure modules
scripts/         check-no-network.mjs
```

## Licence

The bezel artwork in `src/render/bezel.ts` is drawn for this project and is not an Apple asset.
