# Leonida Grid — Your Photos, Posted from Leonida

[![gta6-cover-art-01 on make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/wizzy-bounty/gta6-cover-art-01-grid2/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/wizzy-bounty/gta6-cover-art-01-grid2/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An entry for the make.fun **gta6-cover-art-01** bounty ("Make GTA 6 Cover Art").

**Leonida Grid** turns your own photos into GTA-style cover art — and mails
it home as a postcard. Drop in up to six photos and they land in a
multi-panel comic grid on the picture side of a Leonida postcard:
perforated left edge, a postage stamp that follows the grade you pick, a
circular **LEONIDA — MAY 26 2026** postmark with wavy cancellation lines
across the stamp corner, and a big condensed cover title along the bottom.

## The app

A static web app under `app/` — no build step, no network requests, and
photos are read on your own machine and never uploaded (the app says so in
the UI, and it is true: everything is drawn on a local canvas).

- **Photo grid** — file picker or drag-and-drop for 1–6 photos, drawn into
  the panels with cover-crop. Click a panel to select it, drag inside it to
  reposition the photo, and use the slider to zoom the selected panel.
- **6 layouts** — Hero Left (the hero spans a 2×2 block), Hero Top, Twin
  Strip, Quad, Six-Up, and Classic Cover (full-bleed hero with two inset
  panels), all with thin cream gutters and ink borders between panels.
- **Drawn demo scenes** — on first load, four Leonida scenes painted in
  code on a canvas (Sunset Bay, Palm Strip, Neon Harbor, Causeway at Dusk —
  no external assets) fill the grid, so the postcard already looks finished
  before you add a photo. Two sample photos are one click away, and a
  "reset demo" control restores the scenes.
- **Pop-out hero** — a toggle that scales the hero panel's image past its
  frame edge with a drop shadow, the classic frame-break cover move.
- **5 grades** — Bronze, Silver, Gold, Platinum, Leonida Legend. Each one
  re-tints the frame and the stamp's artwork and prints its own one-line
  flavour caption on the postcard.
- **Caption bar** — an editable cover title (default "LEONIDA GRID") in big
  condensed Anton type, an editable subtitle, and three title treatments:
  Classic, Neon (glowing Pacifico script), and Newsprint (halftone dots and
  a ruled underline).
- **Export** — one click downloads a PNG at 1080 × 1080, 1080 × 1350, or
  1920 × 1080, rendered by the same code that draws the preview, so the
  export is exactly what you see.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Then open <http://localhost:8080> in a desktop browser. Everything works
offline from the files in `app/`.

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` there with the kit's
vendored `buildDossier`. Two runs produce byte-identical output.

## Files

- `app/index.html`, `app/style.css` — the page and its styling.
- `app/src/scenes.js` — the four painted demo scenes.
- `app/src/postcard.js` — grades, layouts, stamp, postmark, caption bar,
  and the renderer shared by preview and exports.
- `app/src/app.js` — photo intake, panel editing, controls, exports, and
  the `?shot=` capture modes used to take the screenshots.
- `app/fonts/` — Anton and Pacifico, both under the SIL Open Font License
  (see `app/fonts/OFL.txt` and `app/fonts/Pacifico-OFL.txt`).
- `app/samples/` — two sample photos made with an image model for
  make.fun, free to use.
- `screenshots/` — captures of this app: an exported landscape cover, the
  editor with photos loaded, an exported portrait cover, and an exported
  square cover.

## License

MIT (see `LICENSE`). The fonts are licensed separately under the SIL Open
Font License 1.1, as noted above.
