import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tina from '@tinacms/astro/integration';
import { tinaAdminDevRedirect } from '@tinacms/astro/vite';

const canonicalSiteUrl = 'https://www.avivjudea.org';
const requiredWorkersBuildVariables = [
  'PUBLIC_TINA_CLIENT_ID',
  'TINA_TOKEN',
  'WORKERS_CI_BRANCH',
];

export const validateWorkersBuildEnvironment = (environment) => {
  if (!environment.WORKERS_CI) return;

  const problems = [];
  const missingVariables = requiredWorkersBuildVariables.filter(
    (name) =>
      typeof environment[name] !== 'string' || environment[name].trim() === '',
  );

  if (environment.SITE_URL !== canonicalSiteUrl) {
    problems.push('SITE_URL must match the canonical production URL');
  }
  if (missingVariables.length > 0) {
    problems.push(`missing ${missingVariables.join(', ')}`);
  }

  if (problems.length > 0) {
    throw new Error(`Invalid Workers CI environment: ${problems.join('; ')}.`);
  }
};

validateWorkersBuildEnvironment(process.env);

const cmsEnabled =
  process.env.TINA_CMS === 'true' ||
  process.env.DEPLOY_ADAPTER === 'cloudflare' ||
  Boolean(process.env.WORKERS_CI);
const site = cmsEnabled
  ? process.env.SITE_URL || 'http://localhost:4321'
  : 'https://skarath13.github.io';
const base = cmsEnabled ? '/' : '/temple-aviv-judea';

const integrations = [
  icon({
    include: {
      tabler: [
        'arrow-right',
        'arrow-up',
        'book',
        'brand-facebook',
        'brand-paypal',
        'brand-youtube',
        'calendar-event',
        'external-link',
        'heart-handshake',
        'jewish-star',
        'lock',
        'map-pin',
        'menorah',
        'music',
        'pray',
        'script',
        'shield-check',
        'users-group',
      ],
    },
  }),
  sitemap({
    filter: (page) =>
      !page.endsWith('/admin/') &&
      !page.endsWith('/admin-preview/') &&
      !page.endsWith('/llms.txt'),
  }),
];

if (cmsEnabled) {
  integrations.push(
    tina(),
    {
      name: 'tina-island-route',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '/tina-island/[name]',
            entrypoint: new URL('./src/lib/tina/island-route.ts', import.meta.url),
            prerender: false,
          });
        },
      },
    },
    {
      name: 'hero-media-route',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '/videos/hero/[file]',
            entrypoint: new URL(
              './src/lib/hero-media-route.ts',
              import.meta.url,
            ),
            prerender: false,
          });
        },
      },
    },
  );
}

export default defineConfig({
  site,
  base,
  output: 'static',
  adapter: cmsEnabled ? cloudflare() : undefined,
  integrations,
  vite: cmsEnabled
    ? {
        define: {
          'import.meta.env.TINA_CMS': JSON.stringify('true'),
        },
        plugins: [tinaAdminDevRedirect()],
        ssr: {
          optimizeDeps: {
            include: ['debug'],
          },
        },
      }
    : undefined,
});
