import type { CollectionConfig } from 'payload';
import { mapBounds, marketKindLabels, marketKinds, regionIds, regionLabels } from '../../../src/content/regions';
import { isStaff } from '../lib/access';
import { collectionDeployHook } from '../lib/deploy-hook';
import { checkbox, num, select, text } from '../lib/fields';

export const Markets: CollectionConfig = {
  slug: 'markets',
  labels: { singular: 'Market', plural: 'Markets (map)' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'region', 'kind', 'branch'], group: 'Content' },
  access: { read: () => true, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [collectionDeployHook] },
  fields: [
    text('slug', 'ID (file name)', {
      unique: true,
      index: true,
      admin: { description: 'Lowercase letters, digits and hyphens.' },
      validate: (value: string | null | undefined) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '') || 'Use lowercase letters, digits and hyphens only.',
    }),
    text('name', 'Name', {
      maxLength: 160,
      admin: { description: 'As it appears in the list and in the info window.' },
    }),
    select(
      'region',
      'Region',
      regionIds.map((id) => ({ label: regionLabels[id], value: id })),
      { defaultValue: 'tashkent' },
    ),
    select(
      'kind',
      'Type',
      marketKinds.map((kind) => ({ label: marketKindLabels[kind], value: kind })),
    ),
    checkbox('branch', 'Branch (filial)', {
      admin: { description: 'Listed with the branch label and counted in the region total.' },
    }),
    num('x', 'Map X', {
      required: false,
      min: mapBounds.x[0],
      max: mapBounds.x[1],
      admin: {
        description:
          'Position in map units. Open /bozorlar/?pick on the site, click the spot and copy both values. Leave X and Y empty to draw the dot near the region label.',
      },
    }),
    num('y', 'Map Y', { required: false, min: mapBounds.y[0], max: mapBounds.y[1] }),
  ],
};
