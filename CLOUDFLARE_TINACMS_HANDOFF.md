# Cloudflare Workers and TinaCloud handoff

Updated July 26, 2026.

`AGENTS.md` is the authoritative production runbook. This file summarizes the
hosted architecture, the proven deployment path, and the remaining acceptance
gates.

## Live architecture

- Canonical site: `https://www.avivjudea.org`
- Production Worker: `temple-aviv-judea`
- Source: `Skarath13/temple-aviv-judea`, branch `main`
- Primary deployer: Cloudflare Workers Builds native Git integration
- Static rollback: GitHub Pages via `.github/workflows/deploy.yml`
- TinaCloud project: `Temple Aviv Judea`
- Tina client/project ID: `db67c20c-61e7-446a-a095-f9e126ae28df`
- Persistent Astro session binding: `SESSION`
- Persistent KV namespace: `b8711c2ee9344dc689033a6c4fba823c`
- Tina-managed content: `src/content/`
- Tina-managed media root: `public/images/`

The `www` hostname is a Worker Custom Domain. The apex uses a proxied placeholder
record plus Cloudflare Single Redirect rules for canonical HTTPS `www`. Mail MX
records remain at `mail.crazysimon.com` and must not be changed during website
work. Exact DNS and rollback values are in `AGENTS.md`.

## Primary deployment path

Cloudflare is connected directly to the GitHub repository. A push to `main`
starts a native Workers Build and deploys the resulting Worker:

```sh
bun run build:cloudflare
bunx wrangler deploy
```

Non-production branch builds are disabled. The GitHub Actions Worker workflow
was removed after the native integration completed a real build and deployment.
The GitHub Pages workflow remains only as a static rollback artifact.

Cloudflare build variables:

- `PUBLIC_TINA_CLIENT_ID`
- encrypted `TINA_TOKEN`
- `SITE_URL=https://www.avivjudea.org`
- `BUN_VERSION=1.2.15`
- `NODE_OPTIONS=--max-old-space-size=4096`

Cloudflare supplies `WORKERS_CI_BRANCH` and the Git metadata variables. It also
owns a dedicated generated Workers Builds token. Do not add a general Cloudflare
account token to the build and do not copy any secret into the repository.

The first native build reached Tina indexing but exceeded Node's default roughly
2 GiB heap. Cloudflare provides 8 GB of build memory; setting a 4 GiB Node heap
allowed the retry to build and deploy successfully while leaving memory for the
package manager and child processes. Preserve that setting unless a clean native
Workers Build proves it is no longer required.

## Repository verification

Use Node 24 and Bun 1.2.15:

```sh
bun install --frozen-lockfile
bun run validate:content
bun run check
bun run build
bun run build:cloudflare
bun audit --prod
bunx wrangler deploy --dry-run
```

Keep the direct Vite 8.1.5, Rolldown 1.1.5, and Cloudflare Vite plugin 1.47.0 development pins. Bun otherwise resolves a newer nested Worker toolchain while Tina still needs its own Vite 4 graph; the resulting build can pass prerendering but fail the dynamic Tina island and hero-media routes at runtime.

Expected results:

- Content validation passes.
- Astro reports zero diagnostics.
- Static and Tina/Cloudflare builds pass.
- The production dependency audit reports zero known vulnerabilities.
- The Worker dry run finds the generated asset manifest, `IMAGES`, `ASSETS`,
  and the pinned `SESSION` binding.
- The compressed Worker remains below the selected plan's script-size limit.

The July 25 production artifact was about 2,518 KiB gzip, leaving limited
headroom under the current 3 MiB Workers Free limit. Recheck size on every
dependency upgrade or material CMS/runtime change.

## TinaCMS boundary

- Global settings: `src/content/settings/site.json`
- Public page documents: `src/content/pages/*.mdx`
- Upcoming events: `src/content/events/events.json`
- Schema and editor configuration: `tina/`
- Managed media: `public/images/`

Routes, component code, styles, raw HTML, PayPal mechanics, and validation rules
remain developer-controlled. The Cloudflare build emits `/admin/`, the editable
Tina islands, click-to-edit markers, and the POST-only
`/tina-island/[name]` preview endpoint. The static GitHub Pages build omits that
runtime editor boundary.

There is no shared admin password or PIN. Editors authenticate as named
TinaCloud collaborators, using GitHub or a native TinaCloud account supported by
the hosted project. Prefer the Editor role; reserve Owner/Admin access for
project administration.

TinaCloud rewrites modeled media URLs to `assets.tina.io`. A successful HTML
build does not prove media synchronization. After media-root changes or uploads,
verify every emitted image URL, including Open Graph and Twitter images, returns
`200 image/*`.

## Hosted acceptance still required

Preview and no-save editing are proven, but full publishing is not accepted
until all of the following pass:

1. An approved publisher performs an intentional first save.
2. Tina creates the expected commit on `main`.
3. Cloudflare Workers Builds records that exact SHA and succeeds.
4. A new Worker version is deployed and the change appears at the canonical
   site.
5. A second intentional save repeats the same path, proving persistent session
   and publishing behavior.
6. An approved Editor/backup collaborator succeeds and an unauthorized account
   cannot edit.
7. Media upload, alt text, replacement, and deletion work end to end.
8. Invalid routes, unsafe links, and invalid list limits are rejected before
   they can break production.

The Tina Free plan currently has one Owner and one remaining collaborator seat.
Branch protection must be designed around Tina's Git publishing behavior;
blindly requiring a human pull request or environment approval can break CMS
publishing.

## Post-deploy verification

After every native Workers Build:

- Confirm the Cloudflare build references the intended Git SHA.
- Record the new Worker version ID.
- Verify all public routes, `/admin/`, sitemap, manifest, icons, and media.
- Verify canonical and Open Graph URLs use HTTPS `www`.
- Verify apex HTTP and HTTPS redirects preserve path and query.
- Require homepage Tina bridge markers.
- Require island GET `405`, valid preview POST `200`, and explicit cross-site
  browser POST denial.
- Confirm both MX records are unchanged.
- Check Worker logs for binding, island, and 5xx errors.
- Keep the prior Worker version and GitHub Pages build available through the
  observation window.

## Security and operations backlog

- Revoke/rotate the exposed setup-era Cloudflare API token and R2/S3 access key.
- Remove obsolete GitHub Worker secrets and unrelated Cloudflare/AWS variables
  from the ignored local `.env`.
- Add a tested response-header policy: HSTS after hostname review, CSP compatible
  with Tina, `X-Content-Type-Options`, `Referrer-Policy`, and
  `Permissions-Policy`.
- Add `X-Robots-Tag: noindex, nofollow` for `/admin/*`.
- Add external uptime, deployment-failure, and Worker 5xx alerting.
- Decide whether to disable the public `workers.dev` diagnostic origin after the
  observation window.
- Monitor or rate-limit the public Tina island renderer without breaking
  same-origin preview.
- Coordinate SPF, DKIM, and DMARC separately with the mail provider.
- Add behavioral, keyboard, and authenticated editor tests.
- Add a Tina-compatible `main` branch-protection/ruleset design.

## References

- [TinaCMS on Cloudflare Workers](https://tina.io/docs/tinacloud/deployment-options/cloudflare-workers)
- [TinaCMS Astro setup](https://tina.io/docs/frameworks/astro)
- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
