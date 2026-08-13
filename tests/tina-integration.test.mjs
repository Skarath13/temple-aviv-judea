import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolveTinaBranch } from '../src/lib/tina/branch.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all seven public routes use the typed CMS page boundary', async () => {
  const routes = new Map([
    ['src/pages/index.astro', 'home'],
    ['src/pages/visit.astro', 'visit'],
    ['src/pages/story.astro', 'story'],
    ['src/pages/beliefs.astro', 'beliefs'],
    ['src/pages/ministries.astro', 'ministries'],
    ['src/pages/give.astro', 'give'],
    ['src/pages/artists.astro', 'artists'],
  ]);

  for (const [path, pageKey] of routes) {
    const source = await read(path);
    assert.match(source, /import CmsPage from/);
    assert.match(source, new RegExp(`<CmsPage pageKey=["']${pageKey}["']`));
  }
});

test('page, settings, and event preview queries retain Tina metadata', async () => {
  const source = await read('src/lib/tina/data.ts');
  assert.match(source, /requestWithMetadata\([\s\S]*client\.queries\.page/);
  assert.match(source, /client\.queries\.siteSettings/);
  assert.match(source, /client\.queries\.eventSchedule/);
  assert.match(source, /priority:\s*['"]primary['"]/);
});

test('visual editing has one primary page island plus live global islands', async () => {
  const [page, layout, registry] = await Promise.all([
    read('src/components/pages/CmsPage.astro'),
    read('src/layouts/BaseLayout.astro'),
    read('src/lib/tina/islands.ts'),
  ]);

  assert.match(page, /<TinaIsland name="page"[^>]*primary>/);
  assert.match(layout, /<TinaIsland name="header"/);
  assert.match(layout, /<TinaIsland name="footer"/);
  assert.match(layout, /new MutationObserver\(refreshExpiredEvents\)/);
  for (const name of ['page', 'header', 'footer']) {
    assert.match(registry, new RegExp(`\\n  ${name}: \\{`));
  }
  assert.match(registry, /getTinaPageBundle/);
  assert.match(registry, /getTinaSiteSettings/);
});

test('an empty event schedule remains discoverable only inside Tina preview', async () => {
  const [layout, events, styles] = await Promise.all([
    read('src/layouts/BaseLayout.astro'),
    read('src/components/UpcomingEvents.astro'),
    read('src/styles/global.css'),
  ]);
  assert.match(layout, /classList\.add\(['"]tina-preview['"]\)/);
  assert.match(events, /tina-empty-events/);
  assert.match(events, /tinaField\(schedule, ['"]events['"]\)/);
  assert.match(styles, /\.tina-empty-events\s*\{\s*display:\s*none/);
  assert.match(styles, /html\.tina-preview \.tina-empty-events\s*\{\s*display:\s*block/);
});

test('the preview renderer stays an on-demand Tina route', async () => {
  const [config, route] = await Promise.all([
    read('astro.config.mjs'),
    read('src/lib/tina/island-route.ts'),
  ]);

  assert.match(config, /pattern:\s*['"]\/tina-island\/\[name\]['"]/);
  assert.match(config, /prerender:\s*false/);
  assert.match(route, /experimental_createIslandRoute\(islands\)/);
});

test('the Cloudflare build validates content before Astro emits a Worker', async () => {
  const packageJson = JSON.parse(await read('package.json'));
  const command = packageJson.scripts['build:cloudflare'];
  assert.match(command, /TINA_CMS=true tinacms build/);
  assert.match(command, /pnpm run validate:content && astro check && astro build/);
});

test('Cloudflare branch injection wins and local mode safely falls back to main', () => {
  assert.equal(resolveTinaBranch({}), 'main');
  assert.equal(resolveTinaBranch({ WORKERS_CI_BRANCH: 'main' }), 'main');
  assert.equal(resolveTinaBranch({
    WORKERS_CI_BRANCH: 'cloudflare-branch',
    GITHUB_BRANCH: 'unrelated-branch',
  }), 'cloudflare-branch');
  assert.equal(resolveTinaBranch({ WORKERS_CI_BRANCH: '   ', HEAD: 'preview' }), 'preview');
});

test('the committed Tina schema lock matches all editor-visible models', async () => {
  const lock = await read('tina/tina-lock.json');
  for (const fieldName of [
    'livestreamNote',
    'headerCopy',
    'footerCopy',
    'sectionCopy',
    'endsAt',
    'kind',
  ]) {
    assert.match(lock, new RegExp(`"name":"${fieldName}"`));
  }
  assert.doesNotMatch(lock, /"name":"watchNote"/);
});
