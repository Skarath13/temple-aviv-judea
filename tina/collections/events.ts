import type { Collection } from 'tinacms';

export const EventCollection: Collection = {
  name: 'eventSchedule',
  label: 'Upcoming events',
  path: 'src/content/events',
  format: 'json',
  match: {
    include: 'events',
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
      name: 'events',
      label: 'Events shown on the homepage',
      type: 'object',
      list: true,
      ui: {
        max: 3,
        itemProps: (item) => ({
          label: item?.title || 'New event',
        }),
      },
      fields: [
        {
          name: 'published',
          label: 'Published',
          type: 'boolean',
          description: 'Turn this on only when the event is ready to appear publicly.',
        },
        {
          name: 'title',
          label: 'Event name',
          type: 'string',
          required: true,
        },
        {
          name: 'startsAt',
          label: 'Date and time',
          type: 'datetime',
          required: true,
        },
        {
          name: 'location',
          label: 'Location',
          type: 'string',
          required: true,
        },
        {
          name: 'summary',
          label: 'Short description',
          type: 'string',
          required: true,
          ui: {
            component: 'textarea',
          },
        },
        {
          name: 'image',
          label: 'Event photograph',
          type: 'image',
          required: true,
        },
        {
          name: 'imageAlt',
          label: 'Photograph description',
          type: 'string',
          required: true,
          description: 'Describe the meaningful content for visitors using a screen reader.',
        },
        {
          name: 'detailsUrl',
          label: 'Optional event details link',
          type: 'string',
        },
      ],
    },
  ],
};
