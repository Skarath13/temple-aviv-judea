import type { PageQuery } from "../../tina/__generated__/types";
import { frontmatter as beliefsContent } from "../content/pages/beliefs.mdx";
import { frontmatter as homeContent } from "../content/pages/home.mdx";
import { frontmatter as ministriesContent } from "../content/pages/ministries.mdx";
import { frontmatter as storyContent } from "../content/pages/story.mdx";

export type PageKey = "home" | "story" | "beliefs" | "ministries";

export type CmsPage = PageQuery["page"];

export const pages: Record<PageKey, CmsPage> = {
	home: homeContent,
	story: storyContent,
	beliefs: beliefsContent,
	ministries: ministriesContent,
} as unknown as Record<PageKey, CmsPage>;
