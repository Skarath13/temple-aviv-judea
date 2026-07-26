import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const errors = [];
const allowedAccents = new Set(['blue', 'coral', 'gold', 'teal']);
const allowedSections = new Set(['content', 'split', 'cards', 'gallery', 'callToAction']);
const expectedPages = new Map([
  ['artists.json', '/artists/'],
  ['beliefs.json', '/beliefs/'],
  ['give.json', '/give/'],
  ['home.json', '/'],
  ['ministries.json', '/ministries/'],
  ['story.json', '/story/'],
  ['visit.json', '/visit/'],
]);
const pageKeys = Object.fromEntries(
  [...expectedPages].map(([filename]) => [filename, filename.replace(/\.json$/, '')]),
);
const referencedLocalImages = new Set();

const readJson = async (relativePath) => {
  try {
    return JSON.parse(await readFile(join(root, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
};

const requiredString = (value, label) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} must be a nonempty string.`);
    return false;
  }
  return true;
};

const isSafeLink = (value) =>
  typeof value === 'string' &&
  (
    /^https?:\/\//i.test(value) ||
    /^(?:mailto:|tel:|#)/i.test(value) ||
    (value.startsWith('/') && !value.startsWith('//'))
  );

const isSafeImage = (value) =>
  typeof value === 'string' &&
  (
    /^https?:\/\//i.test(value) ||
    (value.startsWith('/') && !value.startsWith('//'))
  );

const validateImageSource = (value, label) => {
  if (!isSafeImage(value)) {
    errors.push(`${label} is not an allowed image source.`);
    return;
  }
  if (value.startsWith('/')) {
    if (!value.startsWith('/images/')) {
      errors.push(`${label} must use the managed /images/ media root.`);
    }
    referencedLocalImages.add(value);
  }
};

const requiredKeys = (value, label, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object.`);
    return;
  }
  keys.forEach((key) => {
    if (!(key in value)) errors.push(`${label}.${key} is required.`);
  });
};

const atPath = (value, path) =>
  path.split('.').reduce((current, key) => current?.[key], value);

const validateArray = (value, label, min, max) => {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    errors.push(`${label} must contain between ${min} and ${max} items.`);
    return false;
  }
  return true;
};

const imageField = /(?:^image$|Image$|desktopImage$|mobileImage$|recordingsImage$)/;
const urlField = /(?:Url|URL)$/;

const validateContentTree = (value, label, fieldName = '') => {
  if (typeof value === 'string') {
    if (value.trim().length === 0) {
      errors.push(`${label} must not be empty.`);
      return;
    }
    if (urlField.test(fieldName) && !isSafeLink(value)) {
      errors.push(`${label} is not an allowed URL.`);
    }
    if (imageField.test(fieldName)) {
      validateImageSource(value, label);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateContentTree(item, `${label}[${index}]`));
    return;
  }

  if (!value || typeof value !== 'object') return;

  Object.entries(value).forEach(([key, item]) => {
    if (key === 'body' && item && typeof item === 'object') return;
    validateContentTree(item, `${label}.${key}`, key);
  });
};

const commonObjectContracts = {
  seo: ['title', 'description', 'image'],
  hero: ['eyebrow', 'title', 'intro', 'accent'],
};

