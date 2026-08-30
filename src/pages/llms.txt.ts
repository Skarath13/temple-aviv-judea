import type { APIRoute } from "astro";
import type { PageKey } from "../data/pages";
import { renderLlmsTxt } from "../lib/llms-txt.mjs";
import { cmsEnabled, getPage, getTinaSiteSettings } from "../lib/tina/data";
import { withBase } from "../lib/urls";

export const prerender = true;

const pageKeys: readonly PageKey[] = [
	"home",
	"visit",
	"story",
	"beliefs",
	"ministries",
	"give",
];

const resolveLlmsContent = async () => {
	if (cmsEnabled) {
		const [pages, site] = await Promise.all([
			Promise.all(pageKeys.map((pageKey) => getPage(pageKey))),
			getTinaSiteSettings(),
		]);
		return { pages, site };
	}

	const [{ pages }, { site }] = await Promise.all([
		import("#static-pages"),
		import("../data/site"),
	]);
	return { pages: Object.values(pages), site };
};

export const GET: APIRoute = async ({ site }) => {
	if (!site) {
		throw new Error(
			"Astro site configuration is required to generate llms.txt.",
		);
	}

	const siteRoot = new URL(withBase("/"), site);
	const { pages, site: siteContent } = await resolveLlmsContent();
	const body = renderLlmsTxt({
		pages,
		site: siteContent,
		siteRoot,
	});

	return new Response(body, {
		headers: {
			"Cache-Control": "public, max-age=3600, must-revalidate",
			"Content-Language": "en",
			"Content-Type": "text/plain; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
};
