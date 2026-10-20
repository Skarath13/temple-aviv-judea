import { isManagedImageSource, isSafeCmsLink } from "./content-rules.mjs";

const isRecord = (value) =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const requireString = (container, key, where) => {
	const value = container[key];
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`events.json: ${where} is missing a usable "${key}".`);
	}
};

const validateOptionalString = (container, key, where) => {
	const value = container[key];
	if (value !== undefined && value !== null && typeof value !== "string") {
		throw new Error(`events.json: ${where} "${key}" must be a string.`);
	}
};

export const parseEventScheduleRecord = (value) => {
	if (!isRecord(value)) {
		throw new Error("events.json: expected a top-level object.");
	}

	const { sectionCopy, events } = value;
	if (!isRecord(sectionCopy)) {
		throw new Error('events.json: "sectionCopy" must be an object.');
	}
	for (const key of ["eyebrow", "heading", "intro", "detailsLabel"]) {
		requireString(sectionCopy, key, "sectionCopy");
	}

	if (!Array.isArray(events)) {
		throw new Error('events.json: "events" must be an array.');
	}
	events.forEach((event, index) => {
		const where = `event ${index + 1}`;
		if (!isRecord(event)) {
			throw new Error(`events.json: ${where} must be an object.`);
		}
		if (
			event.published !== undefined &&
			event.published !== null &&
			typeof event.published !== "boolean"
		) {
			throw new Error(`events.json: ${where} "published" must be a boolean.`);
		}
		for (const key of [
			"title",
			"startsAt",
			"endsAt",
			"location",
			"image",
			"imageAlt",
		]) {
			if (event[key] !== undefined) requireString(event, key, where);
		}
		validateOptionalString(event, "summary", where);
		validateOptionalString(event, "detailsUrl", where);
	});

	return value;
};

// Nested Tina field validators are unregistered when returning to the list.
// Validate the complete document before saving, including draft event fields.
export class EventScheduleValidationError extends Error {
	constructor(message, fieldName) {
		super(message);
		this.name = "EventScheduleValidationError";
		this.fieldName = fieldName;
	}
}

export const assertEventScheduleReadyForSave = (value) => {
	const schedule =
		isRecord(value) && Array.isArray(value.events)
			? value
			: parseEventScheduleRecord(value);
	if (isRecord(schedule.sectionCopy)) {
		for (const key of ["eyebrow", "heading", "intro", "detailsLabel"]) {
			if (
				typeof schedule.sectionCopy[key] !== "string" ||
				!schedule.sectionCopy[key].trim()
			) {
				throw new EventScheduleValidationError(
					`Homepage section wording: ${key} is required.`,
					`sectionCopy.${key}`,
				);
			}
		}
	}
	for (const [index, event] of schedule.events.entries()) {
		if (!isRecord(event))
			throw new EventScheduleValidationError(
				`Event ${index + 1} is invalid. Remove it and add it again.`,
				"",
			);
		const where = `Event ${index + 1}${event.title ? ` (${event.title})` : ""}`;
		for (const [key, label] of [
			["title", "Event name"],
			["startsAt", "Starting date and time"],
			["endsAt", "Ending date and time"],
			["location", "Location"],
			["image", "Event image"],
			["imageAlt", "Image description"],
		]) {
			if (typeof event[key] !== "string" || !event[key].trim()) {
				throw new EventScheduleValidationError(
					`${where}: ${label} is required. Open this event to complete it.`,
					`events.${index}.${key}`,
				);
			}
		}
		const start = Date.parse(event.startsAt);
		const end = Date.parse(event.endsAt);
		if (!Number.isFinite(start) || !Number.isFinite(end)) {
			throw new EventScheduleValidationError(
				`${where}: Enter valid starting and ending dates and times.`,
				`events.${index}.${Number.isFinite(start) ? "endsAt" : "startsAt"}`,
			);
		}
		if (end <= start) {
			throw new EventScheduleValidationError(
				`${where}: The event must end after it starts.`,
				`events.${index}.endsAt`,
			);
		}
		if (!isManagedImageSource(event.image)) {
			throw new EventScheduleValidationError(
				`${where}: Choose an event image from the media manager.`,
				`events.${index}.image`,
			);
		}
		if (event.detailsUrl && !isSafeCmsLink(event.detailsUrl)) {
			throw new EventScheduleValidationError(
				`${where}: Use a valid event details link or leave it blank.`,
				`events.${index}.detailsUrl`,
			);
		}
	}
	parseEventScheduleRecord(value);
};

export const selectUpcomingEventRecords = (schedule, now = new Date()) => {
	const nowValue = now.valueOf();
	if (Number.isNaN(nowValue)) {
		throw new Error("The upcoming-events clock is invalid.");
	}

	return (schedule?.events || [])
		.filter((event) => Boolean(event?.published))
		.map((event, index) => {
			const requiredValues = [
				event.title,
				event.startsAt,
				event.endsAt,
				event.location,
				event.image,
				event.imageAlt,
			];

			if (
				requiredValues.some(
					(value) => typeof value !== "string" || !value.trim(),
				)
			) {
				throw new Error(
					`Published event ${index + 1} is missing a required field.`,
				);
			}

			const startsAt = new Date(event.startsAt);
			const endsAt = new Date(event.endsAt);
			if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf())) {
				throw new Error(`Published event ${index + 1} has an invalid date.`);
			}
			if (endsAt <= startsAt) {
				throw new Error(
					`Published event ${index + 1} must end after it starts.`,
				);
			}

			return {
				title: event.title,
				startsAt: event.startsAt,
				endsAt: event.endsAt,
				location: event.location,
				summary:
					typeof event.summary === "string" && event.summary.trim()
						? event.summary.trim()
						: undefined,
				image: {
					src: event.image,
					alt: event.imageAlt,
				},
				detailsUrl: event.detailsUrl?.trim() || undefined,
				source: event,
			};
		})
		.filter((event) => new Date(event.endsAt).valueOf() > nowValue)
		.sort(
			(left, right) =>
				new Date(left.startsAt).valueOf() - new Date(right.startsAt).valueOf(),
		)
		.slice(0, 3);
};
