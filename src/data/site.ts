import type { SiteSettingsQuery } from "../../tina/__generated__/types";
import siteContent from "../content/settings/site.json";

export type SiteSettingsData = SiteSettingsQuery["siteSettings"];

export const site = siteContent as unknown as SiteSettingsData;

export const siteNavigation = (settings: SiteSettingsData) =>
	(settings.navigation || []).filter((item): item is NonNullable<typeof item> =>
		Boolean(item),
	);

export const siteSchedule = (settings: SiteSettingsData) =>
	(settings.schedule || []).filter((item): item is NonNullable<typeof item> =>
		Boolean(item),
	);

export const navItems = siteNavigation(site);
