import type { Collection, Template, TinaField } from 'tinacms';

interface BasicFieldOptions {
  required?: boolean;
  description?: string;
}

interface StringFieldOptions extends BasicFieldOptions {
  isTitle?: boolean;
}

const text = (
  name: string,
  label: string,
  options: BasicFieldOptions = {},
): TinaField => ({
  name,
  label,
  type: 'string',
  required: true,
  ui: { component: 'textarea' },
  ...options,
} as TinaField);

const string = (
  name: string,
  label: string,
  options: StringFieldOptions = {},
): TinaField => ({
  name,
  label,
  type: 'string',
  required: true,
  ...options,
} as TinaField);

const image = (
  name: string,
  label: string,
  options: BasicFieldOptions = {},
): TinaField => ({
  name,
  label,
  type: 'image',
  required: true,
  ...options,
} as TinaField);

const imageFields = (): TinaField[] => [
  image('image', 'Image'),
  string('imageAlt', 'Image description', {
    description: 'Describe meaningful visual content for visitors using a screen reader.',
  }),
];

const list = (
  name: string,
  label: string,
  fields: TinaField[],
  max: number,
  itemLabel: string,
): TinaField => ({
  name,
  label,
  type: 'object',
  list: true,
  required: true,
  fields,
  ui: {
    max,
    itemProps: (item) => ({
      label: item?.[itemLabel] || `New ${label.toLowerCase()}`,
    }),
  },
} as TinaField);

const stringList = (
  name: string,
  label: string,
  max: number,
): TinaField => ({
  name,
  label,
  type: 'string',
  list: true,
  required: true,
  ui: { max },
});

const seoField: TinaField = {
  name: 'seo',
  label: 'Search and sharing',
  type: 'object',
  required: true,
  fields: [
    string('title', 'Browser and search title'),
    text('description', 'Search description'),
    image('image', 'Social sharing image', {
      description: 'Recommended size: 1200 by 630 pixels.',
    }),
  ],
};

const heroField: TinaField = {
  name: 'hero',
  label: 'Page introduction',
  type: 'object',
  required: true,
  fields: [
    string('eyebrow', 'Small heading'),
    string('title', 'Main heading'),
    string('emphasis', 'Home heading emphasis', {
      required: false,
      description: 'Used only by the homepage.',
    }),
    string('closing', 'Home heading closing line', {
      required: false,
      description: 'Used only by the homepage.',
    }),
    text('intro', 'Introduction'),
    {
      name: 'accent',
      label: 'Accent color',
      type: 'string',
      required: true,
      options: [
        { value: 'blue', label: 'Blue' },
        { value: 'coral', label: 'Coral' },
        { value: 'gold', label: 'Gold' },
        { value: 'teal', label: 'Teal' },
      ],
    },
  ],
};

const contentSection: Template = {
  name: 'content',
  label: 'Text section',
  fields: [
    string('eyebrow', 'Small heading', { required: false }),
    string('heading', 'Heading'),
    { name: 'body', label: 'Body', type: 'rich-text', required: true },
  ],
};

const splitSection: Template = {
  name: 'split',
  label: 'Text and image',
  fields: [
    string('eyebrow', 'Small heading', { required: false }),
    string('heading', 'Heading'),
    { name: 'body', label: 'Body', type: 'rich-text', required: true },
    ...imageFields(),
    {
      name: 'imageSide',
      label: 'Image placement',
      type: 'string',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
    },
  ],
};

const cardsSection: Template = {
  name: 'cards',
  label: 'Card grid',
  fields: [
    string('eyebrow', 'Small heading', { required: false }),
    string('heading', 'Heading'),
    text('intro', 'Introduction', { required: false }),
    list(
      'items',
      'Cards',
      [
        string('title', 'Title'),
        text('text', 'Text'),
        image('image', 'Optional image', { required: false }),
        string('imageAlt', 'Image description', { required: false }),
        string('linkLabel', 'Optional link label', { required: false }),
        string('linkUrl', 'Optional link URL', { required: false }),
      ],
      6,
      'title',
    ),
  ],
};

const gallerySection: Template = {
  name: 'gallery',
  label: 'Image gallery',
  fields: [
    string('eyebrow', 'Small heading', { required: false }),
    string('heading', 'Heading'),
    list(
      'images',
      'Images',
      [
        ...imageFields(),
        string('caption', 'Caption', { required: false }),
      ],
      12,
      'caption',
    ),
  ],
};

