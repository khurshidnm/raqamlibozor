/**
 * Zod schemas for the CMS content. Kept framework-free so the same
 * definitions validate the JSON files in Vitest and in Astro's content layer
 * (content.config.ts passes `reference('media')` / `image()` in for the
 * media-typed fields).
 */
import { z } from 'astro/zod';

export const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().default(''),
});
export type Link = z.infer<typeof linkSchema>;

export const placementSchema = z.object({
  width: z.number().positive(),
  x: z.number(),
  y: z.number(),
});
export type Placement = z.infer<typeof placementSchema>;

export const tagSchema = z.object({ label: z.string().min(1), x: z.number(), y: z.number() });
export type Tag = z.infer<typeof tagSchema>;

export const introStyles = ['plain', 'muted', 'chip-green', 'chip-orange'] as const;
export type IntroStyle = (typeof introStyles)[number];

export const featureVisuals = ['dashboard', 'notifications', 'orbit', 'tiles'] as const;
export type FeatureVisual = (typeof featureVisuals)[number];

export const newsStringsSchema = z.object({
  label: z.string().min(1),
  pill: z.string().min(1),
  title: z.string().min(1),
  listTitle: z.string().min(1),
  listDescription: z.string().min(1).max(170),
  viewAll: z.string().min(1),
  readMore: z.string().min(1),
  back: z.string().min(1),
  more: z.string().min(1),
  empty: z.string().min(1),
  prev: z.string().min(1),
  next: z.string().min(1),
  pageOf: z.string().min(1),
});

export function landingSchema<M extends z.ZodType>(media: M) {
  return z.object({
    language: z.string().min(1),
    lang: z.string().min(2),

    seo: z.object({
      title: z.string().min(1).max(70),
      description: z.string().min(1).max(170),
      ogImage: media,
    }),

    nav: z.object({
      links: z.array(linkSchema).min(1),
      cta: linkSchema,
    }),

    hero: z.object({
      intervalMs: z.number().int().min(1000).max(15000).default(2000),
      buttons: z.array(linkSchema.extend({ variant: z.enum(['orange', 'green']) })).max(3),
      slides: z
        .array(
          z.object({
            title: z.string().min(1),
            image: media,
            imageMobile: media,
            desktop: placementSchema,
            mobile: placementSchema,
            tags: z.array(tagSchema).max(4).default([]),
          }),
        )
        .min(1),
    }),

    intro: z.object({
      rows: z.array(
        z.object({
          segments: z.array(z.object({ text: z.string().min(1), style: z.enum(introStyles) })).min(1),
        }),
      ),
    }),

    features: z.object({
      pill: z.string().min(1),
      title: z.string().min(1),
      cards: z
        .array(
          z.object({
            label: z.string().min(1),
            visual: z.enum(featureVisuals),
            wideLabel: z.boolean().default(false),
          }),
        )
        .min(1),
      notifications: z.array(z.object({ title: z.string(), meta: z.string(), amount: z.string() })).default([]),
    }),

    solutions: z.object({
      cta: linkSchema,
      cards: z
        .array(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            items: z.array(z.string().min(1)).default([]),
            image: media,
            side: z.enum(['left', 'right']),
          }),
        )
        .min(1),
    }),

    steps: z.object({
      pill: z.string().min(1),
      title: z.string().min(1),
      items: z
        .array(z.object({ title: z.string().min(1), description: z.string().min(1), icon: media }))
        .min(1)
        .max(3),
    }),

    markets: z.object({ title: z.string().min(1), cta: linkSchema }),

    news: newsStringsSchema,

    faq: z.object({
      pill: z.string().min(1),
      title: z.string().min(1),
      items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
    }),

    contact: z.object({
      title: z.string().min(1),
      image: media,
      form: z.object({
        label: z.string().min(1),
        placeholder: z.string().min(1),
        submit: z.string().min(1),
        sending: z.string().min(1),
        success: z.string().min(1),
        invalid: z.string().min(1),
        networkError: z.string().min(1),
      }),
    }),

    footer: z.object({
      brand: z.string().min(1),
      columns: z.array(z.object({ links: z.array(linkSchema) })).max(4),
      copyright: z.string().min(1),
      madeBy: linkSchema,
    }),

    a11y: z.object({
      skipToContent: z.string().min(1),
      mainMenu: z.string().min(1),
      menuOpen: z.string().min(1),
      menuClose: z.string().min(1),
      sliderPause: z.string().min(1),
      sliderPlay: z.string().min(1),
      globeLabel: z.string().min(1),
    }),

    notFound: z.object({ title: z.string().min(1), text: z.string().min(1), back: z.string().min(1) }),
  });
}

export function settingsSchema<M extends z.ZodType>(media: M) {
  return z.object({
    siteName: z.string().min(1),
    siteUrl: z.url(),
    defaultLocale: z.string().min(2),
    themeColor: z.string().regex(/^#[0-9a-f]{6}$/i),
    demoEndpoint: z.string().nullable().default(''),
    organization: z.object({ name: z.string().min(1), url: z.url() }),
    socialImage: media,
    globeFrames: z.number().int().min(1).max(999).default(80),
  });
}

/** News post front matter; the Markdown body is rendered by Astro. */
export function newsSchema<M extends z.ZodType>(media: M) {
  return z.object({
    title: z.string().min(1).max(120),
    locale: z.string().min(2).default('uz'),
    publishedAt: z.coerce.date(),
    excerpt: z.string().min(1).max(300),
    cover: media,
    draft: z.boolean().default(false),
  });
}

export function mediaSchema<I extends z.ZodType>(image: I) {
  return z.object({
    title: z.string().min(1),
    image,
    alt: z.string().nullable().default(''),
  });
}

/** Plain-string variants used by tests and tooling (no Astro runtime). */
export const landingFileSchema = landingSchema(z.string().min(1));
export const settingsFileSchema = settingsSchema(z.string().min(1));
export const mediaFileSchema = mediaSchema(z.string().min(1));
export const newsFileSchema = newsSchema(z.string().min(1));
export type LandingFile = z.infer<typeof landingFileSchema>;
