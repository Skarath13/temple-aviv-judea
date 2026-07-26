import { defineConfig } from 'tinacms';
import { EventCollection } from './collections/events';
import { PageCollection } from './collections/pages';
import { SiteSettingsCollection } from './collections/site-settings';

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.WORKERS_CI_BRANCH ||
  process.env.CF_PAGES_BRANCH ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections: [
      SiteSettingsCollection,
      PageCollection,
      EventCollection,
    ],
  },
});
