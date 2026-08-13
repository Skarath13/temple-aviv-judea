export const selectUpcomingEventRecords = (schedule, now = new Date()) => {
  const nowValue = now.valueOf();
  if (Number.isNaN(nowValue)) {
    throw new Error('The upcoming-events clock is invalid.');
  }

  return (schedule?.events || [])
    .filter((event) => Boolean(event?.published))
    .map((event, index) => {
      const requiredValues = [
        event.title,
        event.startsAt,
        event.endsAt,
        event.location,
        event.summary,
        event.image,
        event.imageAlt,
      ];

      if (requiredValues.some((value) => typeof value !== 'string' || !value.trim())) {
        throw new Error(`Published event ${index + 1} is missing a required field.`);
      }

      const startsAt = new Date(event.startsAt);
      const endsAt = new Date(event.endsAt);
      if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf())) {
        throw new Error(`Published event ${index + 1} has an invalid date.`);
      }
      if (endsAt <= startsAt) {
        throw new Error(`Published event ${index + 1} must end after it starts.`);
      }

      return {
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        summary: event.summary,
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
