import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { normalizePageFrontmatter } from '../src/lib/page-frontmatter.mjs';
import { normalizePublicHours } from '../src/lib/site-structured-data.mjs';
import { selectUpcomingEventRecords } from '../src/lib/upcoming-events.mjs';
import {
  allowedSiteHosts,
  isAllowedSecureUrl,
  isApprovedGivingUrl,
  isEmailAddress,
  isManagedImageSource,
  isRootRelativePath,
  isSafeCmsLink,
  isTelephoneLink,
} from '../src/lib/content-rules.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const errors = [];
const referencedLocalImages = new Set();
const expectedPages = new Map([
  ['beliefs.mdx', '/beliefs/'],
  ['give.mdx', '/give/'],
  ['home.mdx', '/'],
  ['ministries.mdx', '/ministries/'],
  ['story.mdx', '/story/'],
  ['visit.mdx', '/visit/'],
]);

const report = (message) => errors.push(message);

const readJson = async (relativePath) => {
  try {
    return JSON.parse(await readFile(join(root, relativePath), 'utf8'));
  } catch (error) {
    report(`${relativePath}: ${error.message}`);
    return null;
  }
};

const readMdxFrontmatter = async (filename) => {
  const relativePath = `src/content/pages/${filename}`;
  try {
    const source = await readFile(join(root, relativePath), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---\s*$/u.exec(source);
    if (!match) {
      report(`${relativePath} must contain only YAML frontmatter and an empty MDX body.`);
      return null;
    }
    return parse(match[1]);
  } catch (error) {
    report(`${relativePath}: ${error.message}`);
    return null;
  }
};

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const validateImage = (value, label) => {
  if (!isManagedImageSource(value)) {
    report(`${label} must use /images/ or the exact Tina media host.`);
    return;
  }
  if (value.startsWith('/')) referencedLocalImages.add(value);
};

const isImageField = (key) =>
  key === 'image' ||
  key === 'src' ||
  key.endsWith('Image') ||
  key === 'desktopImage' ||
  key === 'mobileImage';

const isLinkField = (key) =>
  key === 'url' ||
  key === 'href' ||
  key.endsWith('Url') ||
  key.endsWith('URL') ||
  key.endsWith('Href');

const validateContentTree = (value, label) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateContentTree(item, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, item] of Object.entries(value)) {
    const itemLabel = `${label}.${key}`;
    if (typeof item === 'string' && hasText(item)) {
      if (isImageField(key)) validateImage(item, itemLabel);
      if (isLinkField(key) && !isSafeCmsLink(item)) {
        report(`${itemLabel} is not a safe CMS link.`);
      }
    } else {
      validateContentTree(item, itemLabel);
    }
  }
};

const validateIdentityList = (items, label, expectedValues) => {
  const actual = Array.isArray(items) ? items.map((item) => item?.kind) : [];
  if (
    actual.length !== expectedValues.length ||
    new Set(actual).size !== expectedValues.length ||
    actual.some((value) => !expectedValues.includes(value))
  ) {
    report(`${label} must contain exactly one of each: ${expectedValues.join(', ')}.`);
  }
};

const pageFiles = (await readdir(join(root, 'src/content/pages')))
  .filter((name) => name.endsWith('.mdx') || name.endsWith('.json'))
  .sort();
const expectedFiles = [...expectedPages.keys()].sort();
if (JSON.stringify(pageFiles) !== JSON.stringify(expectedFiles)) {
  report(`Page documents must be exactly: ${expectedFiles.join(', ')}.`);
}

const pages = [];
for (const [filename, expectedRoute] of expectedPages) {
  const page = await readMdxFrontmatter(filename);
  if (!page) continue;
  const pageKey = filename.replace(/\.mdx$/u, '');
  if (page._template !== pageKey) report(`${filename}._template must remain ${pageKey}.`);
  if (page.route !== expectedRoute) report(`${filename}.route must remain ${expectedRoute}.`);

  const normalizedPage = normalizePageFrontmatter(page);
  validateContentTree(normalizedPage, filename);
  pages.push(normalizedPage);

  if (pageKey === 'home') {
    validateIdentityList(page.welcome?.values, `${filename}.welcome.values`, [
      'prayer',
      'proclamation',
      'people',
    ]);
    validateIdentityList(page.visitPreview?.items, `${filename}.visitPreview.items`, [
      'worship',
      'teaching',
      'family',
    ]);
  }
  if (pageKey === 'beliefs') {
    validateIdentityList(page.pillars, `${filename}.pillars`, [
      'prayer',
      'proclamation',
      'people',
    ]);
  }
}

const publicRoutes = new Set([...expectedPages.values()]);
if (new Set(pages.map((page) => page.route)).size !== pages.length) {
  report('Page routes must be unique.');
}

const site = await readJson('src/content/settings/site.json');
if (site) {
  const providerLinks = [
    ['youtube', site.youtube, allowedSiteHosts.youtube],
    ['facebook', site.facebook, allowedSiteHosts.facebook],
    ['baruchDesignsEtsy', site.baruchDesignsEtsy, allowedSiteHosts.etsy],
    ['address.maps', site.address?.maps, allowedSiteHosts.googleMaps],
    ['address.embed', site.address?.embed, allowedSiteHosts.googleMaps],
    ['address.mapApp', site.address?.mapApp, allowedSiteHosts.mapApp],
  ];
  for (const [label, value, hosts] of providerLinks) {
    if (!isAllowedSecureUrl(value, hosts)) report(`site.${label} is not an approved provider URL.`);
  }
  if (!isApprovedGivingUrl(site.giving)) {
    report('site.giving must remain the approved PayPal recipient and checkout URL.');
  }
  if (!isEmailAddress(site.email)) report('site.email must be a valid email address.');
  if (!isTelephoneLink(site.phoneHref)) report('site.phoneHref must be an E.164 tel: link.');
  try {
    if (new URL(site.address?.embed).searchParams.get('output') !== 'embed') {
      report('site.address.embed must use Google Maps embed output.');
    }
  } catch {
    // The exact-host validation above reports malformed URLs.
  }
  try {
    normalizePublicHours(site.publicHours);
  } catch (error) {
    report(error.message);
  }

  const navigationRoutes = new Set();
  for (const [index, item] of (site.navigation || []).entries()) {
    if (!isRootRelativePath(item?.href) || !publicRoutes.has(item.href)) {
      report(`site.navigation[${index}].href must target a retained public page.`);
    }
    if (navigationRoutes.has(item?.href)) report(`site.navigation duplicates ${item.href}.`);
    navigationRoutes.add(item?.href);
  }
  validateContentTree(site, 'site');
}

const eventSchedule = await readJson('src/content/events/events.json');
if (eventSchedule) {
  try {
    selectUpcomingEventRecords(eventSchedule, new Date(0));
  } catch (error) {
    report(error.message);
  }
  validateContentTree(eventSchedule, 'events');
}

for (const imagePath of referencedLocalImages) {
  try {
    await access(join(root, 'public', imagePath.slice(1)));
  } catch {
    report(`Referenced image does not exist in public: ${imagePath}.`);
  }
}

if (errors.length > 0) {
  console.error('Production contract validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Production content contracts passed.');
}
