/**
 * Keystatic (git-based headless CMS) schema.
 *
 * Local mode: `npm run dev` → http://127.0.0.1:4321/keystatic (edits are written to src/content).
 * Hosted mode: switch `storage` to GitHub (see README › CMS) and deploy with KEYSTATIC=true.
 *
 * The Astro side validates the same files with Zod in src/content/schema.ts.
 */
import { collection, config, fields, singleton } from '@keystatic/core';

/* ---------- reusable field groups ---------- */

const link = (label: string, description?: string) =>
  fields.object(
    {
      label: fields.text({ label: 'Label', validation: { isRequired: true } }),
      href: fields.text({
        label: 'Link',
        description: 'A URL (https://…) or a page anchor (#boglanish). Leave empty to show the label without a link.',
      }),
    },
    { label, description, layout: [6, 6] },
  );

const mediaRef = (label: string, description?: string) =>
  fields.relationship({ label, description, collection: 'media', validation: { isRequired: true } });

const optionalMediaRef = (label: string, description?: string) =>
  fields.relationship({ label, description, collection: 'media' });

const placement = (label: string, description: string) =>
  fields.object(
    {
      width: fields.integer({ label: 'Width (px)', validation: { isRequired: true, min: 50, max: 3000 } }),
      x: fields.number({
        label: 'X offset (%)',
        description: 'From the banner centre. Negative moves left.',
        validation: { isRequired: true, min: -100, max: 100 },
      }),
      y: fields.number({
        label: 'Y offset (%)',
        description: 'From the banner centre. Negative moves up.',
        validation: { isRequired: true, min: -100, max: 100 },
      }),
    },
    { label, description, layout: [4, 4, 4] },
  );

/* ---------- landing page (one entry per language) ---------- */

