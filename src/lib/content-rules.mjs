const controlOrBackslash = /[\\\u0000-\u001f\u007f]/;
const emailAddress = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const e164TelephoneLink = /^tel:\+[1-9]\d{7,14}$/;
const twentyFourHourTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const managedImagePath = /^\/images\/[A-Za-z0-9._/-]+$/;

export const allowedSiteHosts = Object.freeze({
  etsy: Object.freeze(['www.etsy.com', 'etsy.com']),
  facebook: Object.freeze(['www.facebook.com', 'facebook.com', 'm.facebook.com']),
  googleMaps: Object.freeze([
    'www.google.com',
    'maps.google.com',
    'maps.app.goo.gl',
  ]),
  mapApp: Object.freeze(['maps.rbt.no']),
  paypal: Object.freeze(['www.paypal.com', 'paypal.com']),
  tinaMedia: Object.freeze(['assets.tina.io']),
  youtube: Object.freeze(['www.youtube.com', 'youtube.com', 'youtu.be']),
});

export const approvedGivingUrl =
  'https://www.paypal.com/donate/?business=avivjudea613%40gmail.com&no_recurring=0&item_name=Temple%20Aviv%20Judea&currency_code=USD';

export const parseSecureUrl = (value) => {
  if (typeof value !== 'string' || value !== value.trim() || !value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      controlOrBackslash.test(value)
    ) return null;
    return url;
  } catch {
    return null;
  }
};

export const isAllowedSecureUrl = (value, allowedHosts) => {
  const url = parseSecureUrl(value);
  return Boolean(url && allowedHosts.includes(url.hostname.toLowerCase()));
};

export const isApprovedGivingUrl = (value) =>
  typeof value === 'string' && value === approvedGivingUrl;

export const isEmailAddress = (value) =>
  typeof value === 'string' &&
  value === value.trim() &&
  emailAddress.test(value);

export const isTelephoneLink = (value) =>
  typeof value === 'string' && e164TelephoneLink.test(value);

export const isTwentyFourHourTime = (value) =>
  typeof value === 'string' && twentyFourHourTime.test(value);

export const isRootRelativePath = (value) =>
  typeof value === 'string' &&
  value === value.trim() &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !controlOrBackslash.test(value);

export const isSafeCmsLink = (value) => {
  if (typeof value !== 'string' || value !== value.trim() || !value) return false;
  if (controlOrBackslash.test(value)) return false;
  if (isRootRelativePath(value)) return true;
  if (value.startsWith('#') && value.length > 1) return true;
  if (value.startsWith('mailto:')) {
    if (/%0[ad]/i.test(value)) return false;
    const [address, query = ''] = value.slice(7).split('?', 2);
    if (!isEmailAddress(address)) return false;
    const params = new URLSearchParams(query);
    return [...params].every(([key, item]) =>
      (key === 'subject' || key === 'body') && !controlOrBackslash.test(item));
  }
  if (value.startsWith('tel:')) return isTelephoneLink(value);
  return Boolean(parseSecureUrl(value));
};

export const isManagedImageSource = (value) => {
  if (typeof value !== 'string' || value !== value.trim() || !value) return false;
  if (managedImagePath.test(value)) {
    return value.split('/').every((segment) => segment !== '.' && segment !== '..');
  }
  return isAllowedSecureUrl(value, allowedSiteHosts.tinaMedia);
};

export const validateSafeLink = (value) => {
  if (!value) return undefined;
  return isSafeCmsLink(value)
    ? undefined
    : 'Use an HTTPS URL, a root-relative site path, an email link, a phone link, or an in-page # link.';
};

export const validateAllowedHost = (value, allowedHosts, serviceName) => {
  if (!value) return undefined;
  return isAllowedSecureUrl(value, allowedHosts)
    ? undefined
    : `Use a secure ${serviceName} URL.`;
};

export const validateEmailAddress = (value) => {
  if (!value) return undefined;
  return isEmailAddress(value) ? undefined : 'Enter a valid email address.';
};

export const validateTelephoneLink = (value) => {
  if (!value) return undefined;
  return isTelephoneLink(value)
    ? undefined
    : 'Use tel:+ followed by 8 to 15 digits, including the country code.';
};

export const validateTwentyFourHourTime = (value) => {
  if (!value) return undefined;
  return isTwentyFourHourTime(value)
    ? undefined
    : 'Use 24-hour HH:MM format, for example 09:00.';
};

export const validateRootRelativePath = (value) => {
  if (!value) return undefined;
  return isRootRelativePath(value)
    ? undefined
    : 'Use a root-relative site path such as /visit/.';
};
