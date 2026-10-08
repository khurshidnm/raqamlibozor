# Raqamli Bozor — marketing site

Astro 7 + TypeScript static site with a git-based headless CMS (Keystatic). Visitors get plain HTML, CSS and a few small ES modules — no framework runtime. Editors get an admin UI at `/keystatic` that writes to the JSON files in `src/content/`.

The previous hand-written build is kept in [`legacy/`](legacy/) for reference and can be deleted once this version is live.

## Stack and why

| Concern   | Choice                    | Reason                                                                                                                                                                                                                                               |
| --------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | **Astro 7**               | Zero JS by default, build-time image optimisation, content collections with Zod validation, i18n routing, static output that uploads anywhere. Next.js would ship a React runtime for a page that needs none.                                        |
| Language  | **TypeScript (strict)**   | All behaviour lives in `src/scripts/*.ts`; content is typed end-to-end from the CMS schema to the templates.                                                                                                                                         |
| CMS       | **Keystatic** (git-based) | Content stays in the repo (reviewable, versioned, no vendor lock-in, no hosting bill). Local mode needs nothing; GitHub mode gives editors a hosted UI. Swapping to Sanity/Strapi later only means replacing the loaders in `src/content.config.ts`. |
| Images    | `astro:assets` (sharp)    | Source PNGs are converted to WebP/AVIF at the sizes the layout actually renders.                                                                                                                                                                     |
| Tests     | Vitest                    | Phone-mask logic and CMS content rules.                                                                                                                                                                                                              |

Alternatives considered: **Sanity** (best hosted editing UX, external service and a project ID per environment), **Strapi/Directus/Payload** (self-hosted servers and a database for a single page), **Next.js + Contentful** (heavier runtime and two paid services). Any of them plugs into the same Astro content layer if the team outgrows git-based editing.

## Requirements

- Node 22.12+ (see `.nvmrc`)
- npm 9+

## Commands

| Command                           | What it does                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `npm install`                     | Install dependencies                                                                |
| `npm run dev`                     | Dev server at http://127.0.0.1:4321 with the CMS at http://127.0.0.1:4321/keystatic |
| `npm run build`                   | Static production build into `dist/`                                                |
| `npm run preview`                 | Serve `dist/` locally                                                               |
| `npm run check`                   | Astro + TypeScript type-check                                                       |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                                   |
| `npm test`                        | Vitest (phone mask, content validation)                                             |
| `npm run verify`                  | check + lint + test + build (what CI runs)                                          |
| `npm run icons`                   | Regenerate PNG icons from `public/favicon.svg`                                      |

## Project structure

```
astro.config.ts           site URL, i18n locales (from content), integrations
keystatic.config.ts       CMS schema (what editors see)
src/
  content.config.ts       Astro collections: media, landing, settings
  content/
    schema.ts             Zod schemas shared by Astro and the tests
    settings.json         site-wide settings (singleton)
    landing/uz.json       all copy for one locale (one file per language)
    news/*.md             news posts (front matter + Markdown body)
    media/*.json          media library entries → src/assets/media/<slug>/image.*
  assets/media/           CMS-managed images (optimised at build time)
  assets/ui/              code-managed SVGs (logo, hero pattern, dashboard card)
  components/             one .astro per section + Icon
  layouts/Base.astro      <head>: SEO, Open Graph, hreflang, icons, preloads, JSON-LD
  lib/                    typed content access, phone mask, JSON-LD, hero image variants
  scripts/                client behaviour (TypeScript, bundled per component)
  styles/                 global tokens + one stylesheet per section
  integrations/           build step: CSP `_headers` + pruning of unreferenced images
  pages/                  index, [locale]/index, news/*, [locale]/news/*, 404, robots.txt
public/                   fonts, globe frames (earth/), icons, manifest
tests/                    Vitest
legacy/                   previous static build (reference only)
```

## Editing content

### Local (default)

```
npm run dev
```

Open http://127.0.0.1:4321/keystatic. Changes are written straight to `src/content/` and `src/assets/media/`; the site hot-reloads. Commit the changes like code.

- **Content → Landing pages**: every text, link, FAQ item, hero slide and SEO field. One entry per language.
- **Assets → Media library**: upload an image once, give it a name, then pick it anywhere (hero slides, solution cards, step icons, CTA background, social image). Astro resizes and converts it at build time.
- **Site → Site settings**: site name and public URL, default locale, theme colour, demo-request endpoint, organisation data for structured data, social share image.

Every file is validated by `src/content/schema.ts` at build time and by `npm test`, so a broken edit fails the build with a readable message instead of shipping.

### Hosted editing (GitHub mode)

1. In `keystatic.config.ts` set `storage: { kind: 'github', repo: 'owner/name' }`.
2. Run `npm run dev`, open `/keystatic` and follow the one-time GitHub App setup. It writes `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` to `.env`.
3. Deploy a second, server-rendered instance for editors: `npm i @astrojs/node`, add `adapter: node({ mode: 'standalone' })` to `astro.config.ts`, and build with `KEYSTATIC=true npm run build`. The public site keeps using the plain static build.

Editors with write access to the repository log in with GitHub; every save becomes a commit (optionally on a branch), and CI rebuilds the site.

### News

- **Content → News**: one entry per article with title, language, date, excerpt, cover (from the Media library), a draft flag and a rich-text body. The body is stored as plain Markdown in `src/content/news/<slug>.md` and rendered by Astro; the editor is limited to headings, lists, quotes, links, images and code so the output stays portable.
- Images inserted into the body are uploaded to `public/news/` and served as-is. Cover images go through the Media library and are optimised.
- Drafts show in `npm run dev` and are excluded from builds.
- URLs: `/news/` (9 per page, then `/news/page/2/`), `/news/<slug>/`, feed at `/news/rss.xml`. Other locales use `/<locale>/news/…`. The home page shows the three latest posts when any exist.
- The three posts shipped in `src/content/news/` are sample content to replace.

### Adding a language

1. Copy `src/content/landing/uz.json` to `ru.json`, translate, set `"lang": "ru"`.
2. Rebuild. The page is served at `/ru/`, `hreflang` links and the sitemap update automatically. The default locale (from Site settings) stays at `/`.

Locale routing is implemented in `src/pages/[locale]/index.astro` and `src/lib/content.ts` instead of Astro's `i18n` option, whose dev-time middleware would 404 the Keystatic URL for an entry named like a locale.

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

- [ ] Set the real domain in Site settings (currently `https://raqamlibozor.uz` as a placeholder) or `SITE_URL`.
- [ ] Set the demo-request endpoint.
- [ ] Fill the links that had no destination in the Framer design: "Profilga kirish" (app login), "Barchasini koʻrish" (markets list), and the five footer documents. Items without a link render as plain text, so nothing is a dead link in the meantime.
- [ ] Confirm the Gilroy web-font licence covers self-hosting (Inter is SIL OFL).
- [ ] Add analytics if needed (the CSP `script-src` / `connect-src` must then list its host).
- [ ] Delete `legacy/` once the new site is live.

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
