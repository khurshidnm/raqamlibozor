# Raqamli Bozor — marketing site

Astro 7 + TypeScript static site managed by Payload CMS (`cms/`). Visitors get plain HTML, CSS and a few small ES modules — no framework runtime, except for the interactive markets map at `/bozorlar/`, which is a React island. Editors use the Payload admin at `/admin` in `cms/`; `npm run content:pull` exports content to `src/content/`.

## Stack and why

| Concern   | Choice                  | Reason                                                                                                                                                                                                        |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | **Astro 7**             | Zero JS by default, build-time image optimisation, content collections with Zod validation, i18n routing, static output that uploads anywhere. Next.js would ship a React runtime for a page that needs none. |
| Language  | **TypeScript (strict)** | All behaviour lives in `src/scripts/*.ts`; content is typed end-to-end from the CMS schema to the templates.                                                                                                  |
| CMS       | **Payload 3** (`cms/`)  | Professional admin: roles, drafts, versions, media, rich text, leads inbox. Exports to files so the static build stays CMS-independent.                                                                       |
| Images    | `astro:assets` (sharp)  | Source PNGs are converted to WebP/AVIF at the sizes the layout actually renders.                                                                                                                              |
| Tests     | Vitest                  | Phone-mask logic and CMS content rules.                                                                                                                                                                       |

Alternatives considered: **Sanity** (best hosted editing UX, external service and a project ID per environment), **Strapi/Directus/Payload** (self-hosted servers and a database for a single page), **Next.js + Contentful** (heavier runtime and two paid services). Any of them plugs into the same Astro content layer if the team outgrows git-based editing.

## Requirements

- Node 22.22.3+ (see `.nvmrc`)
- npm 9+

## Commands

| Command                           | What it does                                   |
| --------------------------------- | ---------------------------------------------- |
| `npm install`                     | Install dependencies                           |
| `npm run dev`                     | Dev server at http://127.0.0.1:4321            |
| `npm run build`                   | Static production build into `dist/`           |
| `npm run preview`                 | Serve `dist/` locally                          |
| `npm run check`                   | Astro + TypeScript type-check                  |
| `npm run lint` / `npm run format` | ESLint / Prettier                              |
| `npm test`                        | Vitest (phone mask, content validation)        |
| `npm run verify`                  | check + lint + test + build (what CI runs)     |
| `npm run icons`                   | Regenerate PNG icons from `public/favicon.svg` |

## Project structure

```
astro.config.ts           site URL, i18n locales (from content), integrations
cms/                      Payload CMS app (admin, schema, lead API, import/pull scripts)
src/
  content.config.ts       Astro collections: media, landing, news, markets, settings
  content/
    schema.ts             Zod schemas shared by Astro and the tests
    settings.json         site-wide settings (singleton)
    landing/uz.json       all copy for one locale (one file per language)
    news/*.md             news posts (front matter + Markdown body)
    markets/*.json        markets shown on the /bozorlar/ map (one file each)
    regions.ts            fixed region ids + editor labels for the map
    map-strings.ts        keys of the map's visitor-facing text
    media/*.json          media library entries → src/assets/media/<slug>/image.*
  assets/media/           CMS-managed images (optimised at build time)
  assets/ui/              code-managed SVGs (logo, hero pattern, dashboard card)
  components/             one .astro per section + Icon
  components/map/         UzbekistanMarketMap.tsx (React island) + shapes.ts / districts.ts outlines
  layouts/Base.astro      <head>: SEO, Open Graph, hreflang, icons, preloads, JSON-LD
  lib/                    typed content access, phone mask, JSON-LD, hero image variants
  scripts/                client behaviour (TypeScript, bundled per component)
  styles/                 global tokens + one stylesheet per section
  integrations/           build step: CSP `_headers` + pruning of unreferenced images
  pages/                  index, [locale]/index, bozorlar, [locale]/bozorlar, news/*, [locale]/news/*, 404, robots.txt
public/                   fonts, globe frames (earth/), icons, manifest
tests/                    Vitest
```

## Editing content (Payload CMS)

Content is managed in **Payload CMS 3** (`cms/`), a full admin with roles, drafts, version history, media library, rich text and a private leads inbox. The static site keeps reading the JSON/Markdown files in `src/content/`; `npm run content:pull` regenerates them from the CMS, so builds and CI never need the CMS running.

### Setup

```
npm run cms:install          # installs cms/ dependencies
cp cms/.env.example cms/.env # set PAYLOAD_SECRET (random 32+ chars); SQLite is used when DATABASE_URL is empty
npm run cms:import           # one-time: loads the current src/content into the CMS, creates the first admin
npm run cms                  # admin at http://localhost:3000/admin
```

