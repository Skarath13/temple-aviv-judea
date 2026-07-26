import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tina from '@tinacms/astro/integration';
import { tinaAdminDevRedirect } from '@tinacms/astro/vite';

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
      !page.endsWith('/admin-preview/'),
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
