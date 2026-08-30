import {
	allowedSiteHosts,
	isAllowedSecureUrl,
	isApprovedGivingUrl,
	isManagedImageSource,
	isSafeCmsLink,
} from "./content-rules.mjs";
import { withBase } from "./urls";

export const cmsImageSource = (value?: string) => {
	if (!value || !isManagedImageSource(value)) return undefined;
	if (value.startsWith("/")) return withBase(value);
	return value;
};

export const cmsAllowedHostLink = (
	value: string | null | undefined,
	allowedHosts: readonly string[],
) => {
	if (!value || !isAllowedSecureUrl(value, allowedHosts)) return undefined;
	return value;
};

export const cmsGoogleMapsLink = (value?: string | null) =>
	cmsAllowedHostLink(value, allowedSiteHosts.googleMaps);

export const cmsMapAppLink = (value?: string | null) =>
	cmsAllowedHostLink(value, allowedSiteHosts.mapApp);

export const cmsGoogleMapsEmbed = (value?: string | null) => {
	const link = cmsGoogleMapsLink(value);
	if (!link) return undefined;
	try {
		return new URL(link).searchParams.get("output") === "embed"
			? link
			: undefined;
	} catch {
		return undefined;
	}
};

export const cmsPayPalLink = (value?: string | null) =>
	value && isApprovedGivingUrl(value) ? value : undefined;

export const cmsYouTubeLink = (value?: string | null) =>
	cmsAllowedHostLink(value, allowedSiteHosts.youtube);

export const cmsEtsyLink = (value?: string | null) =>
	cmsAllowedHostLink(value, allowedSiteHosts.etsy);

export const cmsFacebookLink = (value?: string | null) =>
	cmsAllowedHostLink(value, allowedSiteHosts.facebook);

export const cmsLink = (value?: string | null) => {
	if (!value || !isSafeCmsLink(value)) return undefined;
	if (value.startsWith("/")) return withBase(value);
	return value;
};
