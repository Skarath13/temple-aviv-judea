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

export const eventSchedule = eventContent as unknown as EventScheduleData;

export const selectUpcomingEvents = (
	schedule: EventScheduleData,
	now: Date = new Date(),
): readonly UpcomingEvent[] =>
	selectUpcomingEventRecords(schedule, now) as readonly UpcomingEvent[];

export const upcomingEvents = selectUpcomingEvents(eventSchedule);
