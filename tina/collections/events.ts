import type { Collection } from "tinacms";
import {
	validateRequiredText,
	validateSafeLink,
} from "../../src/lib/content-rules.mjs";

export const EventCollection: Collection = {
	name: "eventSchedule",
	label: "Upcoming events",
	path: "src/content/events",
	format: "json",
	match: {
		include: "events",
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
			name: "sectionCopy",
			label: "Homepage section wording",
			type: "object",
			required: true,
			fields: [
				{ name: "eyebrow", label: "Eyebrow", type: "string", required: true },
				{ name: "heading", label: "Heading", type: "string", required: true },
				{
					name: "intro",
					label: "Introduction",
					type: "string",
					required: true,
					ui: { component: "textarea" },
				},
				{
					name: "detailsLabel",
					label: "Event details button label",
					type: "string",
					required: true,
				},
			],
		},
		{
			name: "events",
			label: "Events shown on the homepage",
			type: "object",
			list: true,
			required: true,
			openFormOnCreate: true,
			ui: {
				max: 3,
				itemProps: (item) => ({
					label: `${item?.published ? "Published" : "Draft"}: ${item?.title || "New event"}`,
				}),
			},
			fields: [
				{
					name: "published",
					label: "Show on homepage",
					type: "boolean",
					description:
						"Turn this on only when the event is ready. It automatically disappears after its ending time.",
				},
				{
					name: "title",
					label: "Event name",
					type: "string",
					required: true,
					ui: {
						validate: (value) => validateRequiredText(value, "Event name"),
					},
				},
				{
					name: "startsAt",
					label: "Starting date and time",
					type: "datetime",
					required: true,
					ui: {
						timeFormat: "HH:mm",
					},
				},
				{
					name: "endsAt",
					label: "Ending date and time",
					type: "datetime",
					required: true,
					description:
						"The event automatically leaves the homepage after this time.",
					ui: {
						validate: (value, allValues, _meta, field) => {
							if (!value) return undefined;
							const fieldName = (field as { name?: string }).name;
							const path = fieldName?.split(".") || [];
							if (path.length < 2) return undefined;
							path[path.length - 1] = "startsAt";
							const startsAt = path.reduce<unknown>(
								(current, key) =>
									(current as Record<string, unknown> | undefined)?.[key],
								allValues,
							);
							const startValue = Date.parse(String(startsAt || ""));
							const endValue = Date.parse(value);
							if (!Number.isFinite(endValue))
								return "Enter a valid ending date and time.";
							if (Number.isFinite(startValue) && endValue <= startValue) {
								return "The event must end after it starts.";
							}
							return undefined;
						},
					},
				},
				{
					name: "location",
					label: "Location",
					type: "string",
					required: true,
					ui: {
						validate: (value) => validateRequiredText(value, "Location"),
					},
				},
				{
					name: "summary",
					label: "Short description",
					type: "string",
					description:
						"Optional. Leave this blank when the event name, date, location, and image provide enough detail.",
					ui: {
						component: "textarea",
					},
				},
				{
					name: "image",
					label: "Event image",
					type: "image",
					required: true,
				},
				{
					name: "imageAlt",
					label: "Image description",
					type: "string",
					required: true,
					description:
						"Describe the meaningful content for visitors using a screen reader.",
					ui: {
						validate: (value) =>
							validateRequiredText(value, "Image description"),
					},
				},
				{
					name: "detailsUrl",
					label: "Optional event details link",
					type: "string",
					ui: { validate: validateSafeLink },
				},
			],
		},
	],
};
