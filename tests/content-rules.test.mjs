import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowedSiteHosts,
  approvedGivingUrl,
  isAllowedSecureUrl,
  isApprovedGivingUrl,
  isEmailAddress,
  isManagedImageSource,
  isRootRelativePath,
  isSafeCmsLink,
  isTelephoneLink,
  isTwentyFourHourTime,
  parseSecureUrl,
  validateAllowedHost,
  validateEmailAddress,
  validateRootRelativePath,
  validateSafeLink,
  validateTelephoneLink,
  validateTwentyFourHourTime,
} from '../src/lib/content-rules.mjs';

test('accepts only clean root-relative site paths', () => {
  const valid = [
    '/',
    '/visit/',
    '/beliefs/#prayer',
    '/search/?query=shabbat',
  ];
  const invalid = [
    '',
    'visit/',
    '//attacker.example/path',
    '/\\attacker.example/path',
    '/safe\\path',
    '/safe\npath',
    '/safe\u0000path',
    '/safe\u007fpath',
    ' /visit/',
    '/visit/ ',
    null,
  ];

  for (const value of valid) {
    assert.equal(isRootRelativePath(value), true, value);
    assert.equal(isSafeCmsLink(value), true, value);
  }
  for (const value of invalid) {
    assert.equal(isRootRelativePath(value), false, String(value));
    assert.equal(isSafeCmsLink(value), false, String(value));
  }
});

test('accepts clean HTTPS URLs and rejects insecure or ambiguous URLs', () => {
  for (const value of [
    'https://example.com/',
    'https://example.com/path?query=value#result',
    'https://EXAMPLE.com/path',
    'https://example.com:443/path',
  ]) {
    assert.ok(parseSecureUrl(value), value);
    assert.equal(isSafeCmsLink(value), true, value);
  }

  for (const value of [
    'http://example.com/',
    'ftp://example.com/file',
    '//example.com/path',
    'https://user@example.com/',
    'https://user:password@example.com/',
    'https:\\example.com\\path',
    'https://example.com/safe\\path',
    'https://example.com/safe\npath',
    'https://example.com/safe\tpath',
    'https://example.com/safe\u0000path',
    'https://example.com/safe\u007fpath',
    'https://example.com:444/path',
    ' https://example.com/',
    'https://example.com/ ',
    'javascript:alert(1)',
    'data:text/html,unsafe',
    '',
    null,
  ]) {
    assert.equal(parseSecureUrl(value), null, String(value));
    assert.equal(isSafeCmsLink(value), false, String(value));
  }
});

test('email links allow safe subject/body text but reject header injection', () => {
  assert.equal(
    isSafeCmsLink('mailto:editor@example.com?subject=Shabbat%20visit'),
    true,
  );
  assert.equal(
    isSafeCmsLink('mailto:editor@example.com?cc=attacker@example.com'),
    false,
  );
  assert.equal(
    isSafeCmsLink('mailto:editor@example.com?subject=Hello%0ABcc:attacker@example.com'),
    false,
  );
});

test('provider URLs require an exact allowlisted hostname', () => {
  for (const [provider, hosts] of Object.entries(allowedSiteHosts)) {
    assert.ok(hosts.length > 0, `${provider} must define at least one host`);

    for (const host of hosts) {
      assert.equal(
        isAllowedSecureUrl(`https://${host}/safe/path`, hosts),
        true,
        `${provider}: ${host}`,
      );
      assert.equal(
        isAllowedSecureUrl(`https://${host.toUpperCase()}/safe/path`, hosts),
        true,
        `${provider}: host matching should be case-insensitive`,
      );
      assert.equal(
        isAllowedSecureUrl(`https://subdomain.${host}/`, hosts),
        false,
        `${provider}: unexpected subdomain`,
      );
      assert.equal(
        isAllowedSecureUrl(`https://${host}.attacker.example/`, hosts),
        false,
        `${provider}: hostname suffix trick`,
      );
      assert.equal(
        isAllowedSecureUrl(`https://attacker-${host}/`, hosts),
        false,
        `${provider}: lookalike hostname`,
      );
      assert.equal(
        isAllowedSecureUrl(`http://${host}/`, hosts),
        false,
        `${provider}: insecure scheme`,
      );
    }
  }

  assert.equal(
    isAllowedSecureUrl(
      'https://www.paypal.com.attacker.example/donate',
      allowedSiteHosts.paypal,
    ),
    false,
  );
  assert.equal(
    isAllowedSecureUrl(
      'https://www.paypal.com@attacker.example/donate',
      allowedSiteHosts.paypal,
    ),
    false,
  );
});

