import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../../tina/__generated__/client';
import type { PageQuery } from '../../../tina/__generated__/types';
import { pages, type PageKey } from '../../data/pages';

export const cmsEnabled =
  process.env.TINA_CMS === 'true' ||
  process.env.DEPLOY_ADAPTER === 'cloudflare' ||
  Boolean(process.env.WORKERS_CI);

const relativePath = (pageKey: PageKey) => `${pageKey}.json`;

export const getTinaPage = async (
  pageKey: PageKey,
): Promise<PageQuery['page']> => {
  const result = await requestWithMetadata(
    client.queries.page({ relativePath: relativePath(pageKey) }),
    { priority: 'primary' },
  );

  if (!result.data.page) {
    throw new Error(`TinaCMS did not return the ${pageKey} page.`);
  }

  return result.data.page;
};

export const getPage = async (
  pageKey: PageKey,
): Promise<PageQuery['page']> => {
  if (!cmsEnabled) return pages[pageKey];
  return getTinaPage(pageKey);
};
