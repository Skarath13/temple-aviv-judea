import { requestWithMetadata } from '@tinacms/astro/data';
import client from '../../../tina/__generated__/client';
import type {
  EventScheduleQuery,
  PageQuery,
  SiteSettingsQuery,
} from '../../../tina/__generated__/types';
import type { PageKey } from '../../data/pages';
import { eventSchedule } from '../../data/events';
import { site } from '../../data/site';

export const cmsEnabled = import.meta.env.TINA_CMS === 'true';

const relativePath = (pageKey: PageKey) => `${pageKey}.mdx`;

export interface TinaPageBundle {
  page: PageQuery['page'];
  siteSettings: SiteSettingsQuery['siteSettings'];
  eventSchedule: EventScheduleQuery['eventSchedule'];
}

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
  if (!cmsEnabled) {
    const { pages } = await import('#static-pages');
    return pages[pageKey];
  }
  return getTinaPage(pageKey);
};

export const getTinaSiteSettings = async (): Promise<
  SiteSettingsQuery['siteSettings']
> => {
  const result = await requestWithMetadata(
    client.queries.siteSettings({ relativePath: 'site.json' }),
  );

  if (!result.data.siteSettings) {
    throw new Error('TinaCMS did not return the site settings.');
  }

  return result.data.siteSettings;
};

export const getTinaEventSchedule = async (): Promise<
  EventScheduleQuery['eventSchedule']
> => {
  const result = await requestWithMetadata(
    client.queries.eventSchedule({ relativePath: 'events.json' }),
  );

  if (!result.data.eventSchedule) {
    throw new Error('TinaCMS did not return the upcoming events.');
  }

  return result.data.eventSchedule;
};

export const getTinaPageBundle = async (
  pageKey: PageKey,
): Promise<TinaPageBundle> => {
  const [page, siteSettings, resolvedEventSchedule] = await Promise.all([
    getTinaPage(pageKey),
    getTinaSiteSettings(),
    pageKey === 'home'
      ? getTinaEventSchedule()
      : Promise.resolve(eventSchedule),
  ]);

  return {
    page,
    siteSettings,
    eventSchedule: resolvedEventSchedule,
  };
};

export const getPageBundle = async (
  pageKey: PageKey,
): Promise<TinaPageBundle> => {
  if (cmsEnabled) return getTinaPageBundle(pageKey);
  const { pages } = await import('#static-pages');
  return {
    page: pages[pageKey],
    siteSettings: site,
    eventSchedule,
  };
};
