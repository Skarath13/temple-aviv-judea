import type { Collection } from 'tinacms';

export const SiteSettingsCollection: Collection = {
  name: 'siteSettings',
  label: 'Site settings',
  path: 'src/content/settings',
  format: 'json',
  match: {
    include: 'site',
  },
  ui: {
    global: true,
    allowedActions: {
      create: false,
      delete: false,
    },
  },
  fields: [
    {
      name: 'name',
      label: 'Congregation name',
      type: 'string',
      required: true,
      isTitle: true,
    },
    {
      name: 'shortName',
      label: 'Short name',
      type: 'string',
      required: true,
      description: 'Used for compact browser and mobile labels.',
    },
    {
      name: 'description',
      label: 'Default site description',
      type: 'string',
      required: true,
      ui: {
        component: 'textarea',
      },
    },
    {
      name: 'address',
      label: 'Address',
      type: 'object',
      fields: [
        { name: 'street', label: 'Street', type: 'string', required: true },
        { name: 'city', label: 'City, state, and ZIP', type: 'string', required: true },
        { name: 'locality', label: 'City', type: 'string', required: true },
        { name: 'region', label: 'State abbreviation', type: 'string', required: true },
        { name: 'postalCode', label: 'ZIP code', type: 'string', required: true },
        { name: 'country', label: 'Country code', type: 'string', required: true },
        { name: 'mailing', label: 'Mailing address', type: 'string', required: true },
        { name: 'maps', label: 'Google Maps link', type: 'string', required: true },
        { name: 'embed', label: 'Google Maps embed link', type: 'string', required: true },
      ],
    },
    { name: 'phone', label: 'Displayed phone number', type: 'string', required: true },
    {
      name: 'phoneHref',
      label: 'Phone link',
      type: 'string',
      required: true,
      description: 'Use tel: followed by the digits, for example tel:+17145551234.',
    },
    { name: 'email', label: 'Public email', type: 'string', required: true },
    { name: 'youtube', label: 'YouTube live link', type: 'string', required: true },
    { name: 'facebook', label: 'Facebook link', type: 'string', required: true },
    {
      name: 'baruchDesignsEtsy',
      label: 'Baruch Designs Etsy link',
      type: 'string',
      required: true,
    },
    {
      name: 'giving',
      label: 'PayPal giving link',
      type: 'string',
      required: true,
      description: 'Changing this affects every donation button. Verify it before saving.',
    },
    {
      name: 'publicHours',
      label: 'Public building hours',
      type: 'object',
      list: true,
      required: true,
      description:
        'Shown only as a subdued footer detail and in structured data. Keep these hours synchronized with the Google Business Profile.',
      ui: {
        max: 7,
        itemProps: (item) => ({
          label: item?.dayOfWeek || 'Public hours',
        }),
      },
      fields: [
        {
          name: 'dayOfWeek',
          label: 'Day',
          type: 'string',
          required: true,
          options: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        {
          name: 'opens',
          label: 'Opens',
          type: 'string',
          required: true,
          description: 'Use 24-hour HH:MM format, for example 09:00.',
        },
        {
          name: 'closes',
          label: 'Closes',
          type: 'string',
          required: true,
          description: 'Use 24-hour HH:MM format, for example 16:00.',
        },
      ],
    },
    {
      name: 'schedule',
      label: 'Shabbat schedule',
      type: 'object',
      list: true,
      ui: {
        max: 6,
        itemProps: (item) => ({
          label: item?.label || 'Schedule item',
        }),
      },
      fields: [
        { name: 'time', label: 'Time', type: 'string', required: true },
        { name: 'label', label: 'Activity', type: 'string', required: true },
        { name: 'note', label: 'Short note', type: 'string', required: true },
      ],
    },
    {
      name: 'navigation',
      label: 'Primary navigation',
      type: 'object',
      list: true,
      ui: {
        max: 8,
        itemProps: (item) => ({
          label: item?.label || 'Navigation item',
        }),
      },
      fields: [
        { name: 'label', label: 'Label', type: 'string', required: true },
        {
          name: 'href',
          label: 'Site path',
          type: 'string',
          required: true,
          description: 'Use a root-relative path such as /visit/.',
        },
      ],
    },
  ],
};
