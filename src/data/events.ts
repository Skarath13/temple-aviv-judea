import type {
	EventScheduleEvents,
	EventScheduleQuery,
} from "../../tina/__generated__/types";
import eventContent from "../content/events/events.json";
import { selectUpcomingEventRecords } from "../lib/upcoming-events.mjs";

export type EventScheduleData = EventScheduleQuery["eventSchedule"];

export interface UpcomingEventImage {
	src: string;
	alt: string;
}

export interface UpcomingEvent {
	title: string;
	startsAt: string;
	endsAt: string;
	location: string;
	summary: string;
	image: UpcomingEventImage;
	detailsUrl?: string;
	source: EventScheduleEvents;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const requireString = (
	container: Record<string, unknown>,
	key: string,
	where: string,
): void => {
	const value = container[key];
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`events.json: ${where} is missing a usable "${key}".`);
	}
};

/**
 * Structurally checks the raw JSON against the eventSchedule schema before
 * narrowing it, so drift between events.json and the generated Tina types
 * fails loudly here instead of surfacing as `undefined` at render time.
 */
const parseEventSchedule = (value: unknown): EventScheduleData => {
	if (!isRecord(value)) {
		throw new Error("events.json: expected a top-level object.");
	}

	const { sectionCopy, events } = value;
	if (!isRecord(sectionCopy)) {
		throw new Error(`events.json: "sectionCopy" must be an object.`);
	}
	for (const key of ["eyebrow", "heading", "intro", "detailsLabel"]) {
		requireString(sectionCopy, key, "sectionCopy");
	}

	if (!Array.isArray(events)) {
		throw new Error(`events.json: "events" must be an array.`);
	}
	events.forEach((event, index) => {
		if (!isRecord(event)) {
			throw new Error(
				`events.json: event ${index + 1} must be an object.`,
			);
		}
		if (event.published !== undefined && typeof event.published !== "boolean") {
			throw new Error(
				`events.json: event ${index + 1} "published" must be a boolean.`,
			);
		}
		for (const key of ["title", "startsAt", "endsAt", "location", "summary"]) {
			if (event[key] !== undefined) {
				requireString(event, key, `event ${index + 1}`);
			}
		}
	});

	return value as EventScheduleData;
};

export const eventSchedule = parseEventSchedule(eventContent);

export const selectUpcomingEvents = (
	schedule: EventScheduleData,
	now: Date = new Date(),
): readonly UpcomingEvent[] =>
	selectUpcomingEventRecords(schedule, now) as readonly UpcomingEvent[];
