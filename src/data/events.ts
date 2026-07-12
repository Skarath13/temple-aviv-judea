export interface UpcomingEventImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  summary: string;
  image: UpcomingEventImage;
  detailsUrl?: string;
}

// Intentionally empty. The homepage renders no events section until published
// event data is supplied and displays at most three upcoming events. A future
// Cloudflare Worker will replace this source and enforce the same active limit.
export const upcomingEvents: readonly UpcomingEvent[] = [];