const landing = collection({
  label: 'Landing pages',
  path: 'src/content/landing/*',
  slugField: 'language',
  format: { data: 'json' },
  columns: ['lang'],
  entryLayout: 'form',
  schema: {
    language: fields.slug({
      name: { label: 'Language name', description: 'Shown to editors only, e.g. “Oʻzbekcha”.' },
      slug: {
        label: 'Locale code (URL)',
        description: 'uz, ru, en … The default locale lives at “/”, others at “/<code>/”.',
      },
    }),
    lang: fields.text({
      label: 'HTML lang attribute',
      description: 'BCP 47 tag, e.g. uz-Latn, ru, en.',
      validation: { isRequired: true },
    }),

    seo: fields.object(
      {
        title: fields.text({ label: 'Page title', validation: { isRequired: true, length: { max: 70 } } }),
        description: fields.text({
          label: 'Meta description',
          multiline: true,
          validation: { isRequired: true, length: { max: 170 } },
        }),
        ogImage: mediaRef('Social share image', 'Cropped to 1200×630 automatically.'),
        ogTitle: fields.text({
          label: 'Social share title (optional)',
          description: 'Shown when the page is shared on Telegram, Facebook, LinkedIn … Falls back to the page title.',
          validation: { length: { max: 95 } },
        }),
        ogDescription: fields.text({
          label: 'Social share description (optional)',
          description: 'Falls back to the meta description.',
          multiline: true,
          validation: { length: { max: 200 } },
        }),
        canonical: fields.url({
          label: 'Canonical URL (optional)',
          description:
            'Only set this when the page is a copy of another address. Leave empty to use the page’s own URL.',
        }),
        noindex: fields.checkbox({
          label: 'Hide this page from search engines (noindex)',
          description: 'Also removes it from the sitemap.',
          defaultValue: false,
        }),
      },
      { label: 'SEO' },
    ),

    nav: fields.object(
      {
        links: fields.array(link('Link'), {
          label: 'Menu links',
          itemLabel: (props) => props.fields.label.value,
          validation: { length: { min: 1, max: 7 } },
        }),
        cta: link('Call to action button'),
      },
      { label: 'Navigation' },
    ),

    hero: fields.object(
      {
        intervalMs: fields.integer({
          label: 'Slide interval (ms)',
          defaultValue: 2000,
          validation: { isRequired: true, min: 1000, max: 15000 },
        }),
        buttons: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            href: fields.text({ label: 'Link', description: 'Falls back to the contact section when empty.' }),
            variant: fields.select({
              label: 'Colour',
              options: [
                { label: 'Orange', value: 'orange' },
                { label: 'Green', value: 'green' },
              ],
              defaultValue: 'orange',
            }),
          }),
          { label: 'Buttons', itemLabel: (props) => props.fields.label.value, validation: { length: { max: 3 } } },
        ),
        slides: fields.array(
          fields.object({
            title: fields.text({
              label: 'Headline',
              description: 'Use a line break where the headline should wrap.',
              multiline: true,
              validation: { isRequired: true },
            }),
            image: mediaRef('Image (desktop & tablet)'),
            imageMobile: mediaRef('Image (phone)'),
            desktop: placement('Desktop placement', 'Position of the image inside the banner on screens ≥ 810px.'),
            mobile: placement('Phone placement', 'Position of the image inside the banner on phones.'),
            tags: fields.array(
              fields.object(
                {
                  label: fields.text({ label: 'Text', validation: { isRequired: true } }),
                  x: fields.number({ label: 'X (%)', validation: { isRequired: true, min: -100, max: 100 } }),
                  y: fields.number({ label: 'Y (%)', validation: { isRequired: true, min: -100, max: 100 } }),
                },
                { layout: [6, 3, 3] },
              ),
              {
                label: 'Floating tags (desktop only)',
                itemLabel: (props) => props.fields.label.value,
                validation: { length: { max: 4 } },
              },
            ),
          }),
          {
            label: 'Slides',
            itemLabel: (props) => props.fields.title.value.split('\n').join(' '),
            validation: { length: { min: 1 } },
          },
        ),
      },
      { label: 'Hero' },
    ),

    intro: fields.object(
      {
        rows: fields.array(
          fields.object({
            segments: fields.array(
              fields.object(
                {
                  text: fields.text({ label: 'Text', validation: { isRequired: true } }),
                  style: fields.select({
                    label: 'Style',
                    options: [
                      { label: 'Plain', value: 'plain' },
                      { label: 'Muted', value: 'muted' },
                      { label: 'Green chip', value: 'chip-green' },
                      { label: 'Orange chip', value: 'chip-orange' },
                    ],
                    defaultValue: 'plain',
                  }),
                },
                { layout: [8, 4] },
              ),
              { label: 'Segments', itemLabel: (props) => props.fields.text.value },
            ),
          }),
          {
            label: 'Rows (desktop line breaks; phones re-flow automatically)',
            itemLabel: (props) => props.fields.segments.elements.map((segment) => segment.fields.text.value).join(' '),
          },
        ),
      },
      { label: 'Intro sentence' },
    ),

    features: fields.object(
      {
        pill: fields.text({ label: 'Pill', validation: { isRequired: true } }),
        title: fields.text({ label: 'Title', multiline: true, validation: { isRequired: true } }),
        cards: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            visual: fields.select({
              label: 'Animated visual',
              options: [
                { label: 'Dashboard card', value: 'dashboard' },
                { label: 'Payment notifications', value: 'notifications' },
                { label: 'Orbiting icons', value: 'orbit' },
                { label: 'Document tiles', value: 'tiles' },
              ],
              defaultValue: 'dashboard',
            }),
            wideLabel: fields.checkbox({ label: 'Wider label column', defaultValue: false }),
          }),
          {
            label: 'Cards',
            itemLabel: (props) => props.fields.label.value,
            validation: { length: { min: 1, max: 6 } },
          },
        ),
        notifications: fields.array(
          fields.object(
            {
              title: fields.text({ label: 'Title', validation: { isRequired: true } }),
              meta: fields.text({ label: 'Subtitle', validation: { isRequired: true } }),
              amount: fields.text({ label: 'Amount', validation: { isRequired: true } }),
            },
            { layout: [5, 5, 2] },
          ),
          {
            label: 'Payment notifications (used by that visual)',
            itemLabel: (props) => `${props.fields.meta.value} · ${props.fields.amount.value}`,
          },
        ),
      },
      { label: 'Features' },
    ),

    solutions: fields.object(
      {
        cta: link('Card button'),
        cards: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            description: fields.text({ label: 'Description', multiline: true, validation: { isRequired: true } }),
            items: fields.array(fields.text({ label: 'Item' }), {
              label: 'Bullet list',
              itemLabel: (props) => props.value,
            }),
            image: mediaRef('Illustration'),
            side: fields.select({
              label: 'Text side',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              defaultValue: 'left',
            }),
          }),
          {
            label: 'Cards',
            itemLabel: (props) => props.fields.title.value,
            validation: { length: { min: 1, max: 6 } },
          },
        ),
      },
      { label: 'Solutions' },
    ),

    steps: fields.object(
      {
        pill: fields.text({ label: 'Pill', validation: { isRequired: true } }),
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        items: fields.array(
          fields.object({
            title: fields.text({ label: 'Title', multiline: true, validation: { isRequired: true } }),
            description: fields.text({ label: 'Description', multiline: true, validation: { isRequired: true } }),
            icon: mediaRef('Icon'),
          }),
          {
            label: 'Steps',
            itemLabel: (props) => props.fields.title.value.split('\n').join(' '),
            validation: { length: { min: 1, max: 3 } },
          },
        ),
      },
      { label: 'Implementation steps' },
    ),

    markets: fields.object(
      {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        cta: link('Button', 'Hidden while the link is empty.'),
      },
      { label: 'Markets (globe)' },
    ),

    news: fields.object(
      {
        label: fields.text({ label: 'Section name', validation: { isRequired: true } }),
        pill: fields.text({ label: 'Pill', validation: { isRequired: true } }),
        title: fields.text({ label: 'Home page section title', validation: { isRequired: true } }),
        listTitle: fields.text({ label: 'News page title', validation: { isRequired: true } }),
        metaTitle: fields.text({
          label: 'News page SEO title (optional)',
          description: 'Search-result title of the news list. Falls back to the news page title.',
          validation: { length: { max: 70 } },
        }),
        listDescription: fields.text({
          label: 'News page description (also the meta description)',
          multiline: true,
          validation: { isRequired: true, length: { max: 170 } },
        }),
        viewAll: fields.text({ label: '“All news” button', validation: { isRequired: true } }),
        readMore: fields.text({ label: '“Read more” label', validation: { isRequired: true } }),
        back: fields.text({ label: 'Back link on an article', validation: { isRequired: true } }),
        more: fields.text({ label: '“Other news” heading', validation: { isRequired: true } }),
        empty: fields.text({ label: 'Empty-list message', validation: { isRequired: true } }),
        prev: fields.text({ label: 'Previous page', validation: { isRequired: true } }),
        next: fields.text({ label: 'Next page', validation: { isRequired: true } }),
        pageOf: fields.text({
          label: 'Page counter',
          description: '{current} and {total} are replaced.',
          validation: { isRequired: true },
        }),
      },
      { label: 'News section' },
    ),

    faq: fields.object(
      {
        pill: fields.text({ label: 'Pill', validation: { isRequired: true } }),
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        items: fields.array(
          fields.object({
            question: fields.text({ label: 'Question', validation: { isRequired: true } }),
            answer: fields.text({ label: 'Answer', multiline: true, validation: { isRequired: true } }),
          }),
          { label: 'Questions', itemLabel: (props) => props.fields.question.value, validation: { length: { min: 1 } } },
        ),
      },
      { label: 'FAQ' },
    ),

    contact: fields.object(
      {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        image: mediaRef('Background illustration'),
        form: fields.object(
          {
            label: fields.text({ label: 'Field label (screen readers)', validation: { isRequired: true } }),
            placeholder: fields.text({ label: 'Placeholder', validation: { isRequired: true } }),
            submit: fields.text({ label: 'Submit button', validation: { isRequired: true } }),
            sending: fields.text({ label: 'While sending', validation: { isRequired: true } }),
            success: fields.text({ label: 'Success message', validation: { isRequired: true } }),
            invalid: fields.text({ label: 'Invalid number message', validation: { isRequired: true } }),
            networkError: fields.text({ label: 'Sending failed message', validation: { isRequired: true } }),
          },
          { label: 'Demo request form' },
        ),
      },
      { label: 'Contact' },
    ),

    footer: fields.object(
      {
        brand: fields.text({ label: 'Brand line', validation: { isRequired: true } }),
        columns: fields.array(
          fields.object({
            links: fields.array(link('Link'), { label: 'Links', itemLabel: (props) => props.fields.label.value }),
          }),
          {
            label: 'Link columns',
            itemLabel: (props) => `${props.fields.links.elements.length} links`,
            validation: { length: { max: 4 } },
          },
        ),
        copyright: fields.text({
          label: 'Copyright line',
          description: '{year} is replaced with the current year at build time.',
          validation: { isRequired: true },
        }),
        madeBy: link('“Made by” credit'),
      },
      { label: 'Footer' },
    ),

    a11y: fields.object(
      {
        skipToContent: fields.text({ label: 'Skip link', validation: { isRequired: true } }),
        mainMenu: fields.text({ label: 'Main menu landmark name', validation: { isRequired: true } }),
        menuOpen: fields.text({ label: 'Open menu button', validation: { isRequired: true } }),
        menuClose: fields.text({ label: 'Close menu button', validation: { isRequired: true } }),
        sliderPause: fields.text({ label: 'Pause headline rotation', validation: { isRequired: true } }),
        sliderPlay: fields.text({ label: 'Resume headline rotation', validation: { isRequired: true } }),
        globeLabel: fields.text({ label: 'Globe image description', validation: { isRequired: true } }),
      },
      { label: 'Accessibility labels' },
    ),

    notFound: fields.object(
      {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        text: fields.text({ label: 'Text', validation: { isRequired: true } }),
        back: fields.text({ label: 'Back-home link', validation: { isRequired: true } }),
      },
      { label: '404 page' },
    ),
  },
});

