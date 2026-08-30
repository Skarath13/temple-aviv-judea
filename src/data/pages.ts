import type { PageQuery } from "../../tina/__generated__/types";
import { frontmatter as beliefsContent } from "../content/pages/beliefs.mdx";
import { frontmatter as giveContent } from "../content/pages/give.mdx";
import { frontmatter as homeContent } from "../content/pages/home.mdx";
import { frontmatter as ministriesContent } from "../content/pages/ministries.mdx";
import { frontmatter as storyContent } from "../content/pages/story.mdx";
import { frontmatter as visitContent } from "../content/pages/visit.mdx";
import { normalizePageFrontmatter } from "../lib/page-frontmatter.mjs";

export type PageKey =
	| "home"
	| "visit"
	| "story"
	| "beliefs"
	| "ministries"
	| "give";

export type CmsPage = PageQuery["page"];

export const pages: Record<PageKey, CmsPage> = Object.fromEntries(
	Object.entries({
		home: homeContent,
		visit: visitContent,
		story: storyContent,
		beliefs: beliefsContent,
		ministries: ministriesContent,
		give: giveContent,
	}).map(([key, page]) => [key, normalizePageFrontmatter(page)]),
) as Record<PageKey, CmsPage>;
