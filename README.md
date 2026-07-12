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

## Content sources

Shared service times, contact details, external links, and address information live in `src/data/site.ts`. Update them there to keep all pages consistent.

The home hero uses separate desktop and mobile artwork through a responsive `<picture>` element:

- `public/images/hero-desktop.jpg`
- `public/images/hero-mobile.jpg`

See `ASSET_SOURCES.md` for the live-site asset inventory and local migration map.
