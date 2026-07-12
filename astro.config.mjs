import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://skarath13.github.io',
  base: '/temple-aviv-judea',
  integrations: [
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
    sitemap({ filter: (page) => !page.endsWith('/admin/') }),
  ],
});