const callToActionSection: Template = {
  name: 'callToAction',
  label: 'Call to action',
  fields: [
    string('eyebrow', 'Small heading', { required: false }),
    string('heading', 'Heading'),
    text('text', 'Text'),
    string('buttonLabel', 'Button label'),
    string('buttonUrl', 'Button URL'),
  ],
};

const additionalSections: TinaField = {
  name: 'sections',
  label: 'Optional additional sections',
  type: 'object',
  list: true,
  description: 'Add an approved section after the designed page content.',
  ui: {
    max: 8,
    visualSelector: true,
  },
  templates: [
    contentSection,
    splitSection,
    cardsSection,
    gallerySection,
    callToActionSection,
  ],
};

const baseFields = (): TinaField[] => [
  string('title', 'Page name', {
    isTitle: true,
    description: 'The internal editor label for this page.',
  }),
  string('route', 'Site route', {
    description: 'Developer-controlled. Do not change this value.',
  }),
  seoField,
  heroField,
];

const pageTemplate = (
  name: string,
  label: string,
  fields: TinaField[],
): Template => ({
  name,
  label,
  fields: [...baseFields(), ...fields, additionalSections],
});

const homeTemplate = pageTemplate('home', 'Home', [
  {
    name: 'heroMedia',
    label: 'Home hero artwork',
    type: 'object',
    required: true,
    fields: [
      image('desktopImage', 'Desktop image'),
      image('mobileImage', 'Mobile image'),
      string('imageAlt', 'Image description'),
    ],
  },
  {
    name: 'heroActions',
    label: 'Home hero buttons',
    type: 'object',
    required: true,
    fields: [
      string('visitLabel', 'Visit button label'),
      string('visitUrl', 'Visit button URL'),
      string('watchLabel', 'Livestream button label'),
      string('watchNote', 'Livestream schedule note'),
    ],
  },
  {
    name: 'scheduleHeading',
    label: 'Schedule heading',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
    ],
  },
  {
    name: 'welcome',
    label: 'Welcome section',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      stringList('headingLines', 'Heading lines', 3),
      text('lead', 'Lead paragraph'),
      text('body', 'Second paragraph'),
      string('linkLabel', 'Link label'),
      string('linkUrl', 'Link URL'),
      list(
        'values',
        'Value cards',
        [
          string('title', 'Title'),
          text('text', 'Text'),
          image('image', 'Background artwork'),
        ],
        3,
        'title',
      ),
    ],
  },
  {
    name: 'storyFeature',
    label: 'Story feature',
    type: 'object',
    required: true,
    fields: [
      ...imageFields(),
      string('eyebrow', 'Small heading'),
      stringList('headingLines', 'Heading lines', 3),
      text('body', 'Story summary'),
      string('linkLabel', 'Button label'),
      string('linkUrl', 'Button URL'),
      list(
        'stats',
        'Milestones',
        [
          string('value', 'Year or value'),
          string('label', 'Description'),
        ],
        4,
        'value',
      ),
    ],
  },
  {
    name: 'visitPreview',
    label: 'First visit preview',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('intro', 'Introduction'),
      list(
        'items',
        'What to expect',
        [
          ...imageFields(),
          string('title', 'Title'),
          text('text', 'Text'),
        ],
        3,
        'title',
      ),
      string('buttonLabel', 'Button label'),
      string('buttonUrl', 'Button URL'),
    ],
  },
  {
    name: 'community',
    label: 'Community moments',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('intro', 'Introduction'),
      list(
        'moments',
        'Photographs',
        [
          ...imageFields(),
          string('caption', 'Caption'),
        ],
        2,
        'caption',
      ),
      image('recordingsImage', 'Recordings card image'),
      string('recordingsImageAlt', 'Recordings image description'),
      string('recordingsLabel', 'Recordings link label'),
    ],
  },
  {
    name: 'location',
    label: 'Location section',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      stringList('headingLines', 'Heading lines', 3),
      text('body', 'Description'),
      image('desktopImage', 'Desktop building image'),
      image('mobileImage', 'Mobile building image'),
      string('imageAlt', 'Building image description'),
      string('captionTitle', 'Image caption title'),
      string('captionSubtitle', 'Image caption subtitle'),
      string('mapTitle', 'Map accessibility title'),
      string('directionsLabel', 'Directions button label'),
    ],
  },
  {
    name: 'ministriesPromo',
    label: 'Ministries promotion',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      string('linkLabel', 'Link label'),
      string('linkUrl', 'Link URL'),
      string('directoryEyebrow', 'Directory small heading'),
      stringList('ministries', 'Ministry names', 12),
    ],
  },
]);

