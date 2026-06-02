# RC Cafe — Remote Control Construction Arena (Auckland)

Premium gaming-station style frontend for **RC Cafe / Remote Control Cafe**, Auckland, New Zealand.
Built with **Vite + React + Tailwind CSS + Framer Motion**.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
npm run preview
```

## Add the Official Logo

Place the official RC Cafe logo as **`public/logo.png`** (and optionally `public/favicon.ico`).
The header and footer reference `/logo.png`. If `logo.png` is missing, the site still loads — text logo "RC CAFE" will display.

A placeholder `public/logo.svg` is included for reference only.

## Project Structure

```
src/
  components/   # Header, Footer, MachineCard, SectionHeading, AnimatedCounter, PageHero
  data/         # site, machines, menu, gallery, slots
  pages/        # Home, About, Machines, Booking, Menu, Gallery, Contact, NotFound
  App.jsx       # Routes
  main.jsx
  index.css     # Tailwind + custom utilities
```

## Pages

- `/` Home — cinematic hero, arena, machines, pricing, booking preview, cafe, groups, gallery, FAQ, CTA
- `/about` About RC Cafe
- `/machines` All RC machines
- `/booking` Multi-step interactive booking flow
- `/menu` Cafe menu with category tabs
- `/gallery` Filterable gallery + lightbox
- `/contact` Contact form + socials

## Booking Logic

- **15 Min** — `quantity × $10`
- **30 Min** — `quantity × $18`
- **Bring Your Own** — `quantity × $10/hr`
- 30-minute slots: 8:30 AM–2:15 PM (10 fixed slots)
- 15-minute slots: auto-generated 8:30 AM–2:15 PM (5 min reset)
- Auckland, NZ local time

## Brand

- Construction Orange `#FF6A1A`
- Charcoal `#15171C` / `#0A0B0F`
- Deep Blue accent `#1E3A8A`
- Display: Bebas Neue / Oswald — Body: Inter

## Backend

Frontend only. Booking and contact submit handlers are ready to be wired up later (currently show success state).

---

Developed by **[The Gujarati Designer](https://www.thegujaratidesigner.in)**
