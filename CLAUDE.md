# Le carnet des raccourcis

Shared catalogue of keyboard-shortcut cards, stored in PostgreSQL. `content/*.md` holds the seed cards, imported by `backend/import_markdown.py`.

- `backend/`: Flask API (`app.py`), served under `/api`. Keys are normalized to `Ctrl+Shift+P` (`keys.py`)
- `frontend/`: Vite + vanilla JS
  - `src/main.js`: hash router, home page and shortcut page (`#/raccourci/<slug>`)
  - `src/new-shortcut.js`: "add a shortcut" page (`#/nouveau`): 3-step form, live card preview. Also exports `icon(name)` (inline stroke icons)
  - `src/api.js`, `src/header.js` (button animations, `setupCtaSpin`)
  - `src/sections/`: home page sections (`hero.js`, `reflexes.js`, `sommaire.js`), each with its stylesheet in `src/styles/sections/`. `sommaire.js` also exports `keysTemplate`, reused to render keys elsewhere
  - `src/styles/`: SCSS, imported in cascade order by `main.scss`: `abstracts/` (mixins, breakpoints), `base/`, `components/` (shared: buttons, card, form, markdown, icons…), `layout/`, `sections/`, `pages/` (`_detail`, `_nouveau`)
- `compose.yaml`: runs db, API and frontend; images are published to GHCR by `.github/workflows/docker-publish.yml`. The frontend image copies the sources (no volume): after a change, rebuild it with `docker compose up -d --build --no-deps frontend`, or run `npm run dev` locally

## Brand guidelines (Brandboard)

Every UI change follows this charter. The overall look is **dark, raw, "terminal"**: a near-black background, acid-yellow accents, heavy display type, and monospace for anything keyboard-related.

### Logos: `frontend/public/brand/`

| File | Use |
| --- | --- |
| `logo-primary.svg` | Horizontal logo (CR mark + "CARNET / DES RACCOURCIS"). Header and wide spaces. |
| `logo-secondary.svg` | Stacked logo (CR mark above "CARNET RACCOURCIS"). Tight square spaces, splash screen. |
| `logo-reduce.svg` | Short stacked version (CR mark + "CARNET"). Small sizes and mobile. |
| `favicon.svg` | CR mark in Toxine on an Abysse rounded square. Favicon and app icon. |

Vite serves them from the root: `/brand/logo-primary.svg`, etc.

Logo rules:
- The logos are drawn in **Toxine/Acide, so they belong on a dark background** (Abysse or Charbon). On a light background (Papier), use a dark version: recolor the `fill` to `#1E1E1E`, as on the brandboard's first panel.
- Never stretch, rotate or add effects (shadow, gradient, outline).
- Leave clear space around the logo at least the height of the "C" in the CR mark.

### Color palette

| Name | Hex | Role |
| --- | --- | --- |
| Toxine | `#DAFF02` | Main accent: CR mark, primary CTA, highlighting a key word, focus |
| Acide | `#E0FF4F` | Secondary accent: logo text, hover, light badges |
| Papier | `#FDFFF7` | Text on dark backgrounds; light background (rare) |
| Abysse | `#1E1E1E` | Main page background |
| Charbon | `#222222` | Raised surfaces: cards, panels, inputs, `kbd` |

Always use CSS variables, never hardcoded hex values:

```css
:root {
  --toxine: #DAFF02;
  --acide: #E0FF4F;
  --papier: #FDFFF7;
  --abysse: #1E1E1E;
  --charbon: #222222;
}
```

Usage:
- Default theme: Abysse background, Papier text, Toxine accents.
- Toxine/Acide **only on a dark background** for text. On Toxine, text is always Abysse (never Papier, which has too little contrast).
- Use yellow sparingly: one CTA or one highlighted word per area, not whole blocks of text.
- For secondary text and borders, derive colors from Papier with transparency (e.g. `rgb(253 255 247 / .6)` for muted text, `/ .12` for borders) instead of adding new grays.

### Typography

| Font | Role |
| --- | --- |
| **Archivo Black** | Display: H1/H2, card titles, CTAs. Often UPPERCASE, tight letter-spacing. |
| **Martian Mono** | Everything else: body text, UI, labels, `kbd`, code, badges. |

Google Fonts import:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Martian+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

```css
--font-display: 'Archivo Black', 'Arial Black', sans-serif;
--font-mono: 'Martian Mono', ui-monospace, monospace;
```

### UI patterns (from the brandboard mockup)

- **Hero**: big UPPERCASE Archivo Black headline (e.g. "MOINS DE CLICS. PLUS DE RÉFLEXES."), with one key word highlighted by a Toxine block behind it (Abysse text, slightly slanted, like the italic logo).
- **Keys (`kbd`)**: Charbon background, thin light border, heavier bottom border for the 3D key effect, Martian Mono. An "active" key is filled in Toxine with Abysse text.
- **Scrolling marquee**: a Toxine band with Abysse text in Martian Mono UPPERCASE, listing shortcuts (`CTRL + K  OUVRIR LA PALETTE DE COMMANDES  ·  CTRL + U  EFFACER LE DÉBUT DE LA LIGNE …`). Respect `prefers-reduced-motion`.
- **Buttons**: primary = Toxine fill + Abysse text; secondary = transparent with a Papier border. Small radius (6–8px).
- **Cards**: Charbon on Abysse, 12–16px radius, Papier/12% border; on hover, the border turns Acide.
- **Radius**: rounded but tight, like the favicon (≈ 22% of the size for icons, 8–16px for components).
- **Slant**: the logotype is italic (≈ 8°). Use `skew` only on accents (highlights, badges), never on body text.
- **Focus**: visible 2px Toxine outline with an offset, on every interactive element.

### Brandboard reference

The original brandboard (`Brandboard3.pdf`) includes: primary logo (light and dark), secondary logo, favicon, the 5-color palette, Archivo Black / Martian Mono type specimens, and mockups (signage, laptop with the landing page). This file is its source of truth for code.
