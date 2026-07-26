const ROUTE_PRIORITY = new Map([
  ['/', 0],
  ['/visit/', 1],
  ['/beliefs/', 2],
  ['/story/', 3],
  ['/ministries/', 4],
  ['/give/', 5],
  ['/artists/', 6],
]);

const OPTIONAL_ROUTES = new Set(['/give/', '/artists/']);
const PUBLIC_ROUTE = /^\/(?:[a-z0-9][a-z0-9-]*\/)*$/;

const requiredInlineText = (value, label) => {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }

  const normalized = value
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    throw new TypeError(`${label} must not be empty.`);
  }

  return normalized;
};

const markdownText = (value, label) =>
  requiredInlineText(value, label).replace(/[\\`*_[\]<>]/g, '\\$&');

const normalizeSiteRoot = (value) => {
  const url = value instanceof URL ? new URL(value) : new URL(value);

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError('siteRoot must be a public HTTP(S) URL without credentials, a query, or a fragment.');
  }

  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
};

const publicPageUrl = (siteRoot, route) => {
  if (typeof route !== 'string' || !PUBLIC_ROUTE.test(route)) {
    throw new TypeError(`Invalid public page route: ${String(route)}`);
  }

  const relativeRoute = route === '/' ? '' : route.slice(1);
  const url = new URL(relativeRoute, siteRoot);

  if (
    url.origin !== siteRoot.origin ||
    !url.pathname.startsWith(siteRoot.pathname)
  ) {
    throw new TypeError(`Public page route escaped the configured site root: ${route}`);
  }

  return url.href;
};

const publicExternalUrl = (value, label) => {
  const url = new URL(requiredInlineText(value, label));

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new TypeError(`${label} must be an HTTPS URL without credentials.`);
  }

  return url.href;
};

const formatPage = (page, siteRoot, index) => {
  if (!page || typeof page !== 'object' || Array.isArray(page)) {
    throw new TypeError(`pages[${index}] must be an object.`);
  }

  return {
    description: markdownText(page.seo?.description, `pages[${index}].seo.description`),
    route: page.route,
    title: markdownText(page.title, `pages[${index}].title`),
    url: publicPageUrl(siteRoot, page.route),
  };
};

const pageSort = (left, right) => {
  const leftPriority = ROUTE_PRIORITY.get(left.route) ?? Number.MAX_SAFE_INTEGER;
  const rightPriority = ROUTE_PRIORITY.get(right.route) ?? Number.MAX_SAFE_INTEGER;
  return leftPriority - rightPriority || left.route.localeCompare(right.route);
};

const pageLines = (pages) =>
  pages.map((page) => `- [${page.title}](${page.url}): ${page.description}`);

export const renderLlmsTxt = ({ pages, site, siteRoot }) => {
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    throw new TypeError('site must be an object.');
  }
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new TypeError('pages must be a nonempty array.');
  }

  const root = normalizeSiteRoot(siteRoot);
  const formattedPages = pages.map((page, index) => formatPage(page, root, index));
  const routes = new Set();

  for (const page of formattedPages) {
    if (routes.has(page.route)) {
      throw new TypeError(`Duplicate public page route: ${page.route}`);
    }
    routes.add(page.route);
  }

  formattedPages.sort(pageSort);

  const primaryPages = formattedPages.filter(
    (page) => !OPTIONAL_ROUTES.has(page.route),
  );
  const optionalPages = formattedPages.filter((page) =>
    OPTIONAL_ROUTES.has(page.route),
  );
  const name = markdownText(site.name, 'site.name');
  const description = markdownText(site.description, 'site.description');
  const street = markdownText(site.address?.street, 'site.address.street');
  const city = markdownText(site.address?.city, 'site.address.city');
  const phone = markdownText(site.phone, 'site.phone');
  const email = markdownText(site.email, 'site.email');

  if (!Array.isArray(site.schedule) || site.schedule.length === 0) {
    throw new TypeError('site.schedule must be a nonempty array.');
  }

  const schedule = site.schedule
    .map((item, index) => {
      const time = markdownText(item?.time, `site.schedule[${index}].time`);
      const label = markdownText(item?.label, `site.schedule[${index}].label`);
      const note = markdownText(item?.note, `site.schedule[${index}].note`);
      return `${time} — ${label} (${note})`;
    })
    .join('; ');

  const lines = [
    `# ${name}`,
    '',
    `> ${description}`,
    '',
    `${name} is located at ${street}, ${city}. Contact: ${phone} or ${email}.`,
    '',
    `Weekly Shabbat schedule: ${schedule}.`,
    '',
    'This file is generated from the same managed content used by the public website. The linked pages are the authoritative source for current details.',
    '',
    '## Primary pages',
    '',
    ...pageLines(primaryPages),
    '',
    '## Official channels',
    '',
    `- [Directions](${publicExternalUrl(site.address?.maps, 'site.address.maps')}): Official Google Maps location.`,
    `- [Shabbat livestream and recordings](${publicExternalUrl(site.youtube, 'site.youtube')}): Official YouTube channel.`,
    `- [Facebook](${publicExternalUrl(site.facebook, 'site.facebook')}): Official congregation Facebook page.`,
  ];

  if (optionalPages.length > 0) {
    lines.push('', '## Optional', '', ...pageLines(optionalPages));
  }

  return `${lines.join('\n')}\n`;
};
