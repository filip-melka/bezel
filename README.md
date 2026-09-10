# Bezel

Bezel is a free, fully client-side web app for producing App Store screenshot sets for iPhone. Drop raw screenshots, pick a built-in layout per slide, write a headline, and export a numbered set of PNGs at the App Store 6.9" size (1320 × 2868).

- Nine locked templates: text top, text bottom, device only, tilted, two Live Activity layouts (lock-screen card and expanded Dynamic Island, cut out of the screenshot automatically), and three panoramic pair layouts that render one device across two adjacent slides, straight or tilted either way, with text on either slide.
- Realistic vector iPhone bezel in four finishes, with optional drop shadow.
- Set-level theme (background, text styles, bezel) with per-slide overrides that are shown as overrides.
- Auto-shrinking headlines, cover-fit screenshots with crop warnings, a hard cap of 10 slots.
- Autosave to IndexedDB, multiple named projects, full undo/redo.
- Zero network. Screenshots never leave the browser. The build is checked for external URLs.

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