The import creates `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `cms/.env` (defaults are for local use only — change them).

### Workflow

1. Edit in the admin. Landing pages and news support drafts; only published documents are exported.
2. Run `npm run content:pull` — rewrites `src/content/*`, `src/assets/media/*` and `settings.json`.
3. Review the diff, commit, deploy. Optionally set `SITE_DEPLOY_HOOK_URL` in `cms/.env` so every publish pings your host's build hook.

Every exported file is still validated by `src/content/schema.ts` at build time and by `npm test`.

- **Landing**: every text, link, FAQ item, hero slide and SEO field, one document per language.
- **Media**: upload once, pick anywhere; Astro optimises at build time. The media `slug` is its id.
- **Settings** (global): site name/URL, theme colour, demo-request endpoint, organisation data, social image.
- **Markets**, **News** (rich text, drafts), **Users** (`admin` / `editor` roles), **Leads** (staff only).

### Production

- Use Postgres (`DATABASE_URL=postgres://…`) and set a strong `PAYLOAD_SECRET`.
- Uploads go to `cms/media` on local disk; on ephemeral hosts add an object-storage adapter.
- Deploy `cms/` as a Next.js app (`npm run build && npm run start` inside `cms/`).

### News

- Written in the **News** collection; exported to `src/content/news/<slug>.md` as Markdown. Unpublished drafts are skipped.
- URLs: `/news/` (9 per page), `/news/<slug>/`, feed at `/news/rss.xml`. Other locales use `/<locale>/news/…`.
- The three posts shipped are sample content to replace.

### Leads (contact form)

- The form posts to the CMS endpoint `POST /api/lead` (`cms/src/lib/leads-endpoint.ts`): validates the number, honeypot, 2 KB limit, 5 requests / 10 min per IP, duplicates ignored for 10 minutes, CORS limited to `siteUrl` plus `LEADS_ALLOWED_ORIGINS`.
- Leads are stored in the private `leads` collection (status, note) and are visible to staff only. They never touch the public repo; `scripts/protect-leads.mjs` and `npm test` remain as a safeguard.
- Set **Settings → Demo request endpoint** to `https://CMS-HOST/api/lead` (or `PUBLIC_DEMO_ENDPOINT`). In dev the form defaults to `http://localhost:3000/api/lead`.

### Markets map (`/bozorlar/`)

The "Bozorlar" menu item and the globe section's button open an interactive map of Uzbekistan with one dot per market and a side panel per region. It is the only React island on the site; districts outlines load on demand when a region is opened.

- **Content → Markets (map)**: one entry per market with name, region, type (dehqon / buyum / avtomobil), a branch flag and the map position. Create, edit or delete entries here; every count on the map (per region and per type) is computed from these files at build time, so nothing else needs updating.
- **Positioning**: open `/bozorlar/?pick` on the site (dev server or the live site), click where the market is and copy the X and Y values into the entry. A market saved without coordinates is drawn next to its region's label and marked with a dashed ring in picker mode until it gets a position.
- **Text and names**: the page title, intro, every label of the map and the region names are in **Landing pages → Markets map page**, so they can be translated per language like the rest of the copy. Market names are shown as entered.
- The outlines (`src/components/map/shapes.ts`, `districts.ts`) are 2020 UN OCHA / geoBoundaries data and are not editable in the CMS.

### Analytics (Google Tag Manager, Yandex Metrika)

In the CMS open **Site settings** and fill **Google Tag Manager ID** (`GTM-XXXXXXX`) and/or **Yandex Metrika counter ID** (digits), then `npm run content:pull` and rebuild. Empty means disabled. The loader is `src/scripts/analytics.ts` (no inline scripts), and the build adds only the needed hosts to the Content-Security-Policy in `_headers`. If GTM tags load other domains or use Custom HTML tags, extend the policy in `src/integrations/build-extras.ts`. Yandex Webvisor is off by default.

### Languages

The site ships in **Oʻzbek (default, `/`)**, **Русский (`/ru/`)** and **English (`/en/`)**. Each language is one Landing document (files `src/content/landing/{uz,ru,en}.json`) covering the whole page: SEO, navigation, hero, sections, map, news, FAQ, contact, footer, 404 and the **Legal pages** tab (offer and privacy policy). News posts carry a `locale` and are written per language. The nav has a language switcher; news posts have different slugs per language, so switching from a post opens the news list of the other language. Market and district names are shown as entered (Uzbek). The 404 page is shared by all languages. The legal texts are drafts: have a lawyer review them.

### Adding a language

1. In the CMS create a new Landing document with a new locale code (duplicate an existing one and translate, including the Legal pages tab).
2. `npm run content:pull`, rebuild. The page is served at `/ru/`, `hreflang` links and the sitemap update automatically. The default locale (from Site settings) stays at `/`.

Locale routing is implemented in `src/pages/[locale]/index.astro` and `src/lib/content.ts` instead of Astro's `i18n` option.

## Deployment

`npm run build` produces a fully static `dist/`. Upload it to any static host (Netlify, Cloudflare Pages, Vercel, nginx, S3).

- `dist/_headers` (generated) carries cache rules and a strict Content-Security-Policy, picked up automatically by Netlify and Cloudflare Pages. On other hosts copy the values into the server config. The CSP allows scripts only from the site itself plus a hash of the one inline script.
- Set `SITE_URL` in the build environment (or `siteUrl` in Site settings) to the real domain — it drives canonical URLs, Open Graph and the sitemap.
- Optional: `PUBLIC_DEMO_ENDPOINT` overrides the demo-request endpoint per environment.

CI (`.github/workflows/ci.yml`) runs `npm run verify` on every push and PR and uploads `dist/` as an artifact.

## Demo request form

The form posts `{"phone": "+998901234567"}` as JSON to the endpoint set in Site settings (or `PUBLIC_DEMO_ENDPOINT`). It validates the number, shows a message for invalid input / network failure / success, carries `aria-invalid` and a live status region, and has a honeypot plus a time-to-submit guard against bots. It also dispatches a `demo:request` DOM event on the form for custom integrations. With no endpoint it stays in demo mode and logs to the console.

The endpoint must answer CORS preflight requests from the site origin and return a 2xx status.

## Launch checklist

Every `npm run build` reports a missing form endpoint (and a non-https site URL) as warnings. Set `STRICT_BUILD=true` on the production deploy to turn them into a failed build.

- [ ] Set the real domain in Site settings (currently `https://raqamli-bozor.uz`) or `SITE_URL`.
- [ ] Set the demo-request endpoint.
- [ ] Fill the links that had no destination in the Framer design: "Profilga kirish" (app login), "Barchasini koʻrish" (markets list), and the five footer documents. Items without a link render as plain text, so nothing is a dead link in the meantime.
- [ ] Gilroy is self-hosted without a purchased licence for now. Buy one or swap `--font` in `src/styles/global.css` for a free font before a public launch (Inter, already bundled, is SIL OFL).
- [ ] Add analytics if needed (the CSP `script-src` / `connect-src` must then list its host).

## What changed from the previous build

| Area                                   | Before                                             | Now                                                                                                                                                                       |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page weight (first paint / full visit) | 1.4 MB / 8.9 MB                                    | ~0.4 MB / ~4.5 MB (3.6 MB of that is the globe animation, loaded only near the section and skipped on data-saver connections)                                             |
| Images                                 | 8 MB of PNGs at 2–4× the rendered size             | WebP/AVIF at rendered sizes with `srcset`; hero preloads per breakpoint; only the current breakpoint's hero images are warmed                                             |
| Contrast                               | White on orange 2.1:1, green buttons 4.2:1         | Dark text on orange, a 5.5:1 green for white text, 5.9:1 green for form text (`--on-orange`, `--green-700`, `--green-ink` in `src/styles/global.css`)                     |
| Rotating headline                      | No way to pause; ran forever                       | Pause/resume button, pauses off-screen and in hidden tabs, no autoplay under `prefers-reduced-motion`                                                                     |
| Phone navigation                       | Links hidden, no menu                              | Accessible hamburger panel (focus management, Escape, outside click)                                                                                                      |
| Form errors                            | Colour only                                        | Visible messages, `aria-invalid`, live region; distinct network error; spam guard                                                                                         |
| SEO                                    | Title only                                         | Descriptive title, canonical, Open Graph + Twitter image, hreflang, sitemap, robots.txt, JSON-LD (Organization, WebSite, WebPage, FAQPage), PNG/Apple icons, web manifest |
| Dead links                             | 8 placeholder `href="#"`                           | CMS links; empty ones render as text                                                                                                                                      |
| Uzbek typography                       | Four different apostrophe characters               | ʻ (U+02BB) and ʼ (U+02BC) everywhere, enforced by a test                                                                                                                  |
| Copy                                   | "nazorati qilish", "Uy hayvonlari"                 | "nazorati", "Chorva mollari" (editable in the CMS)                                                                                                                        |
| Layout robustness                      | Fixed heights/widths clipped longer text           | min-heights, max-widths, wrapping list items, CSS grid for the steps section                                                                                              |
| Nav blur                               | 100 px backdrop blur on every scroll frame         | 24 px (visually identical at this opacity)                                                                                                                                |
| Globe                                  | Pointer cursor without an action; 80 frames always | Static first frame as fallback, frames on approach, skipped on `Save-Data`/2G                                                                                             |
| Footer                                 | Inside `<main>`                                    | Top-level landmark; skip link added                                                                                                                                       |
| Security                               | —                                                  | Strict CSP, no inline JS except one hashed script, external stylesheets, immutable cache headers                                                                          |
| Tooling                                | None                                               | TypeScript strict, ESLint, Prettier, Vitest, CI                                                                                                                           |

### Intentional visual deviations

- Orange buttons use dark text; green surfaces behind white text are one shade darker (`#107a18` instead of `#178f20`). Both are single tokens in `src/styles/global.css` if the brand team prefers the original values at the cost of WCAG AA.
- The pause button in the banner's top-right corner is new.
- On phones a menu button appears in the nav bar.
