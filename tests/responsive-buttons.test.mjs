import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalCss = await readFile(
  new URL('../src/styles/global.css', import.meta.url),
  'utf8',
);

test('shared buttons retain readable text and a usable compact target', () => {
  const buttonRule = globalCss.match(
    /\.button\s*\{(?<declarations>[^}]*)\}/,
  );
  const smallButtonRule = globalCss.match(
    /\.button-small\s*\{(?<declarations>[^}]*)\}/,
  );

  assert.ok(buttonRule, 'expected the shared button rule');
  assert.match(buttonRule.groups.declarations, /\bmax-width:\s*100%\s*;/);
  assert.match(buttonRule.groups.declarations, /\bline-height:\s*1\.2\s*;/);
  assert.match(
    buttonRule.groups.declarations,
    /\boverflow-wrap:\s*anywhere\s*;/,
  );
  assert.match(buttonRule.groups.declarations, /\btext-align:\s*center\s*;/);

  assert.ok(smallButtonRule, 'expected the compact button rule');
  assert.match(
    smallButtonRule.groups.declarations,
    /\bmin-height:\s*2\.75rem\s*;/,
  );
});

test('map and donation controls stop compressing before their labels clip', () => {
  assert.match(
    globalCss,
    /\.location-grid \.location-address\s*\{[^}]*font-size:\s*clamp\(2\.5rem,\s*4\.7vw,\s*4rem\)\s*;[^}]*\}/,
  );
  assert.match(
    globalCss,
    /\.location-grid > \.button\s*\{[^}]*flex:\s*0 0 auto\s*;[^}]*white-space:\s*nowrap\s*;[^}]*\}/,
  );

  const tabletRules = globalCss.match(
    /@media \(max-width:\s*900px\)\s*\{(?<declarations>[\s\S]*?)\n\}/,
  );
  assert.ok(tabletRules, 'expected the constrained-layout breakpoint');
  assert.match(
    tabletRules.groups.declarations,
    /\.paypal-button-grid\s*\{[^}]*grid-template-columns:\s*1fr\s*;[^}]*\}/,
  );
  assert.match(
    tabletRules.groups.declarations,
    /\.location-grid\s*\{[^}]*flex-direction:\s*column\s*;[^}]*\}/,
  );
});
