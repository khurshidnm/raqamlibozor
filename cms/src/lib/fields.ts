import type { ArrayField, Field, GroupField, NumberField, RelationshipField, SelectField, TextField } from 'payload';

type Opts<T> = Partial<Omit<T, 'name' | 'type' | 'label'>>;

export const text = (name: string, label: string, opts: Opts<TextField> = {}): TextField =>
  ({
    name,
    label,
    type: 'text',
    required: true,
    ...opts,
  }) as TextField;

export const textarea = (name: string, label: string, opts: Opts<Field> & { maxLength?: number } = {}): Field =>
  ({ name, label, type: 'textarea', required: true, ...opts }) as Field;

export const optionalText = (name: string, label: string, opts: Opts<TextField> = {}): TextField =>
  text(name, label, { required: false, ...opts });

export const num = (name: string, label: string, opts: Opts<NumberField> = {}): NumberField =>
  ({
    name,
    label,
    type: 'number',
    required: true,
    ...opts,
  }) as NumberField;

export const select = (
  name: string,
  label: string,
  options: { label: string; value: string }[],
  opts: Opts<SelectField> = {},
): SelectField =>
  ({ name, label, type: 'select', options, defaultValue: options[0]?.value, required: true, ...opts }) as SelectField;

export const checkbox = (name: string, label: string, opts: Opts<Field> = {}): Field =>
  ({ name, label, type: 'checkbox', defaultValue: false, ...opts }) as Field;

export const media = (name: string, label: string, description?: string): RelationshipField => ({
  name,
  label,
  type: 'relationship',
  relationTo: 'media',
  required: true,
  admin: { description },
});

export const group = (name: string, label: string, fields: Field[], description?: string): GroupField => ({
  name,
  label,
  type: 'group',
  fields,
  admin: { description },
});

export const array = (name: string, label: string, fields: Field[], opts: Opts<ArrayField> = {}): ArrayField => ({
  name,
  label,
  type: 'array',
  fields,
  ...opts,
  admin: { initCollapsed: true, ...opts.admin },
});

/** A label plus an optional link target. */
export const link = (name: string, label: string, description?: string): GroupField =>
  group(
    name,
    label,
    [
      text('label', 'Label'),
      optionalText('href', 'Link', {
        admin: { description: 'A URL (https://…) or a page anchor (#boglanish). Leave empty for no link.' },
      }),
    ],
    description,
  );

/** One required text field per key; the spec's values are the editor labels. */
export const textFields = (spec: Record<string, string>): Field[] =>
  Object.entries(spec).map(([key, label]) => text(key, label));

export const placement = (name: string, label: string, description: string): GroupField =>
  group(
    name,
    label,
    [
      num('width', 'Width (px)', { min: 50, max: 3000 }),
      num('x', 'X offset (%)', {
        min: -100,
        max: 100,
        admin: { description: 'From the banner centre. Negative moves left.' },
      }),
      num('y', 'Y offset (%)', {
        min: -100,
        max: 100,
        admin: { description: 'From the banner centre. Negative moves up.' },
      }),
    ],
    description,
  );
