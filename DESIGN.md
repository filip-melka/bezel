# Bezel — Design specification

Companion to `SPEC.md`. `SPEC.md` is authoritative for _what the app does_; this document is authoritative for _how it looks and behaves_. Where the two disagree on behaviour, `SPEC.md` wins.

Visual reference: `Bezel Editor Design.dc.html` (options 2a–2d). Open it alongside this document.

---

## 1. Design position

Bezel is a layout engine with locked templates. The UI's job is not creative freedom — it is making the small set of legal moves feel deliberate, and letting you compare slide 3 against slide 7 at a glance.

Three consequences:

1. **The chrome recedes.** The only saturated colour in the editor is the tint, and it means exactly two things: _selection_ and _the primary action_. Everything the user's own palette touches sits on neutral grey so their colours read true.
2. **Numbers are identity.** A slide's number is its filename. It is visible on every thumbnail, in the inspector header, and in the preview caption — never hidden behind a hover.
3. **The set is the artefact, not the slide.** Set-level theme is one tap away at all times, and per-slide deviations from it are shown as deviations, not as independent settings.

Language: iOS-flavoured, desktop-density. Light only — no dark mode in v1.

---

## 2. Foundations

### 2.1 Type

Two stacks, on purpose. The **chrome** — every label, row, button and menu — uses the system stack, so the editor keeps feeling like a Mac app rather than a web page:

```
-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif
```

The **output** uses one of three bundled families, chosen per set (§7.3 of `SPEC.md`). Slide text cannot follow the chrome, because a system stack resolves differently on every operating system and the export would change with the machine. So the two surfaces are allowed to disagree, and they meet in the only two places where the distinction matters to the user: the headline and subheadline fields are set in the slide's own family, so what you type looks like what gets drawn, and each tile in the Theme tab's Font control is set in the family it names.

| Role          | Size / weight                     | Use                                     |
| ------------- | --------------------------------- | --------------------------------------- |
| Title         | 13.5 px / 600                     | Project name, sheet titles              |
| Body          | 13 px / 400                       | List rows, field values, buttons        |
| Control       | 12.5 px / 500–600                 | Segmented controls, small buttons       |
| Section label | 11.5 px / 600, uppercase, 60% ink | Group headers above inset lists         |
| Caption       | 11.5 px / 400, 55–60% ink         | Dimensions, counts, hints               |
| Numeric       | 11.5 px / 500, tabular figures    | Slider readouts, slot counts, px values |

Slider readouts and any figure that changes while dragging use `font-variant-numeric: tabular-nums` so the row does not jitter.

The size and weight table below is chrome only; slide type is sized by the template and the Headline/Subheadline style controls.

### 2.2 Colour

| Token            | Value                           | Use                                                     |
| ---------------- | ------------------------------- | ------------------------------------------------------- |
| `--tint`         | `#0a7aff`                       | Selection, primary button, focus ring, override markers |
| `--tint-wash`    | `#e5f1ff`                       | Tinted button fills, selected-row backgrounds           |
| `--destructive`  | `#ec3013`                       | Destructive buttons only (Delete, Remove)               |
| `--label`        | `#1c1c1e`                       | Primary text                                            |
| `--label-2`      | `rgba(60,60,67,.6)`             | Secondary text, section labels                          |
| `--label-3`      | `rgba(60,60,67,.45)`            | Placeholder, disabled text                              |
| `--bg-sidebar`   | `#f7f7f9`                       | Sidebar, inspector ground                               |
| `--bg-content`   | `#ffffff`                       | Cards, inset list rows                                  |
| `--fill`         | `#f2f2f5`                       | Text-field wells                                        |
| `--fill-control` | `#e9e9ec`                       | Segmented-control track                                 |
| `--separator`    | `rgba(0,0,0,.09)`               | Hairlines and region borders                            |
| `--stage`        | `#8e8e93`                       | Preview backdrop                                        |
| `--warning`      | `#ffcc00` fill / `#6b4e00` text | Crop and low-resolution notices                         |

The stage grey is deliberately mid-value: both white and near-black slide backgrounds read correctly against it, and neither one wins.

Contrast: all body-size text is ≥4.5:1 on its own ground. The tint is used for text only at 13 px/500 or larger on white (5.1:1); tinted text on `--tint-wash` uses `#0a5fcc`.

