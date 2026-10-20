import assert from "node:assert/strict";
import test from "node:test";
import {
	assertEventScheduleReadyForSave,
	parseEventScheduleRecord,
	selectUpcomingEventRecords,
} from "../src/lib/upcoming-events.mjs";

const event = (overrides = {}) => ({
	published: true,
	title: "Shabbat gathering",
	startsAt: "2026-08-15T18:00:00.000Z",
	endsAt: "2026-08-15T20:00:00.000Z",
	location: "Temple Aviv Judea",
	summary: "A community gathering.",
	image: "/images/og.png",
	imageAlt: "Congregants gathering",
	...overrides,
});

const eventSchedule = (overrides = {}) => ({
	sectionCopy: {
		eyebrow: "Gather with us",
		heading: "Upcoming events.",
		intro: "Join our community.",
		detailsLabel: "Event details",
	},
	events: [event()],
	...overrides,
});

test("structurally validates Tina event JSON before narrowing its type", () => {
	const valid = eventSchedule();
	assert.equal(parseEventScheduleRecord(valid), valid);
	assert.throws(
		() => parseEventScheduleRecord({ events: [] }),
		/"sectionCopy" must be an object/,
	);
	assert.throws(
		() =>
			parseEventScheduleRecord(
				eventSchedule({ events: [event({ published: "yes" })] }),
			),
		/"published" must be a boolean/,
	);
	assert.throws(
		() =>
			parseEventScheduleRecord(
				eventSchedule({ events: [event({ imageAlt: [] })] }),
			),
		/missing a usable "imageAlt"/,
	);
});

test("the structural parser accepts an omitted or blank optional description", () => {
	assert.doesNotThrow(() =>
		parseEventScheduleRecord(
			eventSchedule({ events: [event({ summary: " " })] }),
		),
	);
	assert.doesNotThrow(() =>
		parseEventScheduleRecord(
			eventSchedule({ events: [event({ summary: undefined })] }),
		),
	);
});

test("filters unpublished and ended events while keeping an event in progress", () => {
	const now = new Date("2026-08-15T19:00:00.000Z");
	const inProgress = event();
	const result = selectUpcomingEventRecords(
		{
			events: [
				event({ published: false }),
				event({ endsAt: "2026-08-15T18:59:59.000Z" }),
				inProgress,
			],
		},
		now,
	);

	assert.equal(result.length, 1);
	assert.equal(result[0].source, inProgress);
});

test("sorts chronologically and limits the homepage to three events", () => {
	const records = [5, 2, 4, 1, 3].map((hour) =>
		event({
			title: `Event ${hour}`,
			startsAt: `2026-08-16T0${hour}:00:00.000Z`,
			endsAt: `2026-08-16T0${hour + 1}:00:00.000Z`,
		}),
	);
	const result = selectUpcomingEventRecords(
		{ events: records },
		new Date("2026-08-15T00:00:00.000Z"),
	);

	assert.deepEqual(
		result.map(({ title }) => title),
		["Event 1", "Event 2", "Event 3"],
	);
});

test("an empty, all-expired, or all-draft schedule is valid", () => {
	const now = new Date("2026-10-20T00:00:00.000Z");
	for (const events of [[], [event()], [{ published: false }]]) {
		const schedule = eventSchedule({ events });
		assert.doesNotThrow(() => parseEventScheduleRecord(schedule));
		assert.deepEqual(selectUpcomingEventRecords(schedule, now), []);
	}
});

test("saving validates every nested event, including drafts and expired records", () => {
	assert.doesNotThrow(() =>
		assertEventScheduleReadyForSave(eventSchedule({ events: [] })),
	);
	for (const published of [true, false]) {
		assert.doesNotThrow(() =>
			assertEventScheduleReadyForSave(
				eventSchedule({ events: [event({ published })] }),
			),
		);
		for (const key of [
			"title",
			"startsAt",
			"endsAt",
			"location",
			"image",
			"imageAlt",
		]) {
			assert.throws(
				() =>
					assertEventScheduleReadyForSave(
						eventSchedule({ events: [event({ [key]: undefined, published })] }),
					),
				/required/,
			);
		}
		for (const values of [
			{ endsAt: "2026-08-15T18:00:00.000Z" },
			{ endsAt: "2026-08-15T17:00:00.000Z" },
			{ endsAt: "invalid" },
			{ image: "javascript:alert(1)" },
			{ detailsUrl: "javascript:alert(1)" },
		]) {
			assert.throws(() =>
				assertEventScheduleReadyForSave(
					eventSchedule({ events: [event({ ...values, published })] }),
				),
			);
		}
	}
});

test("past events and unfinished drafts do not crowd out the next three published events", () => {
	const future = [5, 2, 4, 1, 3].map((hour) =>
		event({
			title: `Event ${hour}`,
			startsAt: `2026-10-21T0${hour}:00:00.000Z`,
			endsAt: `2026-10-21T0${hour + 1}:00:00.000Z`,
		}),
	);
	const schedule = eventSchedule({
		events: [event(), { published: false, title: "Unfinished" }, ...future],
	});
	assert.doesNotThrow(() => parseEventScheduleRecord(schedule));
	assert.deepEqual(
		selectUpcomingEventRecords(
			schedule,
			new Date("2026-10-20T00:00:00.000Z"),
		).map(({ title }) => title),
		["Event 1", "Event 2", "Event 3"],
	);
});

test("preserves image accessibility text and trims an optional details URL", () => {
	const result = selectUpcomingEventRecords(
		{
			events: [
				event({
					imageAlt: "A meaningful description",
					detailsUrl: "  /visit/  ",
				}),
			],
		},
		new Date("2026-08-15T00:00:00.000Z"),
	);

	assert.deepEqual(result[0].image, {
		src: "/images/og.png",
		alt: "A meaningful description",
	});
	assert.equal(result[0].detailsUrl, "/visit/");
});

test("allows an intentionally blank optional event description", () => {
	const result = selectUpcomingEventRecords(
		{ events: [event({ summary: " " })] },
		new Date("2026-08-15T00:00:00.000Z"),
	);

	assert.equal(result.length, 1);
	assert.equal(result[0].summary, undefined);
});

test("rejects invalid clocks, incomplete published events, and invalid lifecycles", () => {
	assert.throws(
		() => selectUpcomingEventRecords({ events: [] }, new Date("invalid")),
		/clock is invalid/,
	);
	assert.throws(
		() => selectUpcomingEventRecords({ events: [event({ imageAlt: "" })] }),
		/missing a required field/,
	);
	assert.throws(
		() =>
			selectUpcomingEventRecords({ events: [event({ startsAt: "invalid" })] }),
		/invalid date/,
	);
	assert.throws(
		() =>
			selectUpcomingEventRecords({
				events: [
					event({
						endsAt: "2026-08-15T17:00:00.000Z",
					}),
				],
			}),
		/must end after it starts/,
	);
});
