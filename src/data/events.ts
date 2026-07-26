import eventContent from '../content/events/events.json';

export interface UpcomingEventImage {
  src: string;
  alt: string;
}

export interface UpcomingEvent {
  title: string;
  startsAt: string;
  location: string;
  summary: string;
  image: UpcomingEventImage;
  detailsUrl?: string;
}

interface EditableEvent {
  published?: boolean;
  title?: string;
  startsAt?: string;
  location?: string;
  summary?: string;
  image?: string;
  imageAlt?: string;
  detailsUrl?: string;
}

const editableEvents = eventContent.events as EditableEvent[];

export const upcomingEvents: readonly UpcomingEvent[] = editableEvents
  .filter((event) => event.published)
  .map((event, index) => {
    const requiredValues = [
      event.title,
      event.startsAt,
      event.location,
      event.summary,
      event.image,
      event.imageAlt,
    ];

    if (requiredValues.some((value) => !value?.trim())) {
      throw new Error(`Published event ${index + 1} is missing a required field.`);
    }

    const startsAt = new Date(event.startsAt as string);
    if (Number.isNaN(startsAt.valueOf())) {
      throw new Error(`Published event ${index + 1} has an invalid date.`);
    }

    return {
      title: event.title as string,
      startsAt: event.startsAt as string,
      location: event.location as string,
      summary: event.summary as string,
      image: {
        src: event.image as string,
        alt: event.imageAlt as string,
      },
      detailsUrl: event.detailsUrl?.trim() || undefined,
    };
  })
  .sort((left, right) => (
    new Date(left.startsAt).valueOf() - new Date(right.startsAt).valueOf()
  ))
  .slice(0, 3);