/* ---------- news posts ---------- */

const news = collection({
  label: 'News',
  path: 'src/content/news/*',
  slugField: 'title',
  format: { contentField: 'body' },
  columns: ['publishedAt', 'locale'],
  entryLayout: 'content',
  schema: {
    title: fields.slug({
      name: { label: 'Title', validation: { isRequired: true, length: { max: 120 } } },
      slug: { label: 'URL slug', description: 'Becomes /news/<slug>/. Keep it short, lowercase, hyphenated.' },
    }),
    locale: fields.select({
      label: 'Language',
      description: 'Must match a landing page entry (its locale code).',
      options: [
        { label: 'Oʻzbekcha (uz)', value: 'uz' },
        { label: 'Русский (ru)', value: 'ru' },
        { label: 'English (en)', value: 'en' },
      ],
      defaultValue: 'uz',
    }),
    publishedAt: fields.date({
      label: 'Published on',
      defaultValue: { kind: 'today' },
      validation: { isRequired: true },
    }),
    excerpt: fields.text({
      label: 'Excerpt',
      description: 'Shown on cards, as the article lead and as the meta description.',
      multiline: true,
      validation: { isRequired: true, length: { max: 300 } },
    }),
    cover: mediaRef('Cover image', 'Cropped to 16:10 on cards and 2:1 on the article.'),
    updatedAt: fields.date({
      label: 'Last updated on (optional)',
      description:
        'Set when you materially edit a published article. Used for “modified” in search results and the sitemap.',
    }),
    author: fields.text({
      label: 'Author (optional)',
      description: 'Shown to search engines as the article author. Leave empty to credit the organisation.',
    }),
    seo: fields.object(
      {
        metaTitle: fields.text({
          label: 'SEO title (optional)',
          description: 'Search-result title. Falls back to the article title. Aim for under 60 characters.',
          validation: { length: { max: 70 } },
        }),
        metaDescription: fields.text({
          label: 'Meta description (optional)',
          description: 'Search-result snippet, 120–160 characters. Falls back to the excerpt.',
          multiline: true,
          validation: { length: { max: 170 } },
        }),
        ogImage: optionalMediaRef('Social share image (optional)', 'Falls back to the cover image.'),
        canonical: fields.url({
          label: 'Canonical URL (optional)',
          description: 'Only for articles republished from another address.',
        }),
        noindex: fields.checkbox({
          label: 'Hide this article from search engines (noindex)',
          description: 'Also removes it from the sitemap and RSS feed.',
          defaultValue: false,
        }),
      },
      { label: 'SEO' },
    ),
    draft: fields.checkbox({
      label: 'Draft',
      description: 'Drafts are visible in the dev server only and never published.',
      defaultValue: false,
    }),
    body: fields.markdoc({
      label: 'Body',
      extension: 'md',
      options: {
        heading: [2, 3],
        table: false,
        image: { directory: 'public/news', publicPath: '/news/' },
      },
    }),
  },
});