test('the donation destination cannot be changed to another PayPal account', () => {
  assert.equal(isApprovedGivingUrl(approvedGivingUrl), true);
  assert.equal(
    isApprovedGivingUrl('https://www.paypal.com/donate/?business=attacker%40example.com'),
    false,
  );
});

test('validates email addresses used by CMS contact fields', () => {
  for (const value of [
    'editor@example.com',
    'first.last+tag@subdomain.example.org',
  ]) {
    assert.equal(isEmailAddress(value), true, value);
  }

  for (const value of [
    '',
    'editor',
    'editor@example',
    '@example.com',
    'editor @example.com',
    'editor@example.com ',
    'editor\n@example.com',
    'mailto:editor@example.com',
    null,
  ]) {
    assert.equal(isEmailAddress(value), false, String(value));
  }
});

test('requires canonical E.164 telephone links', () => {
  for (const value of [
    'tel:+12345678',
    'tel:+17147484504',
    'tel:+123456789012345',
  ]) {
    assert.equal(isTelephoneLink(value), true, value);
    assert.equal(isSafeCmsLink(value), true, value);
  }

  for (const value of [
    'tel:+1234567',
    'tel:+1234567890123456',
    'tel:+0123456789',
    'tel:17147484504',
    'tel:+1 714 748 4504',
    'tel:+1-714-748-4504',
    'TEL:+17147484504',
    'tel:+17147484504 ',
    null,
  ]) {
    assert.equal(isTelephoneLink(value), false, String(value));
  }
});

test('requires zero-padded 24-hour HH:MM times', () => {
  for (const value of ['00:00', '09:00', '12:30', '23:59']) {
    assert.equal(isTwentyFourHourTime(value), true, value);
  }

  for (const value of [
    '9:00',
    '24:00',
    '23:60',
    '12:5',
    '12:30 PM',
    ' 12:30',
    '12:30 ',
    '',
    null,
  ]) {
    assert.equal(isTwentyFourHourTime(value), false, String(value));
  }
});

test('managed images stay under /images or the exact Tina media host', () => {
  for (const value of [
    '/images/photo.webp',
    '/images/events/shabbat.jpg',
    'https://assets.tina.io/example/photo.webp',
    'https://ASSETS.TINA.IO/example/photo.webp',
  ]) {
    assert.equal(isManagedImageSource(value), true, value);
  }

  for (const value of [
    '/assets/images/photo.webp',
    'images/photo.webp',
    '//assets.tina.io/example/photo.webp',
    'http://assets.tina.io/example/photo.webp',
    'https://subdomain.assets.tina.io/example/photo.webp',
    'https://assets.tina.io.attacker.example/photo.webp',
    'https://example.com/photo.webp',
    'https://user@assets.tina.io/example/photo.webp',
    '/images/safe\\photo.webp',
    '/images/safe\nphoto.webp',
    '/images/safe\u0000photo.webp',
    '/images/safe\u007fphoto.webp',
    ' /images/photo.webp',
    '/images/photo.webp ',
    '',
    null,
  ]) {
    assert.equal(isManagedImageSource(value), false, String(value));
  }
});

test('editor validators accept empty optional values and explain invalid values', () => {
  assert.equal(validateSafeLink(undefined), undefined);
  assert.equal(validateAllowedHost('', allowedSiteHosts.youtube, 'YouTube'), undefined);
  assert.equal(validateEmailAddress(null), undefined);
  assert.equal(validateTelephoneLink(undefined), undefined);
  assert.equal(validateTwentyFourHourTime(''), undefined);
  assert.equal(validateRootRelativePath(null), undefined);

  assert.equal(validateSafeLink('/visit/'), undefined);
  assert.equal(
    validateAllowedHost(
      'https://www.youtube.com/@temple/live',
      allowedSiteHosts.youtube,
      'YouTube',
    ),
    undefined,
  );
  assert.equal(validateEmailAddress('editor@example.com'), undefined);
  assert.equal(validateTelephoneLink('tel:+17147484504'), undefined);
  assert.equal(validateTwentyFourHourTime('09:00'), undefined);
  assert.equal(validateRootRelativePath('/visit/'), undefined);

  for (const message of [
    validateSafeLink('javascript:alert(1)'),
    validateAllowedHost(
      'https://youtube.com.attacker.example/',
      allowedSiteHosts.youtube,
      'YouTube',
    ),
    validateEmailAddress('not-an-email'),
    validateTelephoneLink('tel:7147484504'),
    validateTwentyFourHourTime('9:00'),
    validateRootRelativePath('//attacker.example/'),
  ]) {
    assert.equal(typeof message, 'string');
    assert.ok(message.length > 0);
  }
});
