import type { IslandRegistry } from "@tinacms/astro/experimental";
import type { SiteSettingsQuery } from "../../../tina/__generated__/types";
import Footer from "../../components/Footer.astro";
import Header from "../../components/Header.astro";
import EditablePage from "../../components/pages/EditablePage.astro";
import type { PageKey } from "../../data/pages";
import {
	getTinaPageBundle,
	getTinaSiteSettings,
	type TinaPageBundle,
} from "./data";

const pageKeys = new Set<PageKey>([
	"home",
	"visit",
	"story",
	"beliefs",
	"ministries",
	"give",
]);

const readPageKey = (params: URLSearchParams): PageKey => {
	const value = params.get("page");
	if (!value || !pageKeys.has(value as PageKey)) {
		throw new Error("Unknown or missing TinaCMS page key.");
	}
	return value as PageKey;
};

export const pageIslandWrapper = {
	tag: "div",
	className: "tina-page-island",
} as const;

export const headerIslandWrapper = {
	tag: "div",
	className: "tina-site-header-island",
} as const;

export const footerIslandWrapper = {
	tag: "div",
	className: "tina-site-footer-island",
} as const;

export const islands: IslandRegistry = {
	page: {
		fetch: async (_request, params) => getTinaPageBundle(readPageKey(params)),
		component: EditablePage,
		wrapper: pageIslandWrapper,
		propsFromData: (data, params) => ({
			page: (data as TinaPageBundle).page,
			pageKey: readPageKey(params),
			site: (data as TinaPageBundle).siteSettings,
			eventSchedule: (data as TinaPageBundle).eventSchedule,
		}),
	},
	header: {
		fetch: () => getTinaSiteSettings(),
		component: Header,
		wrapper: headerIslandWrapper,
		propsFromData: (data, params) => ({
			site: data as SiteSettingsQuery["siteSettings"],
			currentPath: params.get("path") || "/",
		}),
	},
	footer: {
		fetch: () => getTinaSiteSettings(),
		component: Footer,
		wrapper: footerIslandWrapper,
		propsFromData: (data) => ({
			site: data as SiteSettingsQuery["siteSettings"],
		}),
	},
};
