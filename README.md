# Ama arte-sana — Landing Page

> **This is a client project.** It was built for a paying client, _Ama arte-sana_, a real
> herbal shop (`herbolario`) in Petrer, Alicante, Spain. The repository is a deliverable
> handed over to the client: it is documented, self-contained, and free of any third-party
> service that would create a recurring cost or a lock-in.

[![Astro](https://img.shields.io/badge/Astro-7-ff5d01.svg?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Output](https://img.shields.io/badge/output-static-10b981.svg?style=flat-square)](#performance)
[![License](https://img.shields.io/badge/license-private_client-6d6d6d.svg?style=flat-square)](#license--usage)

A single-page marketing site that works as the **brand and local-SEO front door** for a
physical shop, and funnels every visitor into the client's existing Shopify store.

**Live:** [amaartesana](https://amaartesana.vercel.app/) → store: [amaartesana.com](https://amaartesana.com)

---

## Table of contents

- [The client](#the-client)
- [What this project is — and what it is not](#what-this-project-is--and-what-it-is-not)
- [Tech stack](#tech-stack)
- [Key engineering decisions](#key-engineering-decisions)
- [Performance](#performance)
- [SEO](#seo)
- [Accessibility](#accessibility)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Editing content](#editing-content)
- [Deployment](#deployment)
- [License & usage](#license--usage)

---

## The client

**Ama arte-sana** is a neighbourhood herbal shop and therapy practice at
Avenida de Elda 68, Petrer (Alicante). It sells plants, infusions, supplements,
vitamins, natural cosmetics, diet products, incense, minerals, tarot, amulets and
home decor, and it also runs in-person therapies (family constellations, reiki,
Bach flowers, tarot courses and workshops).

The shop already had a well-established Shopify store. What it did **not** have was a
site of its own to build a brand around, to rank in local search, and to tell the
story of the physical space. That gap is what this project fills.

### Their business goals, and how the site serves them

| Goal                              | How the site addresses it                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Show up in local search           | JSON-LD `LocalBusiness` + geo meta tags, an SEO text block, and a generated sitemap |
| Get people into the physical shop | Address, opening hours, "how to get there", and a click-to-load map                 |
| Drive traffic to the online store | Every collection, service and CTA deep-links into Shopify                           |
| Feel trustworthy, not clinical    | Warm palette, hand-drawn display type, honest copy, a visible health disclaimer     |
| Work on a phone, mostly           | Static HTML, ~27 KB gzipped total, no framework runtime                             |

---

## What this project is — and what it is not

**It is** a fast, static, single-page Astro site with a small, dependency-free
JavaScript layer, a Tailwind design system, structured data for search engines, and
an on-brand transition into the client's Shopify store.

**It is not** the shop itself. The catalogue, cart, checkout, customer accounts and
the newsletter backend all remain on Shopify. This site owns _no_ commerce data and
requires no database, no server and no running costs.

That split is deliberate: the client keeps one source of truth for commerce (Shopify)
and gets a fast, cheap, independently deployable front end for brand and SEO.

---

## Tech stack

| Layer      | Choice                                       | Why                                                                    |
| ---------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| Framework  | **Astro 7**                                  | Ships zero JS by default; the right tool for a content-led static page |
| Styling    | **Tailwind CSS 4**                           | Design tokens live in `@theme`, so the palette is edited in one place  |
| Language   | **TypeScript 6** (strict)                    | `astro check` runs in CI and in `build`                                |
| Sitemap    | **@astrojs/sitemap**                         | Zero-config, generated at build time                                   |
| Animation  | **CSS transitions + `IntersectionObserver`** | Replaced GSAP + ScrollTrigger + Lenis (~51.5 KB gzip) with 2 KB        |
| Formatting | **Prettier** + `prettier-plugin-astro`       | One command, consistent style across `.astro`, `.ts`, `.css`           |
| Hosting    | Any static host                              | `dist/` is plain files                                                 |

**Runtime dependencies: none.** The site has no UI framework, no animation library
and no client-side router. All JavaScript is hand-written and totals ~2 KB gzipped.

---

## Key engineering decisions

Each of these replaced something heavier, and the reasoning is preserved in comments
next to the code.

### 1. GSAP, ScrollTrigger and Lenis were removed entirely

The original motion stack cost **~51.5 KB gzip**. Everything it did is now done with
`IntersectionObserver` and CSS transitions, which costs **~2 KB gzip** — about a 96%
reduction in script weight.

- **Scroll reveals** → one `IntersectionObserver` with a `-12%` root margin, so
  elements animate slightly before they fully enter the viewport. That is what removes
  the "jump" when scrolling fast.
- **Sticky header state** → a `requestAnimationFrame` loop guarded by a flag, instead of
  a scroll listener that fires on every event.
- **Hero parallax** → intentionally dropped. It cost more than it added on a
  one-page site.
- **Smooth scrolling** → native `scroll-behavior: smooth`, which also means
  Ctrl/Cmd+click, "open in new tab" and the back button all keep working — things a
  manual `preventDefault` smooth-scroll library breaks.

### 2. The hero image is protected as the LCP element

A large fade-in on the hero image used to cost roughly **2 seconds of LCP**, because an
element animating opacity is not eligible to be the Largest Contentful Paint until the
animation finishes. The hero now animates `scale` only, which does not block LCP, and
the image is preloaded with a real `imagesrcset` so the browser picks the correct
size instead of being forced to download a hand-picked 1440 px file.

### 3. Shopify images are resized through the filename, not a query string

Shopify's `/cdn/shop` proxy **silently ignores `?width=` and `format=`** — it always
returns the original. The only mechanism that genuinely resizes is the generated
filename suffix (`file_800x.jpg`), which Shopify creates on demand. All image
URLs therefore go through a single helper in `src/config/site.ts`.

Every image declares its **intrinsic** `width` and `height`, so nothing shifts while
loading, and `sizes` values are computed from measured layout widths rather than
guessed with `vw` — a wrong guess makes the browser fetch a size step too large on
almost every card.

### 4. The Shopify hand-off is a first-class transition

Because the visitor leaves for a different domain, we preconnect to Shopify and
prefetch the destination on `pointerenter` / `focus`, then show a branded overlay for
half a second before navigating. A `sessionStorage` flag makes the buttons read
**"Volver a la tienda"** ("Back to the store") on the visitor's return.

Modified clicks (new tab, download, ⌘/Ctrl+Shift) are always left alone, and
`prefers-reduced-motion` collapses the delay.

### 5. The newsletter actually reports failure

The form originally posted with `mode: 'no-cors'`. With `no-cors` the response is
opaque, so `fetch` could never fail and the form **always** claimed success — even
when the subscription had not been created. It now uses a CORS-simple
`form-urlencoded` POST and checks `response.ok`. The legal notice also lives in its
own node so a success message can never overwrite the privacy policy.

### 6. Blurred halos became radial gradients

Decorative glows were eight `filter: blur(70px)` layers, each rasterizing an enormous
blur and blocking the compositor thread on scroll. They are now pre-blurred
`radial-gradient`s — visually equivalent, painted as ordinary images.

`content-visibility: auto` was also evaluated for the sections and **rejected**: every
section is an anchor target, and with a placeholder height the browser miscalculates
where the anchor should land. That trade-off is documented in the CSS so it is not
retried blindly later.

### 7. Progressive enhancement is structural, not bolted on

A tiny inline script adds a `js` class to `<html>` before first paint. All reveal
animations are scoped to `.js`, so with JavaScript disabled or broken the content is
simply visible. There is no flash of hidden content.

---

## Performance

Static output, two routes (`/` and `/404`), no runtime dependencies. Measured on the
production build:

| Asset                                   | Raw     | Gzipped     |
| --------------------------------------- | ------- | ----------- |
| `index.html` (entire page, inlined CSS) | 81.1 KB | **15.5 KB** |
| Page CSS                                | 40.4 KB | **9.2 KB**  |
| All JavaScript (both scripts, bundled)  | 4.7 KB  | **2.0 KB**  |
| `404.html`                              | 16.7 KB | **5.1 KB**  |

**~27 KB gzipped** for a complete first load, including styles and behaviour.

Other measures: the hero image is preloaded at high priority with `fetchpriority`,
fonts use `font-display: swap` and are self-hosted on the client's CDN, below-the-fold
images are lazy, `backdrop-filter` is used only where it cannot be transitioned, and
animations respect `prefers-reduced-motion`.

---

## SEO

- **JSON-LD** as a single `@graph` with `@id` references (`Organization`, `WebSite`,
  `HealthAndBeautyBusiness`/`Store`, `FAQPage`, `WebPage`) — trimmed to what Google actually
  rewards, removing ~6 KB of unrewarded markup.
- **Local signals** — `geo.region`, `geo.placename`, `geo.position`, `ICBM`, address,
  opening hours, service area, and a dedicated SEO copy block.
- **Clean technical base** — canonical URLs, generated `sitemap-index.xml`,
  `robots.txt`, Open Graph and Twitter cards, and `trailingSlash: 'never'`.
- **Performance as a ranking factor** — see the payload table above.

---

## Accessibility

- Skip-to-content link, and `<main>` is programmatically focusable.
- The mobile menu is a **focus trap**: `Tab` cycles inside it, `Escape` closes it and
  returns focus to the toggle, and a click outside dismisses it. It is `inert` when
  closed, so it is both untabbable and hidden from screen readers.
- The map is a **click-to-load facade** — no third-party iframe, no tracking, no
  cookies until the visitor asks for it.
- Visible `:focus-visible` rings on a teal background that clears WCAG AA.
- Text and UI colours were contrast-checked; the teal and rose tokens were darkened
  until they passed AA on the paper background (ratios recorded in `global.css`).
- `prefers-reduced-motion` is honoured globally and individually.
- Marquees duplicated for seamless looping are `aria-hidden`, so screen readers hear
  the list once.

---

## Project structure

```
.
├── astro.config.mjs          # Static output, sitemap, Tailwind via Vite
├── vercel.json               # Vercel build, caching and security headers
├── .nvmrc                    # Node 22 (required by pnpm 11)
├── public/                   # Favicons and web manifest
└── src/
    ├── components/           # One Astro component per page section
    │   ├── Header.astro      #   Fixed nav + full-screen mobile menu
    │   ├── Hero.astro        #   LCP-optimised hero
    │   ├── Ticker.astro      #   Infinite keyword marquees
    │   ├── Manifesto.astro   #   Brand story + values
    │   ├── Collections.astro #   Store collections grid
    │   ├── LocalSeo.astro    #   Local SEO copy + opening hours card
    │   ├── Services.astro    #   Therapies, courses and workshops
    │   ├── Learn.astro       #   YouTube channel + newsletter form
    │   ├── Faq.astro         #   FAQ accordion
    │   ├── Visit.astro       #   Address, hours, click-to-load map
    │   ├── Footer.astro      #   Sitemap, legal, social
    │   ├── HandoffOverlay.astro # Transition into the Shopify store
    │   └── SectionHead.astro #   Reusable section heading
    ├── config/
    │   └── site.ts           # Single source of truth for all content + image helpers
    ├── layouts/
    │   └── Base.astro        # <head>, meta, JSON-LD, fonts, preloads
    ├── lib/
    │   └── schema.ts         # JSON-LD graph builder
    ├── pages/
    │   ├── index.astro       # The landing page
    │   ├── 404.astro
    │   └── robots.txt.ts      # Sitemap URL, generated at build time
    ├── scripts/
    │   ├── motion.ts         # Reveals, header state, marquee pausing
    │   └── ui.ts             # Menu, focus trap, hand-off, newsletter, map
    └── styles/
        └── global.css        # Tailwind theme tokens + component layer
```

**Design principle:** every piece of copy, every link, every colour and every image
lives in `src/config/site.ts`. Components stay presentational, so content changes never
require touching layout code.

> **Note:** the user-facing content is in **Spanish** — it is a Spanish business
> serving a Spanish local audience. Code, identifiers, CSS class names and
> infrastructure are in **English**. The two are kept strictly separate: no Spanish
> identifiers in the codebase, no English strings in the interface.

---

## Getting started

**Requirements:** [Node.js](https://nodejs.org) `>= 22.0.0` and
[pnpm](https://pnpm.io) `11` (both pinned via `engines` and `packageManager`; pnpm 11
drops Node 20 support).

```bash
pnpm install     # install dependencies
pnpm dev         # start the dev server at http://localhost:4321
```

Other useful entry points:

```bash
pnpm build       # type-check, then build to dist/
pnpm preview     # serve the production build locally
pnpm format      # format the whole project with Prettier
```

---

## Available scripts

| Script         | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `pnpm dev`     | Astro dev server with hot reloading                                |
| `pnpm build`   | `astro check && astro build` — type-checks, then builds to `dist/` |
| `pnpm preview` | Serves the production build locally                                |
| `pnpm check`   | Type-checks `.astro` and `.ts` files only                          |
| `pnpm format`  | Formats everything with Prettier                                   |

`pnpm build` runs `astro check` first on purpose: a type error fails the build rather
than shipping.

---

## Editing content

Most changes need no component edits at all — open `src/config/site.ts`:

| To change                                                              | Edit          |
| ---------------------------------------------------------------------- | ------------- |
| Business name, claim, colours, fonts, logo                             | `brand`       |
| Shop links (catalogue, contact, social, maps)                          | `links`       |
| Address, geo coordinates, opening hours, payment methods, service area | `business`    |
| Store collections and their images                                     | `collections` |
| Therapies, courses and workshops                                       | `services`    |
| Brand values                                                           | `values`      |
| FAQ entries                                                            | `faqs`        |
| Image render widths                                                    | `sizes`       |

Images are declared with their intrinsic dimensions:

```ts
{ base: 'collections/herbolario-ama.jpg', w: 768, h: 1024 }
```

`base` is the CDN path **without** a size suffix — `cdn()` and `srcset()` build the
sized URLs and clamp the ladder to the original's real width so images are never
upscaled.

---

## Deployment

The project builds to a fully static `dist/`. It is configured for
[Vercel](https://vercel.com) in `vercel.json`, but the output is plain files, so it will
also work on Netlify, Cloudflare Pages, GitHub Pages or plain nginx.

```bash
pnpm build   # → dist/
```

### The `SITE_URL` environment variable

The canonical origin is read from `SITE_URL`, falling back to
`https://landing.amaartesana.com` when it is not set:

| File                      | Used for                                          |
| ------------------------- | ------------------------------------------------- |
| `astro.config.mjs`        | `site` — drives the generated sitemap             |
| `src/config/site.ts`      | canonical links, `og:url` and every JSON-LD `@id` |
| `src/pages/robots.txt.ts` | the `Sitemap:` line, so it can never drift        |

Set it in Vercel under **Project → Settings → Environment Variables** so a wrong domain
can never ship:

```
SITE_URL=https://landing.amaartesana.com
```

Preview deployments pick it up automatically, which keeps canonical URLs honest on
every branch build.

### Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. Vercel reads
   `vercel.json`, so nothing else needs configuring.
3. Add the `SITE_URL` environment variable for **Production** (leave **Preview** empty
   if you do not want previews indexed).
4. Click **Deploy**. Vercel builds with `pnpm build` and publishes `dist/`.
5. Attach the custom domain under **Project → Settings → Domains** →
   `landing.amaartesana.com`.

Every push to the default branch redeploys automatically; other branches get preview
URLs.

### What `vercel.json` handles

- **Build** — framework, install command, build command and output directory pinned
  explicitly, so the build never depends on framework auto-detection.
- **Caching** — `/_astro/*` is served `immutable` for one year, which is safe because
  Astro content-hashes those filenames. Icons get a one-day cache.
- **Security headers** — `nosniff`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy` and HSTS. No Content-Security-Policy is set: it would need
  allowances for the inline JSON-LD, the inline `js`-class script, the OpenStreetMap
  iframe and the outbound Shopify links, and a missed allowance breaks the page
  silently.
- **No rewrites.** Vercel does not support URL rewrites with Astro, so `/404` stays a
  genuine `404.html`.

`robots.txt` is generated during the build by `src/pages/robots.txt.ts` rather than
being a static file, so its sitemap URL always matches `SITE_URL`.

---

## License & usage

Private client work, delivered to **Ama arte-sana**. The code, design and copy are the
property of the client and are not licensed for redistribution or reuse.

If you are reading this as the client's team: the short version is that you own it.
Change anything, host it anywhere, and there are no third-party services to cancel.
