import type { CollectionConfig } from 'payload';
import { isAdmin, isStaff } from '../lib/access';

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email', group: 'System' },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    read: isStaff,
    create: isAdmin,
    update: ({ req: { user }, id }) =>
      Boolean(user && ((user.roles as string[] | undefined)?.includes('admin') || user.id === id)),
    delete: isAdmin,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: 'Administrator (everything, incl. users)', value: 'admin' },
        { label: 'Editor (content, media, leads)', value: 'editor' },
      ],
      access: { create: isAdmin, update: isAdmin },
    },
  ],
};
