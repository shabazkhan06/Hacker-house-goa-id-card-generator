# Hacker गोवा House 2026 — ID Studio

A pixel-art themed event site for Hacker House Goa 2026: landing page, ID card template picker, builder details form, and a reveal/loadout page where the finished ID card drops in with confetti and a share action.

Built with **React + Vite**, managed with **Bun**.

---

## Project Overview

| Piece | What it does | Status |
|---|---|---|
| Landing / Hero page | Event branding, dates, CTA into the flow | Built |
| Template selection page | User picks an ID card visual style | Built |
| ID Card Generator (2D, canvas-based) | Photo upload, reposition/zoom, name + role fields, generates a downloadable PNG | Built |
| ID Card component (React, QR + barcode) | Two-sided flip card, dynamic data, real QR + real barcode, HH green branding | Built |
| Loadout / Reveal page | "Reveal your ID card" pixel button → confetti → final golden card → Share as X post | Built |
| 3D physics lanyard (Three.js/Rapier) | Card hanging on a swinging lanyard | **Not built** — see note below |

---

## ⚠️ Important note on the 3D lanyard

Earlier direction referenced a `react-three-fiber` + `@react-three/rapier` physics lanyard (the `<Lanyard position={...} gravity={...} />` component pattern, requiring `card.glb` and `lanyard.png` assets). **That was never actually built in this thread** — those binary asset files don't exist anywhere in the conversation, and a `.glb` 3D model can't be generated from a logo screenshot.

What exists instead, and is fully working:
- A **pure CSS/SVG** two-sided flip ID card (`HHIDCard.jsx`) — real 3D-style flip via CSS `perspective`/`preserve-3d`, no physics engine
- A **pixel-art CSS lanyard strap** on the loadout page — static, not swinging

If the true physics-based 3D lanyard (card swaying, draggable, settles under gravity) is still wanted, that's a separate build requiring:
1. The actual `card.glb` and `lanyard.png` files (from wherever they were originally sourced), or a 3D artist/Blender export
2. `@react-three/fiber`, `@react-three/rapier`, `meshline` installed
3. Vite config updated with `assetsInclude: ['**/*.glb']`

Flag if this is still in scope — it's a meaningfully different build from what's here.

---

## Stack

- **React 18**
- **Vite 5** (dev server + build)
- **Bun** (package manager / runtime, per existing project setup)
- **qrcode-generator** — real, scannable QR codes
- **jsbarcode** — real, scannable Code128 barcodes
- Plain CSS-in-JS (`<style>` tags scoped per page) — no Tailwind/styled-components dependency introduced
- Canvas API — for the standalone PNG-export ID card generator tool

No 3D libraries, no physics engine, no external UI framework beyond React itself.

---

## Pages / Components Delivered

### 1. Standalone ID Card Generator (canvas-based)
`hhgoa-card-generator.html` — single-file, framework-free tool:
- Upload photo (drag/drop, JPG/PNG/WEBP/HEIC)
- Drag-to-reposition + zoom slider crop (handles off-center/portrait/landscape photos)
- Name + role inputs
- Renders final card to `<canvas>` at 1080×1350, real PNG export
- Download button
- Share to X: tries native `navigator.share` with the image file first (mobile), falls back to a pre-filled tweet intent

### 2. React ID Card Component
`HHIDCard.jsx` (+ full Vite app scaffold: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`)
- Two-sided, 3D CSS flip (click/tap, keyboard accessible)
- **Side A**: HH branding, circular photo frame, name, role, team banner, skill tags, decorative Goa motif strip
- **Side B**: boarding-pass-style layout — travel row (from/to, optional), info grid (date, venue, event, class, team, participant ID, seat, role), real QR code, real barcode, `#FrameInGoa` ribbon
- Signature green `#09693B` throughout, gold/pink/cream accents
- Fully dynamic via `data` prop — no hardcoded participant
- Demo app ships with 5 sample participants to page through

### 3. Loadout / Reveal Page
`LoadoutPage.jsx`
- Pixel-art beach background (`PixelBreathingBackground`)
- "Reveal your ID card" pill button → canvas confetti burst → golden ID card image drops in with a pixel-stepped animation
- Pixel pills use **true stair-step corners** (`.pixel-frame` shared class) — square right-angle notches, not diagonal clip-path cuts, so they read as genuinely pixelated rather than a smooth bevel
- Pink pill + offset yellow "shadow" panel + hard black outline, matching the supplied reference image exactly
- **Share as X post** button added after reveal — pre-fills a tweet with `#FrameInGoa` caption (see limitation below)

---

## Known Limitations / Things to Decide Next

1. **X share can't auto-attach an image.** The web intent URL (`twitter.com/intent/tweet`) only supports pre-filled text, not a pre-attached file. Current behavior: opens a pre-filled tweet, user attaches the card manually. Two ways to close this gap:
   - Use `navigator.share({ files: [...] })` on mobile (works in Safari/Chrome Android, silently unsupported on desktop) — falls back to the intent URL where unavailable
   - Host the generated card at a public URL and set that page's `og:image` meta tag to the card — then a link share shows a rich preview even without a native file attach
2. **No backend yet.** Everything is client-side. There's no persistent per-participant record, no real `verify/:id` endpoint behind the QR codes, no server-generated OG image for link previews. The QR encodes either a `verifyUrl` you supply or a structured text fallback — both work today, but "scan → look up real participant in a database" needs an API.
3. **3D physics lanyard** — see note above, not built, would be a separate scoped task.
4. **HEIC support** in the standalone canvas tool depends on the browser's native decode (fine on Safari/iOS, inconsistent elsewhere) — no `heic2any` fallback wired in yet.

---

## Running What's Been Built

### Standalone HTML card generator
Just open `hhgoa-card-generator.html` in a browser — no build step, no install.

### React ID card app (demo + component)
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`.

### LoadoutPage
Drop `LoadoutPage.jsx` into your existing app's pages directory (same routing setup as the rest of the site) and run your existing dev server — no new dependencies were introduced by this file.

---

## File Manifest (this thread's outputs)

| File | Purpose |
|---|---|
| `hhgoa-card-generator.html` | Standalone canvas-based ID card generator, PFP/badge format |
| `HHIDCard.jsx` | Core two-sided flip ID card React component |
| `package.json`, `vite.config.js`, `index.html` | Vite app scaffold for the React card demo |
| `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/HHIDCard.jsx` | Demo app wiring around the card component |
| `LoadoutPage.jsx` | Reveal/confetti/share page with pixel-corrected pills |
| `README.md`, `QUICK_START.md`, `USAGE_EXAMPLES.md` | Documentation for the React card app specifically |

---

#FrameInGoa · BUILD · SHIP · REPEAT