### 2.3 Spacing and radius

4 px base. Gutters 12/14 px, section gaps 16–18 px, card padding 12 px.

| Radius   | Applied to                                           |
| -------- | ---------------------------------------------------- |
| 6 px     | Thumbnails under 60 px, small pills                  |
| 7–8 px   | Buttons, wells, text fields, segmented-control thumb |
| 9 px     | Segmented-control track                              |
| 12 px    | Inset list cards, template tiles                     |
| 14–16 px | Window, sheets                                       |

No square corners anywhere in the chrome. The _slide_ itself is always square-cornered — it is a 1320 × 2868 PNG, and rounding it in the preview would lie about the output.

### 2.4 Elevation

Three levels only.

- **Flat** — sidebar, inspector ground. No shadow; separated by hairlines.
- **Raised** — inset list cards, segmented thumb: `0 1px 2px rgba(0,0,0,.06)`.
- **Floating** — sheets, popovers: `0 20px 50px rgba(0,0,0,.34)` over a `--stage` scrim at 40%.

The preview slide gets `0 18px 44px rgba(0,0,0,.32)` — it is the one object in the app allowed to look physical.

---

## 3. Information architecture

```
Projects  ──open──▶  Editor
   ▲                   │
   └────── ‹ Projects ──┘
```

Two screens. No nested navigation, no modals except the add-sheet and the export confirm.

Within the editor, three regions with fixed responsibilities:

| Region    | Owns                                                | Never owns                                  |
| --------- | --------------------------------------------------- | ------------------------------------------- |
| Filmstrip | Order, selection, slot budget, add/duplicate/delete | Any slide property                          |
| Stage     | Truth. What the PNG will contain                    | Any control (v1 has no direct manipulation) |
| Inspector | Every editable property, split Slide / Set theme    | Order or selection                          |

**Chosen shell: 2a** — vertical filmstrip left, stage centre, inspector right (matches `SPEC.md` §9). 2b (horizontal filmstrip along the bottom, slides in export order with dimmed neighbours either side) is the recorded alternative; it reads the set better but costs 148 px of stage height. Build 2a; 2b is a layout swap, not a rewrite.

---

## 4. Components

### 4.1 Segmented control

Track `--fill-control`, 9 px radius, 2 px inset. Selected thumb: white, 7 px radius, raised shadow, weight 600. Unselected labels 500 at `--label-2`. Used for the Slide / Set theme switch and for template choice. Disabled options drop to 40% and keep their label visible — never hidden.

### 4.2 Inset grouped list

White card, 12 px radius, rows 40–44 px tall, hairline separators inset 12 px from the left. Row is `label · value · disclosure`. Values that come from the set theme render at `--label-2`; values overridden on this slide render at `--label`, gain a 7 px tint dot before the label and a "Reset" action at the trailing edge.

This is the mechanism that makes `SPEC.md` §5's `overrides` model legible: you can always see what a slide inherits and what it has broken away from, without opening anything.

### 4.3 Slider row

`label · track · readout`. Track 4 px, 2 px radius, `#e4e4e7`; filled portion in tint for magnitude values (scale), unfilled for bipolar values (offsets, which fill from centre). Thumb 20 px, white, `0 1px 4px rgba(0,0,0,.3)`.

Every slider is keyboard-operable: ←/→ step, ⇧←/→ ×10, ⌥ click resets to default. The readout is also a text field — type an exact number. Ranges come from the template's `limits`; the track's ends _are_ the clamp, so an out-of-range value is unrepresentable rather than rejected.

### 4.4 Switch

38 × 23 px, tint when on. Used for "Override text style", "Background override", "Drop shadow".

### 4.5 Buttons

- **Primary** — tint fill, white label, 8 px radius, 600. One per screen: Export.
- **Secondary** — `#f0f0f3` fill, 7 px radius, 500.
- **Tinted** — `--tint-wash` fill, tint label. Used for "+ Add".
- **Plain** — tint label, no fill. Back, Reset, Cancel.
- **Destructive** — `--destructive` label on secondary fill. Remove. A filled `--destructive` variant is used for the confirming Delete in a sheet.

### 4.6 Thumbnail

