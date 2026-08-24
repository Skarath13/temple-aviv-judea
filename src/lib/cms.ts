import {
	allowedSiteHosts,
	isAllowedSecureUrl,
	isApprovedGivingUrl,
	isManagedImageSource,
	isSafeCmsLink,
} from "./content-rules.mjs";
import { withBase } from "./urls";

export const cmsImageSource = (value?: string | null) =>
	value && isManagedImageSource(value)
		? value.startsWith("/")
			? withBase(value)
			: value
		: undefined;

export const cmsLink = (value?: string | null) =>
	value && isSafeCmsLink(value)
		? value.startsWith("/")
			? withBase(value)
			: value
		: undefined;

export const cmsMapsLink = (value?: string | null) =>
	value && isAllowedSecureUrl(value, allowedSiteHosts.maps) ? value : undefined;

export const cmsPayPalLink = (value?: string | null) =>
	value && isApprovedGivingUrl(value) ? value : undefined;

export const cmsYouTubeLink = (value?: string | null) =>
	value && isAllowedSecureUrl(value, allowedSiteHosts.youtube)
		? value
		: undefined;

export const cmsEtsyLink = (value?: string | null) =>
	value && isAllowedSecureUrl(value, allowedSiteHosts.etsy) ? value : undefined;

export const cmsFacebookLink = (value?: string | null) =>
	value && isAllowedSecureUrl(value, allowedSiteHosts.facebook)
		? value
		: undefined;