const visitTemplate = pageTemplate('visit', 'Visit', [
  {
    name: 'banner',
    label: 'Shabbat artwork',
    type: 'object',
    required: true,
    fields: imageFields(),
  },
  {
    name: 'schedulePanel',
    label: 'Schedule panel',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      string('directionsLabel', 'Directions button label'),
      string('livestreamLabel', 'Livestream button label'),
    ],
  },
  {
    name: 'welcomeCard',
    label: 'Welcome card',
    type: 'object',
    required: true,
    fields: [
      string('heading', 'Heading'),
      text('body', 'Body'),
    ],
  },
  {
    name: 'service',
    label: 'What happens in a service',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      text('flowIntro', 'Service rhythm introduction'),
      stringList('flow', 'Recurring service elements', 10),
    ],
  },
  list(
    'questions',
    'Visitor questions',
    [
      string('heading', 'Question'),
      text('body', 'Answer'),
    ],
    8,
    'heading',
  ),
  {
    name: 'personalWelcome',
    label: 'Personal welcome',
    type: 'object',
    required: true,
    fields: [
      string('heading', 'Heading'),
      text('body', 'Body'),
    ],
  },
  {
    name: 'location',
    label: 'Location callout',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      text('body', 'Location note'),
      string('buttonLabel', 'Map button label'),
    ],
  },
]);

const storyTemplate = pageTemplate('story', 'Our Story', [
  {
    name: 'banner',
    label: 'Temple artwork',
    type: 'object',
    required: true,
    fields: imageFields(),
  },
  text('introduction', 'Opening story'),
  list(
    'timeline',
    'Timeline',
    [
      string('year', 'Year or period'),
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Story'),
      {
        name: 'featured',
        label: 'Featured milestone',
        type: 'boolean',
      },
      image('image', 'Optional desktop image', { required: false }),
      image('mobileImage', 'Optional mobile image', { required: false }),
      string('imageAlt', 'Image description', { required: false }),
    ],
    10,
    'year',
  ),
  {
    name: 'rabbi',
    label: 'Rabbi profile',
    type: 'object',
    required: true,
    fields: [
      ...imageFields(),
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('lead', 'Lead paragraph'),
      text('body', 'Second paragraph'),
      string('linkLabel', 'Contact link label'),
      string('linkUrl', 'Contact link URL'),
    ],
  },
  {
    name: 'leadership',
    label: 'Leadership',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('intro', 'Introduction'),
      list(
        'groups',
        'Leadership groups',
        [
          string('role', 'Role'),
          stringList('names', 'Names', 12),
        ],
        8,
        'role',
      ),
    ],
  },
  {
    name: 'vision',
    label: 'Vision callout',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Body'),
      string('buttonLabel', 'Button label'),
      string('buttonUrl', 'Button URL'),
    ],
  },
]);