const pageObjectContracts = {
  home: {
    heroMedia: ['desktopImage', 'mobileImage', 'imageAlt'],
    heroActions: ['visitLabel', 'visitUrl', 'watchLabel', 'watchNote'],
    scheduleHeading: ['eyebrow', 'heading'],
    welcome: ['eyebrow', 'headingLines', 'lead', 'body', 'linkLabel', 'linkUrl', 'values'],
    storyFeature: ['image', 'imageAlt', 'eyebrow', 'headingLines', 'body', 'linkLabel', 'linkUrl', 'stats'],
    visitPreview: ['eyebrow', 'heading', 'intro', 'items', 'buttonLabel', 'buttonUrl'],
    community: ['eyebrow', 'heading', 'intro', 'moments', 'recordingsImage', 'recordingsImageAlt', 'recordingsLabel'],
    location: ['eyebrow', 'headingLines', 'body', 'desktopImage', 'mobileImage', 'imageAlt', 'captionTitle', 'captionSubtitle', 'mapTitle', 'directionsLabel'],
    ministriesPromo: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkUrl', 'directoryEyebrow', 'ministries'],
  },
  visit: {
    banner: ['image', 'imageAlt'],
    schedulePanel: ['eyebrow', 'heading', 'directionsLabel', 'livestreamLabel'],
    welcomeCard: ['heading', 'body'],
    service: ['eyebrow', 'heading', 'body', 'flowIntro', 'flow'],
    personalWelcome: ['heading', 'body'],
    location: ['eyebrow', 'body', 'buttonLabel'],
  },
  story: {
    banner: ['image', 'imageAlt'],
    rabbi: ['image', 'imageAlt', 'eyebrow', 'heading', 'lead', 'body', 'linkLabel', 'linkUrl'],
    leadership: ['eyebrow', 'heading', 'intro', 'groups'],
    vision: ['eyebrow', 'heading', 'body', 'buttonLabel', 'buttonUrl'],
  },
  beliefs: {
    banner: ['image', 'imageAlt'],
    foundation: ['eyebrow', 'heading', 'lead', 'body'],
    unity: ['quote', 'citation', 'body'],
    communityBanner: ['image', 'imageAlt', 'caption'],
    faithIntro: ['eyebrow', 'heading', 'intro'],
    pillarsIntro: ['eyebrow', 'heading', 'intro'],
    prayer: ['eyebrow', 'heading', 'lead', 'scripture', 'practices'],
    proclamation: ['eyebrow', 'heading', 'sections'],
    people: ['eyebrow', 'heading', 'sections'],
  },
  ministries: {
    bibleStudy: ['eyebrow', 'heading', 'body', 'linkLabel', 'emailSubject'],
    artistFeature: ['eyebrow', 'heading', 'body', 'artworks', 'buttonLabel'],
    callToAction: ['eyebrow', 'heading', 'body', 'buttonLabel', 'buttonUrl'],
  },
  give: {
    banner: ['image', 'imageAlt'],
    givingIntro: ['eyebrow', 'heading', 'lead', 'body', 'donationOptions', 'trustPoints', 'securityNote'],
    supportPanel: ['image', 'imageAlt', 'eyebrow', 'items'],
  },
  artists: {
    callToAction: ['eyebrow', 'heading', 'body', 'buttonLabel', 'buttonUrl'],
  },
};

const pageArrayContracts = {
  home: {
    'welcome.headingLines': [1, 3],
    'welcome.values': [3, 3],
    'storyFeature.headingLines': [1, 3],
    'storyFeature.stats': [1, 4],
    'visitPreview.items': [3, 3],
    'community.moments': [2, 2],
    'location.headingLines': [1, 3],
    'ministriesPromo.ministries': [1, 12],
  },
  visit: {
    'service.flow': [1, 10],
    questions: [1, 8],
  },
  story: {
    timeline: [1, 10],
    'leadership.groups': [1, 8],
  },
  beliefs: {
    faithStatements: [1, 20],
    pillars: [3, 3],
    'prayer.practices': [1, 8],
    'proclamation.sections': [1, 8],
    'people.sections': [1, 6],
  },
  ministries: {
    ministryCards: [4, 4],
    'artistFeature.artworks': [2, 2],
  },
  give: {
    'givingIntro.donationOptions': [2, 2],
    'givingIntro.trustPoints': [1, 4],
    'supportPanel.items': [1, 8],
  },
  artists: {
    gallery: [1, 12],
  },
};

const settings = await readJson('src/content/settings/site.json');
if (settings) {
  for (const field of ['name', 'shortName', 'description', 'phone', 'phoneHref', 'email']) {
    requiredString(settings[field], `site.${field}`);
  }

  for (const field of ['street', 'city', 'mailing', 'maps', 'embed']) {
    requiredString(settings.address?.[field], `site.address.${field}`);
  }

  for (const field of ['phoneHref', 'youtube', 'facebook', 'baruchDesignsEtsy', 'giving']) {
    if (!isSafeLink(settings[field])) errors.push(`site.${field} is not an allowed URL.`);
  }

  if (!Array.isArray(settings.schedule) || settings.schedule.length === 0 || settings.schedule.length > 6) {
    errors.push('site.schedule must contain between 1 and 6 entries.');
  } else {
    settings.schedule.forEach((item, index) => {
      for (const field of ['time', 'label', 'note']) {
        requiredString(item?.[field], `site.schedule[${index}].${field}`);
      }
    });
  }

  if (!Array.isArray(settings.navigation) || settings.navigation.length === 0 || settings.navigation.length > 8) {
    errors.push('site.navigation must contain between 1 and 8 entries.');
  } else {
    const navigationRoutes = new Set();
    settings.navigation.forEach((item, index) => {
      requiredString(item?.label, `site.navigation[${index}].label`);
      if (!isSafeLink(item?.href)) errors.push(`site.navigation[${index}].href is not an allowed URL.`);
      if (navigationRoutes.has(item?.href)) errors.push(`site.navigation contains duplicate route ${item?.href}.`);
      navigationRoutes.add(item?.href);
    });
  }
}