Rounded 6–8 px, `0 0 0 1px rgba(0,0,0,.1)`. Selected: `0 0 0 2px var(--tint)` plus a filled number chip. A pair is one thumbnail of double width with a dashed seam guide down the centre and a range label ("03–04 · pair"). Warning badge: 14 px amber dot, top-trailing corner.

### 4.7 Sheet

Centred card, 16 px radius, floating elevation over a scrim. Escape and scrim-click both dismiss; the only visible dismiss control is a Cancel button in the sheet footer, never in the header. Used for the template chooser, the export confirm, and the delete-project confirm.

---

## 5. Key flows

### 5.1 First run

Projects screen, empty. Three lines of explanation, a "New project" button, and the whole viewport is a drop target. Dropping _n_ images creates a project with _n_ `textTop` slides and opens it on slide 01 — the fastest path from raw screenshots to something worth editing is one gesture.

### 5.2 Add a slide

"+ Add" opens the sheet (2d). One tile per layout, drawn as pure geometry — outlined device, filled text bars — not as a fake screenshot, so the tile communicates _layout_ and nothing else. The chooser holds layouts only: tilt direction and Live Activity are options set on the slide afterwards, so they never double the tile count. Every tile states its slot cost. When fewer than 2 slots remain, pair tiles drop to 45% and an inline card explains why in words ("A panorama uses two of your ten. Delete a slide to make room.") — never a tooltip, because the reason is the point.

### 5.3 Edit

On pair templates each text section splits into two groups, Left slide and Right slide, separated by a divider. Each group has its own text field and its own Style row. The left row reads "Set theme" until customised; the right row reads "Same as left" and follows the left side until customised, at which point it starts from the left side's current style. Leaving a field empty leaves that side without text. The Text position section likewise shows two sliders for a pair, Left slide and Right slide, each moving only its own side. In the style editor, Weight and Align sit on their own full-width rows so their labels never truncate.

The template control names a layout and nothing more. Where a layout comes in two mirrored versions the mirror is a Direction row under it (Left / Right), not two entries in the control — one decision at a time, and the control stays four buttons wide on slides, two on pairs.


Select in the filmstrip → the inspector retitles to that slide's number → edit. Preview updates on the 40 ms debounce; thumbnails update on commit. Sliders track live at preview scale and re-render full-res on release (`SPEC.md` §7.2).

### 5.4 Live Activity crop

Every slide has a Live Activity section, because lifting a card off the screen is an option on any layout rather than a layout of its own. Its first row is the choice itself — Lift: None / Lock / Island — and with None it is the only row, so the section costs one line on the slides that do not use it. Choosing a kind reveals the rest: a status row (Detected / Not found / Needs a screenshot) with Detect and Adjust… buttons, a Screen control (Screenshot, or a drawn Placeholder lock or home screen that uses only the widget from the screenshot), a Colour row shown only for Placeholder (swatch and hex field; a custom colour gets the override dot and Reset), then Scale and Offset sliders. Switching Lock ↔ Island re-runs detection, since the stored crop belongs to one kind. Adjust… opens a sheet showing the screenshot with the crop as a tinted box: drag to move, corner handles to resize, numeric fields for exact values, Detect again to re-run the heuristic. Done applies; Cancel or Escape discards.

### 5.5 App Store preview

"Preview" in the top bar opens a full-screen mock of the product page: every exported slot side by side at App Store corner radius with the store's gap, so a panorama can be judged as shoppers will see it. Done or Escape returns to the editor. Nothing is editable there.

### 5.6 Export

Export ▾ offers "Download this slide" and "Download all as ZIP". If any item lacks a screenshot, a confirm sheet lists the affected numbers before rendering starts. Progress is a determinate bar with "Rendering 4 of 10"; on completion the button shows a checkmark for 1.2 s rather than firing a toast.

---

## 6. States

Every surface needs all five. Defined once here.