const beliefsTemplate = pageTemplate('beliefs', 'Beliefs', [
  {
    name: 'banner',
    label: 'Torah artwork',
    type: 'object',
    required: true,
    fields: imageFields(),
  },
  {
    name: 'foundation',
    label: 'Foundation',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('lead', 'Lead paragraph'),
      text('body', 'Second paragraph'),
    ],
  },
  {
    name: 'unity',
    label: 'Unity callout',
    type: 'object',
    required: true,
    fields: [
      text('quote', 'Quotation'),
      string('citation', 'Citation'),
      text('body', 'Explanation'),
    ],
  },
  {
    name: 'communityBanner',
    label: 'Community banner',
    type: 'object',
    required: true,
    fields: [
      ...imageFields(),
      string('caption', 'Caption'),
    ],
  },
  {
    name: 'faithIntro',
    label: 'Statement of faith heading',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('intro', 'Introduction'),
    ],
  },
  list(
    'faithStatements',
    'Faith statements',
    [
      string('title', 'Title'),
      text('body', 'Statement'),
      string('references', 'Scripture references'),
    ],
    20,
    'title',
  ),
  {
    name: 'pillarsIntro',
    label: 'Core values heading',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('intro', 'Introduction'),
    ],
  },
  list(
    'pillars',
    'Core value cards',
    [
      image('image', 'Card artwork'),
      string('title', 'Title'),
      text('body', 'Summary'),
    ],
    3,
    'title',
  ),
  {
    name: 'prayer',
    label: 'Prayer detail',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('lead', 'Lead paragraph'),
      string('scripture', 'Scripture reference'),
      list(
        'practices',
        'Prayer practices',
        [
          string('title', 'Title'),
          string('text', 'Description'),
        ],
        8,
        'title',
      ),
    ],
  },
  {
    name: 'proclamation',
    label: 'Proclamation detail',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      list(
        'sections',
        'Proclamation topics',
        [
          string('heading', 'Heading'),
          stringList('paragraphs', 'Paragraphs', 6),
          string('scripture', 'Scripture references'),
        ],
        8,
        'heading',
      ),
    ],
  },
  {
    name: 'people',
    label: 'People detail',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      list(
        'sections',
        'People topics',
        [
          string('heading', 'Heading'),
          stringList('paragraphs', 'Paragraphs', 6),
          string('scripture', 'Optional scripture references', { required: false }),
        ],
        6,
        'heading',
      ),
    ],
  },
]);

const ministriesTemplate = pageTemplate('ministries', 'Ministries', [
  list(
    'ministryCards',
    'Ministry cards',
    [
      ...imageFields(),
      string('eyebrow', 'Small heading'),
      string('title', 'Title'),
      text('body', 'Description'),
      string('linkLabel', 'Optional link label', { required: false }),
      string('linkUrl', 'Optional link URL', { required: false }),
    ],
    4,
    'title',
  ),
  {
    name: 'bibleStudy',
    label: 'Bible study card',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      string('linkLabel', 'Email link label'),
      string('emailSubject', 'Email subject'),
    ],
  },
  {
    name: 'artistFeature',
    label: 'Artist feature',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      list(
        'artworks',
        'Featured artworks',
        [
          ...imageFields(),
          string('title', 'Artwork title'),
          string('credit', 'Artwork credit'),
        ],
        2,
        'title',
      ),
      string('buttonLabel', 'Gallery button label'),
    ],
  },
  {
    name: 'callToAction',
    label: 'Bottom call to action',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      string('buttonLabel', 'Button label'),
      string('buttonUrl', 'Button URL'),
    ],
  },
]);

const giveTemplate = pageTemplate('give', 'Give', [
  {
    name: 'banner',
    label: 'Giving artwork',
    type: 'object',
    required: true,
    fields: imageFields(),
  },
  {
    name: 'givingIntro',
    label: 'Giving introduction',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('lead', 'Lead paragraph'),
      text('body', 'Second paragraph'),
      stringList('donationOptions', 'Donation button names', 2),
      stringList('trustPoints', 'Checkout reassurance', 4),
      text('securityNote', 'Payment security note'),
    ],
  },
  {
    name: 'supportPanel',
    label: 'What giving supports',
    type: 'object',
    required: true,
    fields: [
      ...imageFields(),
      string('eyebrow', 'Small heading'),
      stringList('items', 'Supported ministries', 8),
    ],
  },
]);

const artistsTemplate = pageTemplate('artists', 'Artists’ Gallery', [
  list(
    'gallery',
    'Artwork',
    [
      ...imageFields(),
      string('caption', 'Caption'),
    ],
    12,
    'caption',
  ),
  {
    name: 'callToAction',
    label: 'Creative arts call to action',
    type: 'object',
    required: true,
    fields: [
      string('eyebrow', 'Small heading'),
      string('heading', 'Heading'),
      text('body', 'Description'),
      string('buttonLabel', 'Button label'),
      string('buttonUrl', 'Button URL'),
    ],
  },
]);

export const PageCollection: Collection = {
  name: 'page',
  label: 'Pages',
  path: 'src/content/pages',
  format: 'json',
  ui: {
    allowedActions: {
      create: false,
      delete: false,
    },
    filename: {
      readonly: true,
    },
    router: ({ document }) =>
      document._sys.filename === 'home'
        ? '/'
        : `/${document._sys.filename}/`,
  },
  templates: [
    homeTemplate,
    visitTemplate,
    storyTemplate,
    beliefsTemplate,
    ministriesTemplate,
    giveTemplate,
    artistsTemplate,
  ],
};
