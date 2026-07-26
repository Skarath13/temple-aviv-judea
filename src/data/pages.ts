import artistsContent from '../content/pages/artists.json';
import beliefsContent from '../content/pages/beliefs.json';
import giveContent from '../content/pages/give.json';
import homeContent from '../content/pages/home.json';
import ministriesContent from '../content/pages/ministries.json';
import storyContent from '../content/pages/story.json';
import visitContent from '../content/pages/visit.json';
import type { PageQuery } from '../../tina/__generated__/types';

export type PageKey =
  | 'home'
  | 'visit'
  | 'story'
  | 'beliefs'
  | 'ministries'
  | 'give'
  | 'artists';

export type CmsPage = PageQuery['page'];

export const pages: Record<PageKey, CmsPage> = {
  home: homeContent,
  visit: visitContent,
  story: storyContent,
  beliefs: beliefsContent,
  ministries: ministriesContent,
  give: giveContent,
  artists: artistsContent,
} as unknown as Record<PageKey, CmsPage>;