| State                     | Treatment                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty (no slides)**     | Stage shows a centred outlined slide silhouette, one line, and an "Add slide" button. The filmstrip keeps its "+ Add" and its 0/10 counter           |
| **Empty (no screenshot)** | Screen area at 12% grey with a "Drop screenshot" label — preview only. On export it is solid black and the confirm sheet warns first                 |
| **Loading**               | Thumbnails render progressively; a slide not yet rendered shows its background colour only, never a spinner                                          |
| **Warning**               | Amber. Crop mismatch, low resolution, text shrunk. Always paired: a badge on the thumbnail _and_ a sentence in the inspector saying what will happen |
| **Error**                 | Rejected file type, quota exceeded, export failure. An inline banner in the region that caused it, with the recovery action as a button              |
| **Disabled**              | 45% opacity, label still legible, reason always available as adjacent text or `aria-describedby` — never opacity alone                               |

Warnings never block. Every one of them describes a result the user may well want.

---

## 7. Feedback

- **Autosave** — "Autosaved" sits permanently in the top bar at `--label-3`; it does not animate. ⌘S flashes it to `--label` for 800 ms. No toast.
- **Destructive actions** — delete does not confirm; undo covers it. A brief "Slide 03 deleted · Undo" bar appears bottom-left for 5 s.
- **Truncation** — "Text was shrunk to fit" appears beneath the field _and_ as a thumbnail badge, because the user may be looking at either.
- **Toasts** — reserved for things with no home on screen: truncated multi-drop, missing assets on load, quota. Bottom-left, 5 s, one at a time.

---

## 8. Motion

Restrained. The user is judging pixels; movement that competes with the canvas is a bug.

| Transition                              | Duration / curve                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Selection change                        | 120 ms `ease-out` on the ring and number chip; the stage image cross-fades 100 ms |
| Sheet in / out                          | 200 ms / 160 ms, `cubic-bezier(.32,.72,0,1)`, scale 0.96→1 with scrim fade        |
| Inset list expand (override toggled on) | 180 ms height + opacity                                                           |
| Slider thumb                            | No transition. Tracks the pointer exactly                                         |
| Filmstrip reorder                       | dnd-kit default, 200 ms; the dragged item lifts to floating elevation             |
| Progress bar                            | Width transitions 240 ms `linear` between item completions                        |

Everything above collapses to an opacity change or nothing under `prefers-reduced-motion: reduce`.

---

## 9. Accessibility

- **Keyboard** — full parity with the shortcut table in `SPEC.md` §9.7. Tab order: top bar → filmstrip → stage caption → inspector. ↑/↓ move filmstrip selection when focus is outside a text field.
- **Focus** — `2px solid var(--tint)` at `offset: 2px`, on every interactive element, never suppressed. Visible on the dark stage too (the caption pill inverts).
- **Labels** — every control has a visible label. Icon-only controls (the "+" tile, hover actions) carry `aria-label`.
- **Sliders** — `role="slider"` with `aria-valuenow/min/max/valuetext`; `valuetext` reads "1.00×" and "+24 px", not bare numbers.
- **Filmstrip** — `role="listbox"`, items `role="option"` with `aria-selected`; a pair announces "Slides 3 to 4, panoramic pair".
- **Warnings** — `role="status"` (polite). Errors `role="alert"`.
- **Colour is never the only signal** — the override tint dot is paired with a bolder value weight; the warning badge is paired with inspector text.

---

## 10. Responsive behaviour

Desktop only, ≥1024 px (`SPEC.md` §2).

| Width        | Behaviour                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| < 1024 px    | Full-screen notice: "Bezel needs a wider window." Project is not loaded                                                                                                                            |
| 1024–1279 px | Filmstrip 160 px, inspector 300 px, stage takes the remainder                                                                                                                                      |
| 1280–1679 px | Filmstrip 180 px, inspector 340 px — the reference layout                                                                                                                                          |
| ≥ 1680 px    | Regions hold their widths; the stage absorbs all extra space and the slide scales up to a 1:1 cap. It never exceeds 100% — a 2868 px-tall PNG shown larger than life would misrepresent the output |

Stage always fits the slide to height with a 32 px margin, minus the caption's 40 px.

There is no mobile experience, by decision. Nothing in the app degrades toward one; it refuses instead, which is honest.

---

## 11. Open decisions

1. **Shell** — 2a (build this) vs 2b (recorded alternative). Revisit after the first real ten-slide set exists.
2. **Tint colour** — resolved: iOS blue. Red is reserved for destructive actions.
3. **Set-theme-first inspector** — the option that makes Set the default tab and lists deviating slides underneath. Better for consistency across ten slides, worse for the single-slide edit loop. Deferred.
