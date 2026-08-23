import type { Collection } from "tinacms";
import {
	allowedSiteHosts,
	validateAllowedHost,
	validateEmailAddress,
	validateRootRelativePath,
	validateTelephoneLink,
	validateTwentyFourHourTime,
} from "../../src/lib/content-rules.mjs";

type FormField = { name?: string };

const readFormPath = (value: unknown, path: readonly string[]) =>
	path.reduce<unknown>(
		(current, key) => (current as Record<string, unknown> | undefined)?.[key],
		value,
	);

const listForField = (allValues: unknown, field: FormField) => {
	const path = field.name?.split(".") || [];
	if (path.length < 3) return undefined;
	const list = readFormPath(allValues, path.slice(0, -2));
	return Array.isArray(list) ? list : undefined;
};

const siblingForField = (
	allValues: unknown,
	field: FormField,
	siblingName: string,
) => {
	const path = field.name?.split(".") || [];
	if (path.length < 2) return undefined;
	path[path.length - 1] = siblingName;
	return readFormPath(allValues, path);
};

export const SiteSettingsCollection: Collection = {
	name: "siteSettings",
	label: "Site settings",
	path: "src/content/settings",
	format: "json",
	match: {
		include: "site",
	},
	ui: {
		global: true,
		router: () => "/",
		allowedActions: {
			create: false,
			delete: false,
		},
	},
	fields: [
		{
			name: "name",
			label: "Congregation name",
			type: "string",
			required: true,
			isTitle: true,
		},
		{
			name: "shortName",
			label: "Short name",
			type: "string",
			required: true,
			description: "Used for compact browser and mobile labels.",
		},
		{
			name: "description",
			label: "Default site description",
			type: "string",
			required: true,
			ui: {
				component: "textarea",
			},
		},
		{
			name: "address",
			label: "Address",
			type: "object",
			required: true,
			fields: [
				{ name: "street", label: "Street", type: "string", required: true },
				{
					name: "city",
					label: "City, state, and ZIP",
					type: "string",
					required: true,
				},
				{ name: "locality", label: "City", type: "string", required: true },
				{
					name: "region",
					label: "State abbreviation",
					type: "string",
					required: true,
				},
				{
					name: "postalCode",
					label: "ZIP code",
					type: "string",
					required: true,
				},
				{
					name: "country",
					label: "Country code",
					type: "string",
					required: true,
				},
				{
					name: "mailing",
					label: "Mailing address",
					type: "string",
					required: true,
				},
				{
					name: "maps",
					label: "Google Maps link",
					type: "string",
					required: true,
					ui: {
						validate: (value) =>
							validateAllowedHost(
								value,
								allowedSiteHosts.googleMaps,
								"Google Maps",
							),
					},
				},
				{
					name: "embed",
					label: "Google Maps embed link",
					type: "string",
					required: true,
					description: "Use a Google Maps URL ending in output=embed.",
					ui: {
						validate: (value) => {
							const hostError = validateAllowedHost(
								value,
								allowedSiteHosts.googleMaps,
								"Google Maps embed",
							);
							if (hostError) return hostError;
							try {
								return new URL(value).searchParams.get("output") === "embed"
									? undefined
									: "Use a Google Maps URL ending in output=embed.";
							} catch {
								return "Use a secure Google Maps embed URL.";
							}
						},
					},
				},
			],
		},
		{
			name: "phone",
			label: "Displayed phone number",
			type: "string",
			required: true,
		},
		{
			name: "phoneHref",
			label: "Phone link",
			type: "string",
			required: true,
			description:
				"Use tel: followed by the digits, for example tel:+17145551234.",
			ui: { validate: validateTelephoneLink },
		},
		{
			name: "email",
			label: "Public email",
			type: "string",
			required: true,
			ui: { validate: validateEmailAddress },
		},
		{
			name: "youtube",
			label: "YouTube live link",
			type: "string",
			required: true,
			ui: {
				validate: (value) =>
					validateAllowedHost(value, allowedSiteHosts.youtube, "YouTube"),
			},
		},
		{
			name: "livestreamNote",
			label: "Livestream schedule label",
			type: "string",
			required: true,
			description: "Shown anywhere the site links visitors to the livestream.",
		},
		{
			name: "headerCopy",
			label: "Header wording",
			type: "object",
			required: true,
			description: "Short labels used in the site header and mobile menu.",
			fields: [
				{
					name: "tagline",
					label: "Congregation tagline",
					type: "string",
					required: true,
				},
				{
					name: "giveLabel",
					label: "Give link label",
					type: "string",
					required: true,
				},
				{
					name: "visitLabel",
					label: "Visit button label",
					type: "string",
					required: true,
				},
				{
					name: "livestreamLabel",
					label: "Livestream link label",
					type: "string",
					required: true,
				},
			],
		},
		{
			name: "footerCopy",
			label: "Footer wording",
			type: "object",
			required: true,
			description:
				"Welcome message and section labels shown at the bottom of every page.",
			fields: [
				{
					name: "eyebrow",
					label: "Welcome eyebrow",
					type: "string",
					required: true,
				},
				{
					name: "heading",
					label: "Welcome heading",
					type: "string",
					required: true,
				},
				{
					name: "body",
					label: "Welcome message",
					type: "string",
					required: true,
					ui: { component: "textarea" },
				},
				{
					name: "visitLabel",
					label: "Visit button label",
					type: "string",
					required: true,
				},
				{
					name: "exploreHeading",
					label: "Explore heading",
					type: "string",
					required: true,
				},
				{
					name: "connectHeading",
					label: "Connect heading",
					type: "string",
					required: true,
				},
				{
					name: "motto",
					label: "Footer motto",
					type: "string",
					required: true,
				},
			],
		},
		{
			name: "facebook",
			label: "Facebook link",
			type: "string",
			required: true,
			ui: {
				validate: (value) =>
					validateAllowedHost(value, allowedSiteHosts.facebook, "Facebook"),
			},
		},
		{
			name: "baruchDesignsEtsy",
			label: "Baruch Designs Etsy link",
			type: "string",
			required: true,
			ui: {
				validate: (value) =>
					validateAllowedHost(value, allowedSiteHosts.etsy, "Etsy"),
			},
		},
		{
			name: "giving",
			label: "PayPal giving destination",
			type: "string",
			required: true,
			description: "Developer-controlled payment configuration.",
			ui: {
				component: null,
			},
		},
		{
			name: "publicHours",
			label: "Public building hours",
			type: "object",
			list: true,
			required: true,
			description:
				"Shown only as a subdued footer detail and in structured data. Keep these hours synchronized with the Google Business Profile.",
			ui: {
				min: 1,
				max: 7,
				itemProps: (item) => ({
					label: item?.dayOfWeek || "Public hours",
				}),
			},
			fields: [
				{
					name: "dayOfWeek",
					label: "Day",
					type: "string",
					required: true,
					options: [
						"Monday",
						"Tuesday",
						"Wednesday",
						"Thursday",
						"Friday",
						"Saturday",
						"Sunday",
					],
					ui: {
						validate: (value, allValues, _meta, field) => {
							if (!value) return undefined;
							const entries = listForField(allValues, field as FormField);
							const matches =
								entries?.filter(
									(item) =>
										(item as Record<string, unknown> | null)?.dayOfWeek ===
										value,
								).length || 0;
							return matches > 1
								? "Each weekday can appear only once."
								: undefined;
						},
					},
				},
				{
					name: "opens",
					label: "Opens",
					type: "string",
					required: true,
					description: "Use 24-hour HH:MM format, for example 09:00.",
					ui: { validate: validateTwentyFourHourTime },
				},
				{
					name: "closes",
					label: "Closes",
					type: "string",
					required: true,
					description: "Use 24-hour HH:MM format, for example 16:00.",
					ui: {
						validate: (value, allValues, _meta, field) => {
							const formatError = validateTwentyFourHourTime(value);
							if (formatError) return formatError;
							const opens = siblingForField(
								allValues,
								field as FormField,
								"opens",
							);
							return typeof opens === "string" && value && opens >= value
								? "Closing time must be after opening time."
								: undefined;
						},
					},
				},
			],
		},
		{
			name: "schedule",
			label: "Shabbat schedule",
			type: "object",
			list: true,
			required: true,
			ui: {
				min: 1,
				max: 6,
				itemProps: (item) => ({
					label: item?.label || "Schedule item",
				}),
			},
			fields: [
				{ name: "time", label: "Time", type: "string", required: true },
				{ name: "label", label: "Activity", type: "string", required: true },
				{ name: "note", label: "Short note", type: "string", required: true },
			],
		},
		{
			name: "navigation",
			label: "Primary navigation",
			type: "object",
			list: true,
			required: true,
			ui: {
				min: 1,
				max: 8,
				itemProps: (item) => ({
					label: item?.label || "Navigation item",
				}),
			},
			fields: [
				{ name: "label", label: "Label", type: "string", required: true },
				{
					name: "href",
					label: "Site path",
					type: "string",
					required: true,
					description: "Use a root-relative path such as /visit/.",
					ui: {
						validate: (value, allValues, _meta, field) => {
							const pathError = validateRootRelativePath(value);
							if (pathError) return pathError;
							const entries = listForField(allValues, field as FormField);
							const matches =
								entries?.filter(
									(item) =>
										(item as Record<string, unknown> | null)?.href === value,
								).length || 0;
							return matches > 1
								? "Each primary navigation path must be unique."
								: undefined;
						},
					},
				},
			],
		},
	],
};
