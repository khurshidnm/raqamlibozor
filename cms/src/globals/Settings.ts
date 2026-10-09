import type { GlobalConfig } from 'payload';
import { isStaff } from '../lib/access';
import { globalDeployHook } from '../lib/deploy-hook';
import { array, checkbox, group, media, num, optionalText, optionalTextarea, text } from '../lib/fields';

/** Mirrors the patterns in src/content/schema.ts; empty disables the tag. */
const pattern =
  (re: RegExp, message: string) =>
  (value: string | null | undefined): true | string =>
    !value || re.test(value) || message;

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Site settings',
  admin: { group: 'Site' },
  access: { read: () => true, update: isStaff },
  hooks: { afterChange: [globalDeployHook] },
  fields: [
    text('siteName', 'Site name'),
    text('siteUrl', 'Public URL', {
      admin: { description: 'Canonical links, Open Graph, sitemap and allowed lead origin.' },
    }),
    text('defaultLocale', 'Default locale code', { admin: { description: 'Must match a landing page, e.g. uz.' } }),
    text('themeColor', 'Theme colour (hex)', {
      validate: (value: string | null | undefined) =>
        /^#[0-9a-fA-F]{6}$/.test(value ?? '') || 'Use a 6-digit hex colour like #178f20',
    }),
    optionalText('demoEndpoint', 'Demo request endpoint', {
      admin: {
        description:
          'HTTPS URL accepting POST {"phone": "+998901234567"}. Point it at this CMS: https://<cms-host>/api/lead. Empty keeps the form in demo mode.',
      },
    }),
    group('organization', 'Organisation (structured data)', [
      text('name', 'Name'),
      text('url', 'Website'),
      optionalText('email', 'Contact email'),
      optionalText('phone', 'Contact phone', { admin: { description: 'International format, e.g. +998901234567.' } }),
    ]),
    group('seo', 'SEO', [
      checkbox('indexable', 'Allow search engines to index the site', {
        defaultValue: true,
        admin: { description: 'Switch off only for staging: every page becomes noindex and robots.txt blocks all.' },
      }),
      text('titleTemplate', 'Title template', {
        defaultValue: '%s — {siteName}',
        admin: { description: '%s is the page title, {siteName} the site name. Not applied to the home page.' },
      }),
      optionalText('twitterSite', 'X / Twitter handle', { admin: { description: 'e.g. @raqamlibozor' } }),
      array('socials', 'Social profiles', [text('url', 'Profile URL')], {
        admin: { description: 'Listed as sameAs in the Organization structured data.' },
      }),
      optionalTextarea('robotsExtra', 'Extra robots.txt rules'),
      group('verification', 'Search-engine verification codes', [
        optionalText('google', 'Google'),
        optionalText('yandex', 'Yandex'),
        optionalText('bing', 'Bing'),
        optionalText('facebook', 'Meta (Facebook) domain verification'),
        optionalText('pinterest', 'Pinterest'),
      ]),
      array('customMeta', 'Other <meta> tags', [text('name', 'Name'), optionalText('content', 'Content')]),
    ]),
    group(
      'tracking',
      'Analytics & tags',
      [
        optionalText('gtm', 'Google Tag Manager ID', {
          validate: pattern(/^GTM-[A-Z0-9]{4,10}$/, 'Use the format GTM-XXXXXXX'),
        }),
        optionalText('ga4', 'GA4 measurement ID', {
          validate: pattern(/^G-[A-Z0-9]{6,12}$/, 'Use the format G-XXXXXXXXXX'),
        }),
        optionalText('yandexMetrica', 'Yandex Metrica counter ID', {
          validate: pattern(/^\d{5,20}$/, 'Use the numeric counter ID'),
        }),
        optionalText('metaPixel', 'Meta Pixel ID', { validate: pattern(/^\d{5,20}$/, 'Use the numeric pixel ID') }),
        optionalTextarea('customHead', 'Custom code for <head>'),
        optionalTextarea('customBodyStart', 'Custom code after <body>'),
        array(
          'cspHosts',
          'Allowed domains for custom code',
          [
            text('host', 'Domain', {
              validate: (value: string | null | undefined) =>
                /^https:\/\/(\*\.)?[a-z0-9.-]+\.[a-z]{2,}(:\d+)?$/i.test(value ?? '') || 'Use https://host.example',
            }),
          ],
          {
            admin: { description: 'Every domain the custom code loads from or reports to (Content-Security-Policy).' },
          },
        ),
      ],
      'Tags load only on the deployed site. Prefer GTM alone and add other tools inside it to avoid double counting.',
    ),
    media('socialImage', 'Default social share image'),
    num('globeFrames', 'Globe frame count', {
      defaultValue: 80,
      min: 1,
      max: 999,
      admin: { description: 'Frames live in public/earth/earth-NN.webp' },
    }),
  ],
};
