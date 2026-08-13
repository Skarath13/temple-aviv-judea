import { defineConfig } from 'tinacms';
import { resolveTinaBranch } from '../src/lib/tina/branch.mjs';
import { EventCollection } from './collections/events';
import { PageCollection } from './collections/pages';
import { SiteSettingsCollection } from './collections/site-settings';

const branch = resolveTinaBranch(process.env);

export default defineConfig({
  branch,
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  repoProvider: {
    defaultBranchName: 'main',
    historyUrl: ({ relativePath, branch: currentBranch }) => ({
      url: `https://github.com/Skarath13/temple-aviv-judea/commits/${encodeURIComponent(currentBranch)}/${relativePath
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
    }),
  },
  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'images',
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
