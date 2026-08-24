const DUMMY_BASE = "https://local.test";

export const allowedSiteHosts = Object.freeze({
	etsy: ["www.etsy.com", "etsy.com"],
	facebook: ["www.facebook.com", "facebook.com", "m.facebook.com"],
	maps: ["maps.rbt.no"],
	paypal: ["www.paypal.com", "paypal.com"],
	tinaMedia: ["assets.tina.io"],
	youtube: ["www.youtube.com", "youtube.com", "youtu.be"],
});

export const approvedGivingUrl =
	"https://www.paypal.com/donate/?business=avivjudea613%40gmail.com&no_recurring=0&item_name=Temple%20Aviv%20Judea&currency_code=USD";

/**
 * Validates HTTPS URLs safely using native URL.canParse
 */
export const parseSecureUrl = (value) => {
	if (typeof value !== "string" || !URL.canParse(value)) return null;
	const url = new URL(value);
	return url.protocol === "https:" ? url : null;
};

export const isAllowedSecureUrl = (value, allowedHosts) => {
	const url = parseSecureUrl(value);
	return Boolean(url && allowedHosts.includes(url.hostname.toLowerCase()));
};

/**
 * Modern WHATWG Origin Check:
 * If resolving against DUMMY_BASE changes the origin or pathname, it's an external escape.
 */
export const isRootRelativePath = (value) => {
	if (
		typeof value !== "string" ||
		!value.startsWith("/") ||
		!URL.canParse(value, DUMMY_BASE)
	) {
		return false;
	}
	const url = new URL(value, DUMMY_BASE);
	return url.origin === DUMMY_BASE && !value.includes("\\");
};

export const isApprovedGivingUrl = (value) => value === approvedGivingUrl;
export const isEmailAddress = (value) =>
	typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const isTelephoneLink = (value) =>
	typeof value === "string" && /^tel:\+[1-9]\d{7,14}$/.test(value);
export const isTwentyFourHourTime = (value) =>
	typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export const isSafeCmsLink = (value) => {
	if (typeof value !== "string" || !value.trim()) return false;
	const trimmed = value.trim();

	if (
		isRootRelativePath(trimmed) ||
		(trimmed.startsWith("#") && trimmed.length > 1)
	)
		return true;
	if (trimmed.startsWith("mailto:"))
		return isEmailAddress(trimmed.slice(7).split("?")[0]);
	if (trimmed.startsWith("tel:")) return isTelephoneLink(trimmed);

	return Boolean(parseSecureUrl(trimmed));
};

export const isManagedImageSource = (value) => {
	if (typeof value !== "string" || !value.trim()) return false;
	if (value.startsWith("/images/"))
		return isRootRelativePath(value) && !value.includes("..");
	return isAllowedSecureUrl(value, allowedSiteHosts.tinaMedia);
};

// TinaCMS Field Validators
export const validateSafeLink = (value) =>
	!value || isSafeCmsLink(value)
		? undefined
		: "Use an HTTPS URL, root-relative path (/visit/), mailto:, or tel:.";

export const validateAllowedHost = (value, allowedHosts, name) =>
	!value || isAllowedSecureUrl(value, allowedHosts)
		? undefined
		: `Use a secure ${name} URL.`;

export const validateEmailAddress = (value) =>
	!value || isEmailAddress(value) ? undefined : "Enter a valid email address.";

export const validateTelephoneLink = (value) =>
	!value || isTelephoneLink(value)
		? undefined
		: "Use tel:+ followed by digits (e.g. tel:+17145551234).";

export const validateTwentyFourHourTime = (value) =>
	!value || isTwentyFourHourTime(value)
		? undefined
		: "Use 24-hour HH:MM format (e.g. 09:00).";

export const validateRootRelativePath = (value) =>
	!value || isRootRelativePath(value)
		? undefined
		: "Use a root-relative path such as /visit/.";