const pageDirectory = join(root, 'src/content/pages');
const pageFiles = (await readdir(pageDirectory)).filter((name) => name.endsWith('.json')).sort();
const expectedFiles = [...expectedPages.keys()].sort();
if (JSON.stringify(pageFiles) !== JSON.stringify(expectedFiles)) {
  errors.push(`Page files must be exactly: ${expectedFiles.join(', ')}.`);
}

for (const [filename, expectedRoute] of expectedPages) {
  const page = await readJson(`src/content/pages/${filename}`);
  if (!page) continue;
  const pageKey = pageKeys[filename];

  if (page._template !== pageKey) {
    errors.push(`${filename}._template must remain ${pageKey}.`);
  }
  requiredString(page.title, `${filename}.title`);
  if (page.route !== expectedRoute) {
    errors.push(`${filename}.route must remain ${expectedRoute}.`);
  }

  requiredKeys(page, filename, [
    'title',
    'route',
    'seo',
    'hero',
    ...Object.keys(pageObjectContracts[pageKey]),
    ...Object.keys(pageArrayContracts[pageKey]).filter((path) => !path.includes('.')),
    ...(pageKey === 'story' ? ['introduction'] : []),
    'sections',
  ]);
  requiredKeys(page.seo, `${filename}.seo`, commonObjectContracts.seo);
  requiredKeys(page.hero, `${filename}.hero`, commonObjectContracts.hero);
  Object.entries(pageObjectContracts[pageKey]).forEach(([path, keys]) => {
    requiredKeys(atPath(page, path), `${filename}.${path}`, keys);
  });
  Object.entries(pageArrayContracts[pageKey]).forEach(([path, [min, max]]) => {
    validateArray(atPath(page, path), `${filename}.${path}`, min, max);
  });

  if (!allowedAccents.has(page.hero?.accent)) {
    errors.push(`${filename}.hero.accent must be blue, coral, gold, or teal.`);
  }
  if (pageKey === 'home') {
    requiredString(page.hero?.emphasis, `${filename}.hero.emphasis`);
    requiredString(page.hero?.closing, `${filename}.hero.closing`);
  }

  if (!Array.isArray(page.sections)) {
    errors.push(`${filename}.sections must be an array.`);
    continue;
  }
  if (page.sections.length > 8) {
    errors.push(`${filename}.sections must contain at most 8 sections.`);
  }

  page.sections.forEach((section, index) => {
    if (!allowedSections.has(section?._template)) {
      errors.push(`${filename}.sections[${index}] has an unsupported template.`);
    }
    for (const key of ['buttonUrl', 'linkUrl']) {
      if (section?.[key] && !isSafeLink(section[key])) {
        errors.push(`${filename}.sections[${index}].${key} is not an allowed URL.`);
      }
    }
    if (Array.isArray(section?.items)) {
      section.items.forEach((item, itemIndex) => {
        if (item?.linkUrl && !isSafeLink(item.linkUrl)) {
          errors.push(`${filename}.sections[${index}].items[${itemIndex}].linkUrl is not an allowed URL.`);
        }
      });
    }
    if (section?._template === 'gallery' && Array.isArray(section?.images) && section.images.length > 12) {
      errors.push(`${filename}.sections[${index}].images must contain at most 12 images.`);
    }
  });

  validateContentTree(page, filename);
}

const eventDocument = await readJson('src/content/events/events.json');
if (eventDocument) {
  if (!Array.isArray(eventDocument.events) || eventDocument.events.length > 3) {
    errors.push('events.events must be an array containing at most 3 events.');
  } else {
    eventDocument.events.forEach((event, index) => {
      if (event.published) {
        for (const field of ['title', 'startsAt', 'location', 'summary', 'image', 'imageAlt']) {
          requiredString(event[field], `events[${index}].${field}`);
        }
        if (Number.isNaN(new Date(event.startsAt).valueOf())) {
          errors.push(`events[${index}].startsAt must be a valid date.`);
        }
      }
      if (event.detailsUrl && !isSafeLink(event.detailsUrl)) {
        errors.push(`events[${index}].detailsUrl is not an allowed URL.`);
      }
      if (event.image) {
        validateImageSource(event.image, `events[${index}].image`);
      }
    });
  }
}

for (const imagePath of referencedLocalImages) {
  try {
    await access(join(root, 'public', imagePath.slice(1)));
  } catch {
    errors.push(`Referenced image does not exist in public: ${imagePath}.`);
  }
}

if (errors.length > 0) {
  console.error('Content validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Content validation passed.');
}
