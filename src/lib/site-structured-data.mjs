const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const DAY_INDEX = new Map(DAY_ORDER.map((day, index) => [day, index]));
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const requiredText = (value, label) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${label} must be a nonempty string.`);
  }

  return value.trim();
};

const publicUrl = (value, label, { httpsOnly = false } = {}) => {
  const url = value instanceof URL ? new URL(value) : new URL(requiredText(value, label));
  const allowedProtocols = httpsOnly ? ['https:'] : ['http:', 'https:'];

  if (!allowedProtocols.includes(url.protocol) || url.username || url.password) {
    const protocolLabel = httpsOnly ? 'an HTTPS' : 'a public HTTP(S)';
    throw new TypeError(`${label} must be ${protocolLabel} URL without credentials.`);
  }

  return url;
};

const formatTime = (value) => {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${minute === '00' ? '' : `:${minute}`} ${suffix}`;
};

export const normalizePublicHours = (hours) => {
  if (!Array.isArray(hours) || hours.length === 0 || hours.length > DAY_ORDER.length) {
    throw new TypeError('site.publicHours must contain between 1 and 7 entries.');
  }

  const days = new Set();
  const normalized = hours.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new TypeError(`site.publicHours[${index}] must be an object.`);
    }

    const dayOfWeek = requiredText(
      item.dayOfWeek,
      `site.publicHours[${index}].dayOfWeek`,
    );
    const opens = requiredText(item.opens, `site.publicHours[${index}].opens`);
    const closes = requiredText(item.closes, `site.publicHours[${index}].closes`);

    if (!DAY_INDEX.has(dayOfWeek)) {
      throw new TypeError(`site.publicHours[${index}].dayOfWeek is not a valid weekday.`);
    }
    if (days.has(dayOfWeek)) {
      throw new TypeError(`site.publicHours contains duplicate day ${dayOfWeek}.`);
    }
    if (!TIME_PATTERN.test(opens) || !TIME_PATTERN.test(closes)) {
      throw new TypeError(
        `site.publicHours[${index}] must use 24-hour HH:MM opening and closing times.`,
      );
    }
    if (opens >= closes) {
      throw new TypeError(`site.publicHours[${index}].opens must be before closes.`);
    }

    days.add(dayOfWeek);
    return { dayOfWeek, opens, closes };
  });

  return normalized.sort(
    (left, right) => DAY_INDEX.get(left.dayOfWeek) - DAY_INDEX.get(right.dayOfWeek),
  );
};

export const formatPublicHours = (hours) =>
  normalizePublicHours(hours)
    .map(
      ({ dayOfWeek, opens, closes }) =>
        `${dayOfWeek} ${formatTime(opens)}–${formatTime(closes)}`,
    )
    .join('; ');

export const createSiteStructuredData = ({ site, siteRoot, imageUrl }) => {
  if (!site || typeof site !== 'object' || Array.isArray(site)) {
    throw new TypeError('site must be an object.');
  }

  const root = publicUrl(siteRoot, 'siteRoot');
  if (root.search || root.hash) {
    throw new TypeError('siteRoot must not include a query or fragment.');
  }
  if (!root.pathname.endsWith('/')) root.pathname += '/';

  const image = publicUrl(imageUrl, 'imageUrl');
  const maps = publicUrl(site.address?.maps, 'site.address.maps', { httpsOnly: true });
  const sameAs = [
    publicUrl(site.facebook, 'site.facebook', { httpsOnly: true }).href,
    publicUrl(site.youtube, 'site.youtube', { httpsOnly: true }).href,
  ];
  const phoneHref = requiredText(site.phoneHref, 'site.phoneHref');
  if (!/^tel:\+[1-9]\d{7,14}$/.test(phoneHref)) {
    throw new TypeError('site.phoneHref must contain an E.164 telephone link.');
  }

  const country = requiredText(site.address?.country, 'site.address.country');
  if (!/^[A-Z]{2}$/.test(country)) {
    throw new TypeError('site.address.country must be a two-letter uppercase country code.');
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Synagogue',
    '@id': new URL('#synagogue', root).href,
    name: requiredText(site.name, 'site.name'),
    description: requiredText(site.description, 'site.description'),
    url: root.href,
    image: image.href,
    logo: image.href,
    email: requiredText(site.email, 'site.email'),
    telephone: phoneHref.slice('tel:'.length),
    hasMap: maps.href,
    sameAs: [...new Set(sameAs)],
    openingHoursSpecification: normalizePublicHours(site.publicHours).map(
      ({ dayOfWeek, opens, closes }) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${dayOfWeek}`,
        opens,
        closes,
      }),
    ),
    address: {
      '@type': 'PostalAddress',
      streetAddress: requiredText(site.address?.street, 'site.address.street'),
      addressLocality: requiredText(site.address?.locality, 'site.address.locality'),
      addressRegion: requiredText(site.address?.region, 'site.address.region'),
      postalCode: requiredText(site.address?.postalCode, 'site.address.postalCode'),
      addressCountry: country,
    },
  };
};

export const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) =>
      ({
        '<': '\\u003C',
        '>': '\\u003E',
        '&': '\\u0026',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029',
      })[character],
  );
