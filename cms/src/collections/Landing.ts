import type { CollectionConfig, Field, Tab } from 'payload';
import { mapStrings } from '../../../src/content/map-strings';
import { marketKindLabels, regionIds, regionLabels } from '../../../src/content/regions';
import { isStaff, publicRead } from '../lib/access';
import { collectionDeployHook } from '../lib/deploy-hook';
import {
  array,
  checkbox,
  group,
  link,
  media,
  num,
  optionalText,
  placement,
  select,
  text,
  textFields,
  textarea,
} from '../lib/fields';

const tab = (name: string, label: string, fields: Field[]): Tab => ({ name, label, fields });
const metaDescription = (label = 'Meta description') => textarea('description', label, { maxLength: 170 } as never);

const tabs: Tab[] = [
  tab('seo', 'SEO', [
    text('title', 'Page title', { maxLength: 70 }),
    metaDescription(),
    media('ogImage', 'Social share image', 'Cropped to 1200×630 automatically.'),
  ]),
  tab('nav', 'Navigation', [
    array('links', 'Menu links', [text('label', 'Label'), optionalText('href', 'Link')], { minRows: 1, maxRows: 7 }),
    link('cta', 'Call to action button'),
  ]),
  tab('hero', 'Hero', [
    num('intervalMs', 'Slide interval (ms)', { defaultValue: 2000, min: 1000, max: 15000 }),
    array(
      'buttons',
      'Buttons',
      [
        text('label', 'Label'),
        optionalText('href', 'Link', { admin: { description: 'Falls back to the contact section when empty.' } }),
        select('variant', 'Colour', [
          { label: 'Orange', value: 'orange' },
          { label: 'Green', value: 'green' },
        ]),
      ],
      { maxRows: 3 },
    ),
    array(
      'slides',
      'Slides',
      [
        textarea('title', 'Headline', {
          admin: { description: 'Use a line break where the headline should wrap.' },
        } as never),
        media('image', 'Image (desktop & tablet)'),
        media('imageMobile', 'Image (phone)'),
        placement('desktop', 'Desktop placement', 'Position of the image inside the banner on screens ≥ 810px.'),
        placement('mobile', 'Phone placement', 'Position of the image inside the banner on phones.'),
        array(
          'tags',
          'Floating tags (desktop only)',
          [
            text('label', 'Text'),
            num('x', 'X (%)', { min: -100, max: 100 }),
            num('y', 'Y (%)', { min: -100, max: 100 }),
          ],
          { maxRows: 4 },
        ),
      ],
      { minRows: 1 },
    ),
  ]),
  tab('intro', 'Intro sentence', [
    array(
      'rows',
      'Rows (desktop line breaks; phones re-flow automatically)',
      [
        array(
          'segments',
          'Segments',
          [
            text('text', 'Text'),
            select('style', 'Style', [
              { label: 'Plain', value: 'plain' },
              { label: 'Muted', value: 'muted' },
              { label: 'Green chip', value: 'chip-green' },
              { label: 'Orange chip', value: 'chip-orange' },
            ]),
          ],
          { minRows: 1 },
        ),
      ],
      { minRows: 1 },
    ),
  ]),
  tab('features', 'Features', [
    text('pill', 'Pill'),
    textarea('title', 'Title'),
    array(
      'cards',
      'Cards',
      [
        text('label', 'Label'),
        select('visual', 'Animated visual', [
          { label: 'Dashboard card', value: 'dashboard' },
          { label: 'Payment notifications', value: 'notifications' },
          { label: 'Orbiting icons', value: 'orbit' },
          { label: 'Document tiles', value: 'tiles' },
        ]),
        checkbox('wideLabel', 'Wider label column'),
      ],
      { minRows: 1, maxRows: 6 },
    ),
    array('notifications', 'Payment notifications (used by that visual)', [
      text('title', 'Title'),
      text('meta', 'Subtitle'),
      text('amount', 'Amount'),
    ]),
  ]),
  tab('solutions', 'Solutions', [
    link('cta', 'Card button'),
    array(
      'cards',
      'Cards',
      [
        text('title', 'Title'),
        textarea('description', 'Description'),
        array('items', 'Bullet list', [text('value', 'Item')]),
        media('image', 'Illustration'),
        select('side', 'Text side', [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
        ]),
      ],
      { minRows: 1, maxRows: 6 },
    ),
  ]),
  tab('steps', 'Steps', [
    text('pill', 'Pill'),
    text('title', 'Title'),
    array(
      'items',
      'Steps',
      [textarea('title', 'Title'), textarea('description', 'Description'), media('icon', 'Icon')],
      { minRows: 1, maxRows: 3 },
    ),
  ]),
  tab('markets', 'Markets (globe)', [text('title', 'Title'), link('cta', 'Button', 'Hidden while the link is empty.')]),
  tab('map', 'Markets map page', [
    group('seo', 'SEO', [text('title', 'Page title', { maxLength: 70 }), metaDescription()]),
    text('pill', 'Pill'),
    text('title', 'Heading'),
    textarea('description', 'Intro text'),
    group(
      'regions',
      'Region names',
      regionIds.map((id) =>
        group(id, regionLabels[id], [
          text('name', 'Name'),
          text('kind', 'Kind', { admin: { description: 'Shown after the name: viloyati, shahri, Respublikasi …' } }),
        ]),
      ),
      'The outlines are fixed; only the wording is editable.',
    ),
    group('kinds', 'Market type labels', [...textFields(marketKindLabels), text('branch', 'Branch (filial) label')]),
    group('invitation', 'Invitation shown for regions without markets', [
      textarea('text', 'Text'),
      link('cta', 'Button', 'Anchors (#boglanish) point to the home page.'),
      textarea('note', 'Small print'),
    ]),
    group(
      'strings',
      'Map interface text',
      textFields(mapStrings),
      '{n} is replaced with a number where the label says so.',
    ),
  ]),
  tab('news', 'News section', [
    text('label', 'Section name'),
    text('pill', 'Pill'),
    text('title', 'Home page section title'),
    text('listTitle', 'News page title'),
    textarea('listDescription', 'News page description (also the meta description)', { maxLength: 170 } as never),
    text('viewAll', '“All news” button'),
    text('readMore', '“Read more” label'),
    text('back', 'Back link on an article'),
    text('more', '“Other news” heading'),
    text('empty', 'Empty-list message'),
    text('prev', 'Previous page'),
    text('next', 'Next page'),
    text('pageOf', 'Page counter', { admin: { description: '{current} and {total} are replaced.' } }),
  ]),
  tab('faq', 'FAQ', [
    text('pill', 'Pill'),
    text('title', 'Title'),
    array('items', 'Questions', [text('question', 'Question'), textarea('answer', 'Answer')], { minRows: 1 }),
  ]),
  tab('contact', 'Contact', [
    text('title', 'Title'),
    media('image', 'Background illustration'),
    group('form', 'Demo request form', [
      text('label', 'Field label (screen readers)'),
      text('placeholder', 'Placeholder'),
      text('submit', 'Submit button'),
      text('sending', 'While sending'),
      text('success', 'Success message'),
      text('invalid', 'Invalid number message'),
      text('networkError', 'Sending failed message'),
    ]),
    group('sent', 'Window shown after a successful request', [
      text('title', 'Title'),
      textarea('text', 'Text'),
      textarea('note', 'Additional text'),
      text('close', 'Close button'),
    ]),
  ]),
  tab('footer', 'Footer', [
    text('brand', 'Brand line'),
    array(
      'columns',
      'Link columns',
      [array('links', 'Links', [text('label', 'Label'), optionalText('href', 'Link')])],
      { maxRows: 4 },
    ),
    text('copyright', 'Copyright line', {
      admin: { description: '{year} is replaced with the current year at build time.' },
    }),
    link('madeBy', '“Made by” credit'),
  ]),
  tab('a11y', 'Accessibility', [
    text('skipToContent', 'Skip link'),
    text('mainMenu', 'Main menu landmark name'),
    text('menuOpen', 'Open menu button'),
    text('menuClose', 'Close menu button'),
    text('sliderPause', 'Pause headline rotation'),
    text('sliderPlay', 'Resume headline rotation'),
    text('globeLabel', 'Globe image description'),
  ]),
  tab('notFound', '404 page', [text('title', 'Title'), text('text', 'Text'), text('back', 'Back-home link')]),
];

export const Landing: CollectionConfig = {
  slug: 'landing',
  labels: { singular: 'Landing page', plural: 'Landing pages' },
  admin: { useAsTitle: 'language', defaultColumns: ['language', 'locale', 'lang', '_status'], group: 'Content' },
  versions: { drafts: true, maxPerDoc: 25 },
  access: { read: publicRead, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { afterChange: [collectionDeployHook] },
  fields: [
    {
      type: 'row',
      fields: [
        text('language', 'Language name', { admin: { description: 'Shown to editors only, e.g. “Oʻzbekcha”.' } }),
        text('locale', 'Locale code (URL)', {
          unique: true,
          index: true,
          admin: { description: 'uz, ru, en … The default locale lives at “/”, others at “/<code>/”.' },
          validate: (value: string | null | undefined) =>
            /^[a-z]{2,3}$/.test(value ?? '') || 'Use a 2–3 letter lowercase code.',
        }),
        text('lang', 'HTML lang attribute', { admin: { description: 'BCP 47 tag, e.g. uz-Latn, ru, en.' } }),
      ],
    },
    { type: 'tabs', tabs },
  ],
};
