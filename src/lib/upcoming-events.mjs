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
