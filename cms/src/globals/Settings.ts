import type { GlobalConfig } from 'payload';
import { isStaff } from '../lib/access';
import { globalDeployHook } from '../lib/deploy-hook';
import { group, media, num, optionalText, text } from '../lib/fields';

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
    optionalText('gtmId', 'Google Tag Manager ID', {
      admin: { description: 'Container ID like GTM-ABC1234. Empty disables Google Tag Manager.' },
      validate: (value: string | null | undefined) =>
        !value || /^GTM-[A-Z0-9]+$/.test(value) || 'Use the format GTM-XXXXXXX',
    }),
    optionalText('yandexMetrikaId', 'Yandex Metrika counter ID', {
      admin: { description: 'Numeric counter number, e.g. 12345678. Empty disables Yandex Metrika.' },
      validate: (value: string | null | undefined) =>
        !value || /^\d{5,12}$/.test(value) || 'Use the numeric counter ID',
    }),
    group('organization', 'Organisation (structured data)', [text('name', 'Name'), text('url', 'Website')]),
    media('socialImage', 'Default social share image'),
    num('globeFrames', 'Globe frame count', {
      defaultValue: 80,
      min: 1,
      max: 999,
      admin: { description: 'Frames live in public/earth/earth-NN.webp' },
    }),
  ],
};
