import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalCss = await readFile(
  new URL('../src/styles/global.css', import.meta.url),
  'utf8',
);

test('browser-driven document navigation scrolls without a partial smooth state', () => {
  const rootRule = globalCss.match(/html\s*\{(?<declarations>[^}]*)\}/);

  assert.ok(rootRule, 'expected a root html style rule');
  assert.match(rootRule.groups.declarations, /\bscroll-behavior:\s*auto\s*;/);
  assert.doesNotMatch(
    rootRule.groups.declarations,
    /\bscroll-behavior:\s*smooth\s*;/,
  );
});
