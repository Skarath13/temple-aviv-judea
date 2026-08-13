import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { validateWorkersBuildEnvironment } from '../astro.config.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const validWorkersEnvironment = {
  WORKERS_CI: '1',
  WORKERS_CI_BRANCH: 'main',
  SITE_URL: 'https://www.avivjudea.org',
  PUBLIC_TINA_CLIENT_ID: 'public-client-id-for-test',
  TINA_TOKEN: 'private-token-for-test',
};

test('accepts the complete canonical Workers production environment', () => {
  assert.doesNotThrow(() =>
    validateWorkersBuildEnvironment(validWorkersEnvironment),
  );
});

test('does not impose production requirements outside Workers CI', () => {
  for (const environment of [
    {},
    { TINA_CMS: 'true' },
    { DEPLOY_ADAPTER: 'cloudflare' },
  ]) {
    assert.doesNotThrow(() => validateWorkersBuildEnvironment(environment));
  }
});

test('fails while loading the Astro config in an incomplete Workers CI environment', () => {
  const {
    PUBLIC_TINA_CLIENT_ID: _publicClientId,
    SITE_URL: _siteUrl,
    TINA_TOKEN: _token,
    WORKERS_CI_BRANCH: _branch,
    ...environment
  } = process.env;
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', "await import('./astro.config.mjs')"],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: { ...environment, WORKERS_CI: '1' },
    },
  );
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /SITE_URL must match the canonical production URL/);
  assert.match(output, /PUBLIC_TINA_CLIENT_ID/);
  assert.match(output, /TINA_TOKEN/);
  assert.match(output, /WORKERS_CI_BRANCH/);
});

test('rejects missing or blank Tina and branch variables by name', () => {
  const invalidEnvironment = {
    ...validWorkersEnvironment,
    WORKERS_CI_BRANCH: ' ',
    PUBLIC_TINA_CLIENT_ID: '',
    TINA_TOKEN: undefined,
  };

  assert.throws(
    () => validateWorkersBuildEnvironment(invalidEnvironment),
    (error) => {
      assert.match(error.message, /PUBLIC_TINA_CLIENT_ID/);
      assert.match(error.message, /TINA_TOKEN/);
      assert.match(error.message, /WORKERS_CI_BRANCH/);
      return true;
    },
  );
});

test('rejects every noncanonical Workers SITE_URL variant', () => {
  for (const siteUrl of [
    undefined,
    '',
    'http://www.avivjudea.org',
    'https://avivjudea.org',
    'https://www.avivjudea.org/',
  ]) {
    assert.throws(
      () =>
        validateWorkersBuildEnvironment({
          ...validWorkersEnvironment,
          SITE_URL: siteUrl,
        }),
      /SITE_URL must match the canonical production URL/,
    );
  }
});

test('validation errors never disclose environment values', () => {
  const invalidEnvironment = {
    ...validWorkersEnvironment,
    WORKERS_CI_BRANCH: 'secret-branch-value',
    SITE_URL: 'https://wrong.example/private-path',
    PUBLIC_TINA_CLIENT_ID: 'secret-client-value',
    TINA_TOKEN: 'secret-token-value',
  };

  assert.throws(
    () => validateWorkersBuildEnvironment(invalidEnvironment),
    (error) => {
      for (const value of Object.values(invalidEnvironment)) {
        assert.equal(error.message.includes(value), false);
      }
      return true;
    },
  );
});
