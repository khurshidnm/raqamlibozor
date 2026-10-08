> **Legacy** — this is the previous hand-written static build, kept for reference. The live project is the Astro site in the repository root (see `../README.md`).

# Raqamli Bozor — landing page (static rebuild of the Framer site)

Hand-written HTML/CSS/JS rebuild of `involved-innovation-235021.framer.app`.
No build step, no framework, no Framer runtime — upload the folder to any web host as is.

```
index.html            page markup (all copy lives here)
css/style.css         all styles; breakpoints match the Framer project
js/main.js            behaviour: hero slider, scroll effects, FAQ, form
assets/fonts/         Gilroy (400/500/600/700) and Inter (400/700)
assets/img/           images, logo, favicon, hero pattern
assets/earth/         80 frames of the globe (colour grade already applied)
```

## Preview locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000      # then open http://localhost:8000
```

## Breakpoints

| Layout  | Viewport width      | Notes                                                        |
|---------|---------------------|--------------------------------------------------------------|
| Phone   | up to 809px         | single column, nav shows logo + demo button only             |
| Tablet  | 810 – 1439px        | content is fluid with 25px margins, max 1200px               |
| Desktop | 1440px and wider    | fixed 1440px canvas; on wider screens it is zoomed at half the rate of the extra width (same as the original) |

## Things to connect before going live

1. **Demo request form** (`#demoForm` in `index.html`). It validates a `+998 XX XXX XX XX` number.
   Put your API URL in `data-endpoint=""` and it will `POST` `{"phone": "+998901234567"}` as JSON.
   The form also fires a `demo:request` DOM event if you prefer to handle it yourself.
   With no endpoint set, nothing is sent.
2. **Links that had no destination in Framer** — marked `data-todo="link"` in `index.html`:
   “Sinab ko’rish”, “Profilga kirish”, “Barchasini ko'rish”, and the five footer links.
3. **`<title>` / description / social image.** The Framer site still had the default “My Framer Site”.
   The title is now “Raqamli Bozor” and the description reuses the intro sentence; adjust in `<head>`.

## Where this intentionally differs from the Framer version

- **“Bozorlar” in the menu** scrolls to the “Bizga ishongan bozorlar” block. In Framer it pointed to an anchor that did not exist, so it did nothing.
- **Phone hero:** each headline is shown with its own image. In Framer the phone image list was in a different order than the headlines (for example the parking headline appeared over the cow).
- **Phone hero height is reserved** for the tallest headline, so the page below no longer jumps by one line when the slide changes.
- **Hero tags** (“Xavfsizlik”, “Tekshiruv”…) use Gilroy Medium. Framer asked for a font named “Gilroy” that it never loaded, so visitors saw their system sans-serif instead.
- **The phone field is a real input**; in Framer it was a static text label.
- The “Made in Framer” badge and Framer analytics script are not included.

Design inconsistencies copied as they were (easy to change in `css/style.css`):
the 4th solution card (“Chorva bozori”) keeps desktop text sizes on tablet and phone, and the open FAQ item on phone has a narrower right padding than closed ones.

## Fonts

Gilroy is a commercial typeface. The files here are the ones your designers uploaded to Framer —
check that your licence covers self-hosted web use. Inter is open source (SIL OFL).
