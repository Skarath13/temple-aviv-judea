import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://www.avivjudea.org',
  integrations: [
    icon({
      include: {
        tabler: [
          'arrow-right',
          'book',
          'brand-facebook',
          'brand-youtube',
          'external-link',
          'heart-handshake',
          'jewish-star',
          'map-pin',
          'menorah',
          'music',
          'pray',
          'script',
          'users-group',
        ],
      },
    }),
    sitemap(),
  ],
});
