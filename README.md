# RC Cafe — Remote Control Construction Arena (Auckland)

Premium white/orange, family-friendly frontend for **RC Cafe / Remote Control Cafe**, Auckland NZ.
Built with **Vite + React + Tailwind CSS + Framer Motion**.

## Quick Start

```bash
npm install
npm run dev     # local dev at http://localhost:5173
npm run build   # production output in /dist
npm run preview # preview /dist locally
```

## Project Structure

```
public/
  logo.png            # YOUR real logo (preferred, used everywhere)
  logo.svg            # SVG fallback (only used if logo.png missing)
  .htaccess           # Hostinger / Apache SPA rewrite + cache rules
  images/             # Construction/cafe placeholder graphics (replace with real .jpg)
  videos/             # Real customer gameplay videos (.mp4)
src/
  components/         # Header, Footer, Logo, VideoRail, MachineCard, etc.
  data/               # site.js, machines.js, menu.js, gallery.js, slots.js, videos.js
  pages/              # Home, About, Machines, Booking, Menu, Gallery, Contact, NotFound
```

## Adding More Customer Videos

1. Drop a new `.mp4` file into `public/videos/` and name it cleanly, e.g. `rc-cafe-video-4.mp4` (no spaces).
2. Add an entry to `src/data/videos.js`:

```js
{
  title: 'Family RC Session',
  video: '/videos/rc-cafe-video-4.mp4',
  tag: 'Customer Gameplay'
}
```

The homepage video rail renders from this array automatically.

## Replacing Placeholder Images

The illustrated SVGs under `public/images/` are placeholders. To use real photos:

1. Drop a real `.jpg` photo with the same base name into `public/images/`
   (e.g. `rc-excavator-arena.jpg`).
2. Update the path in `src/data/machines.js` or `src/data/gallery.js` from
   `/images/rc-excavator-arena.svg` to `/images/rc-excavator-arena.jpg`.

## Logo

The header uses the `Logo` component which **always tries `/logo.png` first**, then falls back to `/logo.svg`. Drop your real logo at `public/logo.png` (already in place).

- Header height: `52px` mobile, `64px` desktop.
- No text beside the logo — image only.

## Customer Gameplay Videos Section

`src/components/VideoRail.jsx` — appears immediately after the hero on the homepage.

- HTML5 `<video autoplay muted loop playsinline preload="metadata">`
- Uses `IntersectionObserver` — videos only play when ≥45% visible, pause when scrolled away
- Horizontal scroll-snap rail (desktop arrows, mobile swipe)
- Click any video → opens a centered lightbox with full controls + audio
- Mute toggle on each card

## Booking Logic

| Option | Price |
|---|---|
| 15 Min Session | $10 × quantity |
| 30 Min Session | $18 × quantity |
| Bring Your Own RC | $10/hr × quantity |

- 30-min fixed slots: 8:30 AM → 2:15 PM (10 slots)
- 15-min auto slots: 8:30 AM → 2:15 PM (5-minute reset)
- BYO hourly slots
- All times follow Auckland, NZ local time

## Deploying to Hostinger Subdomain

The build is configured with `base: './'` so all assets use **relative paths** — works on any subdomain.

### Steps

1. Build the site:
   ```bash
   npm install
   npm run build
   ```
2. Open the **`dist/`** folder produced in the project root.
3. Log in to **Hostinger** → **File Manager** → open your subdomain's folder (usually `public_html/yoursubdomain` or the subdomain root `public_html`).
4. **Upload everything inside `dist/`** — including:
   - `index.html`
   - `.htaccess` (controls SPA routing — required)
   - `assets/` folder (CSS + JS bundles)
   - `images/` folder
   - `videos/` folder
   - `logo.png` + `logo.svg`
5. Make sure `index.html` sits at the **root** of the subdomain folder.
6. Visit your subdomain — done.

### Why the `.htaccess` is required

This is a single-page app using React Router. The `.htaccess` rewrites all unknown paths to `index.html` so that direct visits to e.g. `https://yoursub.example.com/booking` work correctly. It also adds long-term cache headers and gzip compression.

### If a deep link still 404s

On some Hostinger plans, you must enable mod_rewrite or contact support. The `.htaccess` already handles the rest.

## Color System (CSS vars)

```css
--bg: #ffffff;
--bg-soft: #f7f7f5;
--text: #1b1b1b;
--muted: #666666;
--orange: #ff6b1a;
--orange-dark: #d94f00;
--charcoal: #151515;
--border: #e8e2dc;
```

## Fonts

- Display: Plus Jakarta Sans
- Body: Inter

Both loaded via Google Fonts in `index.html`.

## Pages

- `/` Home — hero · highlights · customer videos · about · machines · pricing · gallery · groups · FAQ · CTA
- `/about` About RC Cafe
- `/machines` Full machine fleet
- `/booking` 6-step interactive booking
- `/menu` Cafe menu with category tabs
- `/gallery` Filterable gallery with lightbox
- `/contact` Contact form, info cards, socials
- `*` 404 page

## Tech

- Vite 5
- React 18 + React Router 6
- Tailwind CSS 3
- Framer Motion 11
- Lucide Icons

---

Developed by **[The Gujarati Designer](https://www.thegujaratidesigner.in)**
