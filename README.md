# Raqamli Bozor

Multilingual marketing website with a Payload CMS for content, media and demo-request leads.

- **Frontend:** Astro 7, TypeScript and React for the interactive markets map. Production output is static HTML in `dist/`.
- **CMS:** Payload 3 on Next.js 16 in `cms/`, with SQLite locally and a PostgreSQL adapter available for deployment.
- **Languages:** Uzbek at `/`, Russian at `/ru/`, English at `/en/`. Each language has landing, markets, news and legal pages.

The frontend reads exported files, not the CMS API. CMS edits appear on the website after exporting content and rebuilding. The contact form sends requests directly to the CMS.

## Requirements

Node.js **22.22.3 or newer** and npm. `.nvmrc` selects Node 22; use a current patch release.

## Local setup

From the repository root:

```sh
npm ci
npm --prefix cms ci --legacy-peer-deps
cp cms/.env.example cms/.env
```

Set these values in `cms/.env`:

```dotenv
PAYLOAD_SECRET=<random-secret-at-least-32-characters>
DATABASE_URL=
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
LEADS_ALLOWED_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<your-admin-password>
```

Generate a secret with `openssl rand -hex 32`. With `DATABASE_URL` empty, the CMS uses `cms/data/cms.db`. Uploads are stored in `cms/media/`.

Import the bundled content once:

```sh
npm run cms:import
```

The import creates an admin only when both admin credentials are set and no users exist. Otherwise, create the first user through `/admin`. Re-running the import updates existing content, so avoid doing it after editing in the CMS unless you intend to replace those edits.

### Development

Run these in separate terminals:

```sh
npm run cms
```

```sh
npm run dev
```

- Frontend: <http://localhost:4321>
- CMS admin: <http://localhost:3000/admin>

### Local production mode

Build both applications:

```sh
PUBLIC_DEMO_ENDPOINT=http://localhost:3000/api/lead npm run build
npm --prefix cms run build
```

Start the CMS:

```sh
npm --prefix cms run start -- --hostname 127.0.0.1 --port 3000
```

Serve the built frontend:

```sh
npm run preview -- --host 127.0.0.1 --port 4321
```

These use production builds. The HTTP endpoint warning is expected for local testing; leave `STRICT_BUILD` unset or false locally. The frontend must be rebuilt after code or exported content changes.

## Editing and exporting content

The CMS manages landing pages, markets, news, media, site settings and leads. Landing pages and news support drafts; exports skip drafts.

1. Edit and publish content in the CMS.
2. Run `npm run content:pull` from the repository root.
3. Review the generated changes, validate and rebuild the frontend.

The export connects directly to the database configured for `cms/` and reads uploads from `cms/media/`; it does not fetch a remote CMS over HTTP. Run it where the intended database and media files are accessible. It replaces the generated content directories and media assets.

Site settings include the default language, SEO, analytics, custom tags and the demo-request endpoint. Landing documents contain translated copy and legal text. Markets contain the map data; news articles have their own locale.

The **Mobile application** tab on each landing document controls the app section above the contact form: visibility, translated copy, feature list and App Store / Google Play links. Its screenshot is a product asset in `src/assets/ui/mobile-app-home.jpg`.

Leads are stored privately in the CMS. Set the demo-request endpoint in Site settings or override it with `PUBLIC_DEMO_ENDPOINT`. Without an endpoint, the form runs in demo mode and does not store a lead.

## Deployment

Deploy the frontend and CMS as two applications, for example at `https://example.com` and `https://cms.example.com`.

### 1. Configure the CMS

Install dependencies in a checkout that includes `cms/`:

```sh
npm ci
npm --prefix cms ci --legacy-peer-deps
```

Set the CMS environment through the hosting service or `cms/.env`:

```dotenv
PAYLOAD_SECRET=<stable-random-secret-at-least-32-characters>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
LEADS_ALLOWED_ORIGINS=https://example.com
```

Use a persistent database and persistent storage for `cms/media/`. SQLite is also supported with a persistent `cms/data/` directory. The current configuration enables schema push; back up the database before deploying schema changes. An object-storage adapter must be added in code if the host cannot persist uploads.

For a new database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` and run `npm run cms:import` once to seed the repository content and create the admin. Remove the bootstrap credentials from the runtime environment afterward.

Build and start:

```sh
npm --prefix cms run build
npm --prefix cms run start -- --hostname 0.0.0.0 --port 3000
```

Keep the process running with the host's process manager and route the CMS domain to port 3000 through HTTPS. Verify `/admin` before deploying the frontend. Keep the same `PAYLOAD_SECRET` across restarts.

### 2. Export and build the frontend

Export the published CMS content from a checkout with access to the production database and uploaded files:

```sh
npm run content:pull
```

Commit the exported files for a separate frontend build pipeline, or build in the same checkout immediately after the export. Set these frontend build variables:

```dotenv
SITE_URL=https://example.com
PUBLIC_DEMO_ENDPOINT=https://cms.example.com/api/lead
STRICT_BUILD=true
```

Then validate and build:

```sh
npm run verify
```

Upload `dist/` to the static host. No Node.js frontend server is needed in production. Configure directory index serving and `404.html` as the error page.

The build generates `dist/_headers` with security and cache headers. If the host does not support this file, apply its rules in the web server or hosting configuration. The strict build checks for HTTPS URLs, a form endpoint and enabled search indexing.

### 3. Verify and publish updates

Check the home page, `/ru/`, `/en/`, the markets map and news pages. Submit a demo request and confirm it appears in the CMS leads collection. Ensure the frontend origin is allowed by `LEADS_ALLOWED_ORIGINS` and that SEO settings permit indexing for the public site.

For later content updates, publish in the CMS, export again and rebuild/redeploy the frontend. `SITE_DEPLOY_HOOK_URL` can trigger an external build via POST when CMS content changes, but that pipeline must also export the updated content; a rebuild of old exported files will not include CMS edits.

Back up the database and uploaded media together. The CMS currently has no email adapter configured.

## Commands

| Command                          | Purpose                                |
| -------------------------------- | -------------------------------------- |
| `npm run dev`                    | Frontend development server            |
| `npm run cms`                    | CMS development server                 |
| `npm run cms:import`             | Import repository content into the CMS |
| `npm run content:pull`           | Export published CMS content and media |
| `npm run build`                  | Build the static frontend              |
| `npm run preview`                | Serve the frontend build locally       |
| `npm run check`                  | Astro and TypeScript checks            |
| `npm run lint`                   | ESLint                                 |
| `npm test`                       | Vitest tests                           |
| `npm run verify`                 | Checks, lint, tests and frontend build |
| `npm run format:check`           | Check formatting                       |
| `npm --prefix cms run typecheck` | CMS TypeScript check                   |
| `npm --prefix cms run build`     | Build the CMS                          |
| `npm --prefix cms run start`     | Start the production CMS               |

CI validates the frontend, checks formatting, uploads `dist/` as an artifact and type-checks the CMS. It does not deploy either application.

## Project layout

```text
cms/                   Payload/Next.js app, import and export scripts
src/content/           Exported settings, translations, news and markets
src/assets/media/      Exported CMS images
src/components/        Astro components and React markets map
src/layouts/           Shared page layout and metadata
src/pages/             Default and translated routes, feeds and sitemap
src/lib/               Content, routing, SEO and tracking helpers
src/scripts/           Browser interactions
src/styles/            Site styles
src/integrations/      Build checks, headers and asset cleanup
public/                Fonts, icons and globe frames
tests/                Vitest tests
```
