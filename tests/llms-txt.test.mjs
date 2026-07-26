import assert from 'node:assert/strict';
import test from 'node:test';
import { renderLlmsTxt } from '../src/lib/llms-txt.mjs';

const site = {
  name: 'Temple Aviv Judea',
  description: 'A Messianic Jewish congregation in Fullerton, California.',
  address: {
    street: '704 E Commonwealth Ave',
    city: 'Fullerton, CA 92831',
    maps: 'https://www.google.com/maps/place/704+E+Commonwealth+Ave',
  },
  phone: '(714) 748-4504',
  email: 'info@avivjudea.org',
  youtube: 'https://www.youtube.com/@templeavivjudea1558/live',
  facebook: 'https://www.facebook.com/templeavivjudea/',
  publicHours: [
    {
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '16:00',
    },
  ],
  schedule: [
    {
      time: '11:00 AM',
      label: 'Shabbat Service',
      note: 'In person & livestream',
    },
  ],
};

const pages = [
  {
    title: 'Give',
    route: '/give/',
    seo: { description: 'Support the congregation.' },
  },
  {
    title: 'Home',
    route: '/',
    seo: { description: 'Welcome to Temple Aviv Judea.' },
  },
  {
    title: 'Visit',
    route: '/visit/',
    seo: { description: 'Prepare for your first Shabbat visit.' },
  },
];

test('renders deterministic, base-aware public and optional links', () => {
  const result = renderLlmsTxt({
    pages,
    site,
    siteRoot: new URL('https://example.com/temple-aviv-judea/'),
  });

  assert.match(result, /^# Temple Aviv Judea\n\n>/);
  assert.match(
    result,
    /\[Home\]\(https:\/\/example\.com\/temple-aviv-judea\/\)/,
  );
  assert.match(
    result,
    /\[Visit\]\(https:\/\/example\.com\/temple-aviv-judea\/visit\/\)/,
  );
  assert.match(result, /Public building hours: Saturday 9 AM–4 PM\./);
  assert.match(
    result,
    /## Optional\n\n- \[Give\]\(https:\/\/example\.com\/temple-aviv-judea\/give\/\)/,
  );
  assert.ok(
    result.indexOf('[Home]') < result.indexOf('[Visit]'),
    'primary links should follow the defined route priority',
  );
  assert.ok(result.endsWith('\n'));
  assert.doesNotMatch(result, /\r/);
});

test('collapses controls and escapes CMS text that could alter Markdown structure', () => {
  const unsafePages = [
    {
      title: 'Visit]\n## Injected',
      route: '/visit/',
      seo: {
        description: 'Safe text\n- [malicious](https://attacker.example)',
      },
    },
  ];

  const result = renderLlmsTxt({
    pages: unsafePages,
    site: { ...site, name: 'Temple\n# Override' },
    siteRoot: new URL('https://www.avivjudea.org/'),
  });

  assert.match(result, /^# Temple # Override$/m);
  assert.match(result, /\[Visit\\\] ## Injected\]/);
  assert.match(
    result,
    /Safe text - \\\[malicious\\\]\(https:\/\/attacker\.example\)/,
  );
  assert.doesNotMatch(result, /^## Injected$/m);
});

test('rejects duplicate or unsafe page routes', () => {
  assert.throws(
    () =>
      renderLlmsTxt({
        pages: [...pages, pages[1]],
        site,
        siteRoot: new URL('https://www.avivjudea.org/'),
      }),
    /Duplicate public page route/,
  );

  assert.throws(
    () =>
      renderLlmsTxt({
        pages: [{ ...pages[1], route: '//attacker.example/' }],
        site,
        siteRoot: new URL('https://www.avivjudea.org/'),
      }),
    /Invalid public page route/,
  );
});

test('rejects unsafe site roots and official channel URLs', () => {
  assert.throws(
    () =>
      renderLlmsTxt({
        pages,
        site,
        siteRoot: new URL('https://user:secret@example.com/'),
      }),
    /siteRoot must be a public HTTP/,
  );

  assert.throws(
    () =>
      renderLlmsTxt({
        pages,
        site: { ...site, youtube: 'javascript:alert(1)' },
        siteRoot: new URL('https://www.avivjudea.org/'),
      }),
    /site.youtube must be an HTTPS URL/,
  );
});
