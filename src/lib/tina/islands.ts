import type { IslandRegistry } from '@tinacms/astro/experimental';
import EditablePage from '../../components/pages/EditablePage.astro';
import { getTinaPage } from './data';
import type { PageKey } from '../../data/pages';

const pageKeys = new Set<PageKey>([
  'home',
  'visit',
  'story',
  'beliefs',
  'ministries',
  'give',
  'artists',
]);

const readPageKey = (params: URLSearchParams): PageKey => {
  const value = params.get('page');
  if (!value || !pageKeys.has(value as PageKey)) {
    throw new Error('Unknown or missing TinaCMS page key.');
  }
  return value as PageKey;
};

export const pageIslandWrapper = {
  tag: 'div',
  className: 'tina-page-island',
} as const;

export const islands: IslandRegistry = {
  page: {
    fetch: async (_request, params) => getTinaPage(readPageKey(params)),
    component: EditablePage,
    wrapper: pageIslandWrapper,
    propsFromData: (page, params) => ({
      page,
      pageKey: readPageKey(params),
    }),
  },
};
