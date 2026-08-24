const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^tel:\+[1-9]\d{7,14}$/;
const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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

export const parseSecureUrl = (value) => {
	if (typeof value !== "string" || !value.trim()) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url : null;
	} catch {
		return null;
	}
};

export const isAllowedSecureUrl = (value, allowedHosts) => {
	const url = parseSecureUrl(value);
	return Boolean(url && allowedHosts.includes(url.hostname.toLowerCase()));
};

export const isApprovedGivingUrl = (value) => value === approvedGivingUrl;
export const isEmailAddress = (value) =>
	typeof value === "string" && emailRegex.test(value.trim());
export const isTelephoneLink = (value) =>
	typeof value === "string" && phoneRegex.test(value.trim());
export const isTwentyFourHourTime = (value) =>
	typeof value === "string" && timeRegex.test(value.trim());
export const isRootRelativePath = (value) =>
	typeof value === "string" && value.startsWith("/") && !value.startsWith("//");

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
	if (value.startsWith("/images/")) return !value.includes("..");
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
