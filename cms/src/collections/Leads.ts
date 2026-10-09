import type { CollectionConfig } from 'payload';
import { LEAD_STATUSES } from '../../../src/lib/leads';
import { isStaff } from '../lib/access';

const statusLabels: Record<(typeof LEAD_STATUSES)[number], string> = {
  new: 'New',
  contacted: 'Contacted',
  converted: 'Became a customer',
  rejected: 'Not interested',
};

/** Private. Website leads arrive through POST /api/lead (see lib/leads-endpoint.ts). */
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: { useAsTitle: 'phone', defaultColumns: ['phone', 'submittedAt', 'status', 'page'], group: 'Leads' },
  defaultSort: '-submittedAt',
  access: { read: isStaff, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'leadId', label: 'Lead ID', type: 'text', unique: true, index: true, admin: { readOnly: true } },
    { name: 'phone', label: 'Phone number', type: 'text', required: true },
    {
      name: 'submittedAt',
      label: 'Sent at',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'page', label: 'Sent from page', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: LEAD_STATUSES.map((value) => ({ label: statusLabels[value], value })),
    },
    { name: 'note', label: 'Note', type: 'textarea' },
  ],
};
