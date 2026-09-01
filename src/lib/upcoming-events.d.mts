export interface UpcomingEventRecordSource {
	published?: boolean | null;
	title?: string | null;
	startsAt?: string | null;
	endsAt?: string | null;
	location?: string | null;
	summary?: string | null;
	image?: string | null;
	imageAlt?: string | null;
	detailsUrl?: string | null;
	[key: string]: unknown;
}

export interface EventScheduleRecord {
	sectionCopy: {
		eyebrow: string;
		heading: string;
		intro: string;
		detailsLabel: string;
		[key: string]: unknown;
	};
	events: UpcomingEventRecordSource[];
	[key: string]: unknown;
}

export interface UpcomingEventRecord {
	title: string;
	startsAt: string;
	endsAt: string;
	location: string;
	summary?: string;
	image: { src: string; alt: string };
	detailsUrl?: string;
	source: UpcomingEventRecordSource;
}

export function selectUpcomingEventRecords(
	schedule: { events?: Array<UpcomingEventRecordSource | null> | null },
	now?: Date,
): readonly UpcomingEventRecord[];

export function parseEventScheduleRecord(value: unknown): EventScheduleRecord;
