import type { CollectionConfig } from 'payload';
import {
  BlockquoteFeature,
  BoldFeature,
  HeadingFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import { isStaff, publicRead } from '../lib/access';
import { collectionDeployHook } from '../lib/deploy-hook';
import { media, select, text, textarea } from '../lib/fields';

export const newsEditor = lexicalEditor({
  features: () => [
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
  ],
});

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News post', plural: 'News' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'locale', 'publishedAt', '_status'], group: 'Content' },
  defaultSort: '-publishedAt',
  versions: { drafts: true, maxPerDoc: 25 },
  access: { read: publicRead, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [collectionDeployHook] },
  fields: [
    text('title', 'Title', { maxLength: 120 }),
    text('slug', 'URL slug', {
      unique: true,
      index: true,
      admin: { description: 'Becomes /news/<slug>/. Short, lowercase, hyphenated.' },
      validate: (value: string | null | undefined) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '') || 'Use lowercase letters, digits and hyphens only.',
    }),
    select(
      'locale',
      'Language',
      [
        { label: 'Oʻzbekcha (uz)', value: 'uz' },
        { label: 'Русский (ru)', value: 'ru' },
        { label: 'English (en)', value: 'en' },
      ],
      { admin: { description: 'Must match a landing page entry.' } },
    ),
    {
      name: 'publishedAt',
      label: 'Published on',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    textarea('excerpt', 'Excerpt', {
      maxLength: 300,
      admin: { description: 'Shown on cards, as the article lead and as the meta description.' },
    } as never),
    media('cover', 'Cover image', 'Cropped to 16:10 on cards and 2:1 on the article.'),
    { name: 'body', label: 'Body', type: 'richText', required: true, editor: newsEditor },
  ],
};