/* ---------- media library ---------- */

const media = collection({
  label: 'Media library',
  path: 'src/content/media/*',
  slugField: 'title',
  format: { data: 'json' },
  columns: ['alt'],
  schema: {
    title: fields.slug({ name: { label: 'Name' } }),
    image: fields.image({
      label: 'File',
      description: 'PNG with transparency, JPEG or WebP. Astro converts and resizes it at build time.',
      directory: 'src/assets/media',
      publicPath: '/src/assets/media/',
      validation: { isRequired: true },
    }),
    alt: fields.text({ label: 'Alt text', description: 'Leave empty for purely decorative images.' }),
  },
});

/* ---------- site settings ---------- */

const settings = singleton({
  label: 'Site settings',
  path: 'src/content/settings',
  format: { data: 'json' },
  schema: {
    siteName: fields.text({ label: 'Site name', validation: { isRequired: true } }),
    siteUrl: fields.url({
      label: 'Public URL',
      description: 'Used for canonical links, Open Graph and the sitemap.',
      validation: { isRequired: true },
    }),
    defaultLocale: fields.text({
      label: 'Default locale code',
      description: 'Must match a landing page entry, e.g. uz.',
      validation: { isRequired: true },
    }),
    themeColor: fields.text({
      label: 'Theme colour (hex)',
      validation: {
        isRequired: true,
        pattern: { regex: /^#[0-9a-fA-F]{6}$/, message: 'Use a 6-digit hex colour like #178f20' },
      },
    }),
    demoEndpoint: fields.text({
      label: 'Demo request endpoint',
      description:
        'HTTPS URL that accepts POST {"phone": "+998901234567"} as JSON. Leave empty to keep the form in demo mode.',
    }),
    organization: fields.object(
      {
        name: fields.text({ label: 'Name', validation: { isRequired: true } }),
        url: fields.url({ label: 'Website', validation: { isRequired: true } }),
        email: fields.text({ label: 'Contact email (optional)' }),
        phone: fields.text({
          label: 'Contact phone (optional)',
          description: 'International format, e.g. +998 71 000 00 00.',
        }),
      },
      { label: 'Organisation (structured data)', layout: [6, 6, 6, 6] },
    ),
    seo: fields.object(
      {
        indexable: fields.checkbox({
          label: 'Allow search engines to index the site',
          description:
            'Turn off on staging or before launch: adds noindex to every page, blocks robots.txt and empties the sitemap.',
          defaultValue: true,
        }),
        titleTemplate: fields.text({
          label: 'Page title template',
          description: 'Used for news and utility pages. %s is the page title, {siteName} the site name.',
          defaultValue: '%s — {siteName}',
          validation: { isRequired: true },
        }),
        twitterSite: fields.text({ label: 'X / Twitter handle (optional)', description: 'For example @raqamlibozor.' }),
        socials: fields.array(
          fields.object({ url: fields.url({ label: 'Profile URL', validation: { isRequired: true } }) }),
          {
            label: 'Social profiles',
            description:
              'Telegram, Instagram, Facebook, YouTube, LinkedIn … Reported to search engines as the organisation’s official profiles.',
            itemLabel: (props) => props.fields.url.value ?? '',
          },
        ),
        verification: fields.object(
          {
            google: fields.text({
              label: 'Google Search Console',
              description: 'Only the content value of the google-site-verification tag.',
            }),
            yandex: fields.text({
              label: 'Yandex Webmaster',
              description: 'Only the content value of the yandex-verification tag.',
            }),
            bing: fields.text({ label: 'Bing Webmaster (msvalidate.01)' }),
            facebook: fields.text({ label: 'Meta domain verification' }),
            pinterest: fields.text({ label: 'Pinterest (p:domain_verify)' }),
          },
          { label: 'Search-engine verification codes' },
        ),
        customMeta: fields.array(
          fields.object(
            {
              name: fields.text({ label: 'Name', validation: { isRequired: true } }),
              content: fields.text({ label: 'Content' }),
            },
            { layout: [4, 8] },
          ),
          {
            label: 'Other meta tags',
            description: 'Any other <meta name="…" content="…"> tag, for example from Mail.ru, Naver or Baidu.',
            itemLabel: (props) => props.fields.name.value,
          },
        ),
        robotsExtra: fields.text({
          label: 'Extra robots.txt rules',
          description: 'Appended under “User-agent: *”, for example Disallow: /private/',
          multiline: true,
        }),
      },
      { label: 'SEO' },
    ),
    tracking: fields.object(
      {
        gtm: fields.text({
          label: 'Google Tag Manager',
          description: 'Container ID, e.g. GTM-ABC1234. Recommended: manage every other tag inside GTM.',
          validation: { pattern: { regex: /^(GTM-[A-Z0-9]{4,10})?$/, message: 'Use an ID like GTM-ABC1234' } },
        }),
        ga4: fields.text({
          label: 'Google Analytics 4',
          description: 'Measurement ID, e.g. G-ABCDE12345. Skip it when GA4 is already loaded through GTM.',
          validation: { pattern: { regex: /^(G-[A-Z0-9]{6,12})?$/, message: 'Use an ID like G-ABCDE12345' } },
        }),
        yandexMetrica: fields.text({
          label: 'Yandex Metrica',
          description: 'Counter number, digits only.',
          validation: { pattern: { regex: /^(\d{5,20})?$/, message: 'Digits only' } },
        }),
        metaPixel: fields.text({
          label: 'Meta (Facebook) Pixel',
          description: 'Pixel ID, digits only.',
          validation: { pattern: { regex: /^(\d{5,20})?$/, message: 'Digits only' } },
        }),
        customHead: fields.text({
          label: 'Custom code for <head>',
          description:
            'Any other tag (TikTok, LinkedIn, Hotjar, Mail.ru …). Pasted code runs on every page. Add its domains below.',
          multiline: true,
        }),
        customBodyStart: fields.text({
          label: 'Custom code after <body>',
          description: 'For <noscript> fallbacks required by some providers.',
          multiline: true,
        }),
        cspHosts: fields.array(
          fields.object({
            host: fields.text({
              label: 'Host',
              description: 'https://example.com or https://*.example.com',
              validation: {
                isRequired: true,
                pattern: {
                  regex: /^https:\/\/(\*\.)?[a-z0-9.-]+\.[a-z]{2,}(:\d+)?$/i,
                  message: 'Use https://host.example',
                },
              },
            }),
          }),
          {
            label: 'Allowed domains for custom code',
            description:
              'The Content-Security-Policy blocks scripts from unknown domains; list every domain the custom code loads from or sends data to.',
            itemLabel: (props) => props.fields.host.value,
          },
        ),
      },
      { label: 'Analytics & tags (production only)' },
    ),
    socialImage: mediaRef('Default social share image'),
    globeFrames: fields.integer({
      label: 'Globe frame count',
      description: 'Frames live in public/earth/earth-NN.webp',
      defaultValue: 80,
      validation: { isRequired: true, min: 1, max: 999 },
    }),
  },
});

export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'Raqamli Bozor' },
    navigation: {
      Content: ['landing', 'news'],
      Assets: ['media'],
      Site: ['settings'],
    },
  },
  collections: { landing, news, media },
  singletons: { settings },
});
