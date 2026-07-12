# Temple Aviv Judea

Astro website for Temple Aviv Judea, a Messianic Jewish congregation in Fullerton, California.

## Local development

```sh
npm install
npm run dev
```

## Verification

```sh
npm run check
npm run build
```

## Deployment

Pushes to `main` deploy automatically through GitHub Actions to:

`https://skarath13.github.io/temple-aviv-judea/`

The production `avivjudea.org` domain is intentionally not connected. Its current website and DNS remain unchanged until a separate cutover is approved.

## Content sources

Shared service times, contact details, external links, and address information live in `src/data/site.ts`. Update them there to keep all pages consistent.

The upcoming-events presentation contract lives in `src/data/events.ts` and `src/components/UpcomingEvents.astro`. Each event has one required photo, and the homepage displays at most three upcoming events. The exported list is intentionally empty, so the homepage emits no events section or empty-state block today. The `/admin/` route is a nonfunctional, no-index preview and contains no PIN or upload capability.

For the future Cloudflare version, keep authentication and writes outside the static client:

- Protect admin access with Cloudflare Access email one-time PIN restricted to approved leadership email addresses.
- Store event metadata, draft/published state, edits, and deletion state in D1. Enforce a maximum of three active upcoming events in the Worker, not only in the interface.
- Store validated image objects in R2 through a Worker binding.
- Expose only published, nonexpired events through a public read endpoint.
- Validate file type, file signature, dimensions, and size in the Worker. Use short-lived secure sessions, CSRF protection, rate limiting, audit records, and explicit create, edit, publish, unpublish, and delete actions.

The home hero uses separate desktop and mobile artwork through a responsive `<picture>` element:

- `public/images/hero-desktop.jpg`
- `public/images/hero-mobile.jpg`

See `ASSET_SOURCES.md` for the live-site asset inventory and local migration map.
