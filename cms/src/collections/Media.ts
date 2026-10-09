import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CollectionConfig } from 'payload';
import { isStaff } from '../lib/access';
import { collectionDeployHook } from '../lib/deploy-hook';
import { text } from '../lib/fields';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media item', plural: 'Media library' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'alt', 'filename'], group: 'Assets' },
  access: { read: () => true, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [collectionDeployHook] },
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    adminThumbnail: ({ doc }) => (doc.url as string | undefined) ?? null,
  },
  fields: [
    text('title', 'Name'),
    text('slug', 'ID', {
      unique: true,
      index: true,
      admin: { description: 'Used by the website to reference the file: lowercase letters, digits and hyphens.' },
      validate: (value: string | null | undefined) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '') || 'Use lowercase letters, digits and hyphens only.',
    }),
    text('alt', 'Alt text', { required: false, admin: { description: 'Leave empty for purely decorative images.' } }),
  ],
};
