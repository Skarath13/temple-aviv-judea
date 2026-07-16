# Asset sources

The `public/images/live/` directory mirrors the congregation content assets found across the live `avivjudea.org` Home, Ministries, Give, Core Values, Dance Ministry, and Artists' Gallery pages on July 12, 2026. Files are stored locally as optimized WebP assets so the redesigned site does not depend on Wix image transforms.

| Local asset | Live-site role |
| --- | --- |
| `artist-gallery-1.webp` | Artists' Gallery artwork |
| `artist-gallery-2.webp` | Artists' Gallery artwork |
| `children-ministry.webp` | Children/ministry image |
| `core-values-banner.webp` | Statement of Faith banner |
| `dance-ministry.webp` | Dance Ministry artwork; upgraded from user supplied source |
| `ministry-img-0664.webp` | Ministry gathering photo |
| `ministry-unknown.webp` | Children's gathering photo |
| `mya.webp` | Teen and young-adult group photo |
| `rabbi-corey.webp` | Rabbi Corey photo; upgraded from user-supplied source |
| `shabbat-school.webp` | Shabbat School image |
| `womens-group.webp` | Women's group photo |
| `worship-dance.webp` | Building / Our Miracle image; upgraded from user-supplied source |
| `youtube-recordings.webp` | Shabbat recording collage |

The responsive Jerusalem hero, transparent logo, mosaic illustrations, Give page artwork, split card backgrounds, first visit card artwork, mobile building artwork, and social card came from assets supplied or approved during the redesign and are stored directly under `public/images/`. The six `card-*.webp` files preserve the exact supplied artwork: lower focal crops support Prayer, Proclamation, and People on the homepage, while the abstract upper crops support the Three P’s on the Beliefs page. The three `expect-*.webp` files support Joyful Worship, Rooted Teaching, and Room for Family in the order supplied. The three `ministry-*-group.webp` files are landscape focal crops of the supplied artwork for the Children, Young Adults, and Women & Men ministry cards. `give-banner.webp` is the supplied wide mosaic artwork used above the Give page content. `building-mobile.webp` is the user supplied square composition that keeps the full façade, entrance, address, and TAJ sign legible on phones. `apple-touch-icon.png` is derived from the supplied transparent logo on the site’s navy background.

## Iconography

The interface uses [Tabler Icons](https://tabler.io/icons), an open-source MIT-licensed outline set by Paweł Kuna. Only the icons listed in `astro.config.mjs` are included in the static build. The menorah and Jewish star are reserved for Jewish identity and story moments; general actions use plain semantic icons from the same family. The Give page uses Tabler's `brand-paypal` mark only to identify the external payment provider. PayPal remains a trademark of PayPal and the surrounding copy does not imply sponsorship or endorsement.
