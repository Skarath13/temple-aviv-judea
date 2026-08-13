# Temple Aviv Judea production operating notes

These instructions apply to this repository. Treat production, CMS, DNS, and credential work as release engineering: inspect the actual state, preserve mail, prove the hosted result, and report any unverified gate.

## Production architecture

Current production state as of July 26, 2026:

- Canonical site: `https://www.avivjudea.org`
- Production Worker: `temple-aviv-judea`
- Workers.dev diagnostic origin: `https://temple-aviv-judea.dark-dust-d162.workers.dev`
- TinaCloud project: `Temple Aviv Judea`
- TinaCloud client/project ID: `db67c20c-61e7-446a-a095-f9e126ae28df`
- GitHub repository and production branch: `Skarath13/temple-aviv-judea`, `main`
- Primary production deployer: Cloudflare Workers Builds, connected directly to
  the GitHub repository and production branch above.
- Persistent Astro session binding: `SESSION`
- Persistent KV namespace ID: `b8711c2ee9344dc689033a6c4fba823c`
- `www.avivjudea.org` is a Cloudflare Worker Custom Domain for `temple-aviv-judea`.
- Apex DNS is a proxied placeholder `A @ -> 192.0.2.0`. An active Cloudflare Single Redirect sends `https://avivjudea.org/*` to `https://www.avivjudea.org/${1}` with status 301 and query preservation.
- A second active Single Redirect upgrades `http://*` to `https://${1}` with status 301 and query preservation.
- The normal GitHub Pages deployment remains available as a rollback aid. It is not the canonical production host.

Cloudflare Custom Domains and redirect rules are dashboard-managed and
intentionally absent from `wrangler.jsonc`. Confirm that both remain attached
after any Worker replacement or infrastructure migration.

## Mail and DNS invariants

Do not delete or alter the mail records during website work:

- `MX @ priority 0 -> mail.crazysimon.com`
- `MX @ priority 10 -> mail.crazysimon.com`

The Wix rollback records removed at cutover were:

- `A @ -> 185.230.63.107`, proxied
- `A @ -> 185.230.63.186`, proxied
- `A @ -> 185.230.63.171`, proxied
- `CNAME www -> cdn1.wixdns.net`, proxied

If DNS rollback is required:

1. Disable the two production redirect rules.
2. Remove the proxied `192.0.2.0` apex placeholder.
3. Remove the Worker `www` Custom Domain.
4. Restore the three Wix apex A records and the Wix `www` CNAME above as proxied records.
5. Verify Wix returns 200 at HTTPS `www`, apex redirects to it, and both MX records are unchanged.

## Build and deployment contract

Use Node 24 and pnpm 11.17.0.

```sh
pnpm install --frozen-lockfile
pnpm run validate:content
pnpm run check
pnpm run build
pnpm run build:cloudflare
pnpm audit --prod
pnpm exec wrangler deploy --dry-run
```

- `pnpm run build` is the GitHub Pages/static rollback build. It must remain CMS-runtime-free.
- `pnpm run build:cloudflare` is the Tina-enabled Cloudflare build. It must emit `/admin/`, the Tina bridge markers on editable pages, and the dynamic `/tina-island/[name]` route.
- `pnpm exec wrangler deploy` follows Astro's generated `dist/server/wrangler.json`. Do not replace it with a hand-written entry point.
- Before deployment, require zero content-validation failures and zero Astro diagnostics.
- Inspect the dry-run upload size. The July 26 artifact was 2,517.72 KiB gzip
  against the current 3 MiB Workers Free limit, so bundle headroom is limited.

Pushes to `main` trigger Cloudflare Workers Builds for the production Worker.
This is a dashboard-managed Git integration, not a GitHub Actions workflow.
`.github/workflows/deploy.yml` is manual (`workflow_dispatch`) and refreshes the
GitHub Pages rollback artifact only when an operator intentionally runs it.

Cloudflare Workers Builds is the primary production deployment method. Its
production branch is `main`, non-production branch builds are disabled, the
build command is `pnpm run build:cloudflare`, and the deploy command is
`pnpm exec wrangler deploy`. Use manual `wrangler deploy` only for an explicitly
documented emergency or release diagnostic, then reconcile the deployed source
with `main`. Do not use the Cloudflare code editor as an alternate source of
truth.

Workers Builds requires these Cloudflare build variables:

- Encrypted secret: `TINA_TOKEN`
- Variables: `PUBLIC_TINA_CLIENT_ID`, `SITE_URL`
- Node heap setting: `NODE_OPTIONS=--max-old-space-size=4096`
- `SITE_URL` must be `https://www.avivjudea.org`.
- Do not add `WORKERS_CI_BRANCH` manually. Cloudflare injects it for each build.
- Keep the Cloudflare-generated Workers Builds token selected. Do not replace it
  with a general account token.
- The retired GitHub Worker workflow and its `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN` secrets are not part of the production build contract.

Never print, commit, or copy secret values into issues, logs, documentation, workflow YAML, or runtime client code. `PUBLIC_TINA_CLIENT_ID` and the site URL are public configuration; the Tina content token and Cloudflare token are not.

The heap setting is required because Tina indexing exceeded Node's default
roughly 2 GiB heap in the first native Cloudflare build. Cloudflare currently
provides 8 GB of build memory; the 4 GiB Node cap leaves capacity for the package
manager and build subprocesses. If this setting changes, re-prove a clean native
Workers Build rather than relying on a local or GitHub Actions build.

Native integration proof on July 26, 2026:

- Git commit: `0e89044f57568ceb4060250cc7ea6eb9c808322b`
- Initial Cloudflare build: `46a19a9d-1f63-4355-bcb3-e2561e4f68f5`,
  failed during Tina indexing with Node heap exhaustion before deployment.
- Retry after adding `NODE_OPTIONS`: build
  `736b6a1d-77a0-407b-8957-ab9644b676a5`, succeeded.
- Worker version created by the successful native build:
  `af4791a3-a897-4287-bec6-108987ab6d24`.

Final Cloudflare-only production proof on July 26, 2026:

- Git commit: `33eb261aac5b9ba54ea9c92803dd2e02eab7d125`
- Commit contents: all previously dirty responsive/UI work, deployment
  documentation, and deletion of `.github/workflows/deploy-worker.yml`.
- Cloudflare Workers Build:
  `d802b91b-b512-42ca-aff8-0c09a8ed3b59`, succeeded for the exact Git SHA.
- Worker version:
  `fcd025b1-2937-4f5f-be33-025d2cc02b94`.
- GitHub created no production Worker Action run for this commit. Only the
  GitHub Pages rollback workflow ran, and run `30192531788` succeeded.
- Local `main`, `origin/main`, and the native Workers Build were synchronized.
- Node 24.18.0 verification passed: frozen install, content validation, zero
  Astro diagnostics, static build, Tina/Cloudflare build, production dependency
  audit, and Worker dry run.
- Live verification passed for all seven public routes, `/admin/`, sitemap,
  manifest, favicon, 29 distinct emitted images including social images,
  canonical/OpenGraph URLs, and Tina bridge markers.
- Tina island behavior passed: direct GET `405`, valid preview POST `200`, and
  explicit cross-site POST `403`.
- Apex HTTP and HTTPS redirects preserved path/query and ended at canonical
  HTTPS `www`; both MX records remained at `mail.crazysimon.com`.
- Desktop rendered checks passed for the homepage and Visit page without a
  reproducible browser error. Real iPhone/iPad, installed-YouTube-app, zoom, and
  full cross-browser acceptance remain explicit device QA gates.
- The mobile YouTube handoff uses delegated click handling, runs only in a
  top-level coarse-pointer context, and does not mutate links inside the Tina
  preview iframe. Preserve those guards when changing external-link behavior.

## TinaCMS invariants

- CMS content lives in `src/content/`; schema lives in `tina/`; managed media
  lives in `public/images/`. All modeled local images, including the social
  sharing image, must remain under that configured `mediaRoot`.
- TinaCloud rewrites modeled image paths to `assets.tina.io` in production.
  After adding existing media or changing `mediaRoot`, trigger TinaCloud's Media
  sync and require every referenced CDN image to return `200 image/*`; a
  successful HTML build does not prove the objects were synced.
- There is no shared site-admin username, password, or PIN. `/admin/` access is
  granted to named TinaCloud project collaborators. A collaborator can register
  with GitHub or a native TinaCloud account, then must be invited to this
  project; never ask for or store the collaborator's password.
- Prefer the `Editor` role for content publishers. `Admin` also permits project
  configuration and collaborator management, so grant it only when required.
  Auth.js, Clerk, and custom auth require a self-hosted Tina data layer and are
  not part of the current hosted architecture.
- Routes, arbitrary code/HTML, PayPal mechanics, and validation rules remain developer-controlled.
- Clean builds depend on `generate:tina-types`; `tina/__generated__` and `public/admin` remain ignored.
- Cloudflare mode must compile `import.meta.env.TINA_CMS` to `"true"`. Do not switch page modules back to runtime `process.env` checks; prerendered pages otherwise omit the Tina island and bridge.
- The Worker build needs `PUBLIC_TINA_CLIENT_ID`, read-only `TINA_TOKEN`,
  `SITE_URL`, `NODE_OPTIONS=--max-old-space-size=4096`, and Cloudflare's injected
  `WORKERS_CI_BRANCH`.
- `/tina-island/page` is POST-only for Tina preview requests. Normal GET should return 405. Invalid or cross-site requests must not become a write path.
- Tina visual preview replaces the editable island after form acknowledgement.
  The layout deliberately avoids `motion-ready` when the same-origin referrer is
  `/admin/`, then retains a frame/island fallback, so replacement content never
  remains hidden by one-time reveal animations. Preserve top-level public motion
  and reduced-motion behavior when changing these guards.
- `SESSION` must remain bound to the pinned namespace above. Do not create a fresh namespace per deploy.

No-save CMS acceptance requires:

1. Open `https://www.avivjudea.org/admin/`.
2. Authenticate with an approved TinaCloud user.
3. Open Pages -> Home and require real fields such as `Page name`, `Site route`, `Search and sharing`, and `Page introduction`.
4. Require the preview iframe to remain fully visible after Tina acknowledges the form; do not accept a blank island.
5. Confirm successful Tina preview POSTs and no content commit when no Save action was used.

A complete publishing acceptance test still requires an intentional first save and second save: each must create the expected `main` commit, pass the native Cloudflare Workers Build, create a new Worker version, and appear at the canonical site. Coordinate real content and an approved publisher before running this test.

## Release verification

After every production deploy or DNS change, verify:

- HTTPS `www` public routes, `/admin/`, sitemap, icons, and manifest return 200.
- Every distinct image URL emitted by all public routes, including Open Graph
  and Twitter images, returns `200 image/*`; test the resulting CDN URLs rather
  than only the same-origin source files.
- Apex HTTP and HTTPS preserve path/query and end at canonical HTTPS `www`.
- Canonical and OpenGraph URLs use `https://www.avivjudea.org`.
- Homepage HTML contains `admin/bridge.js` and `data-tina-island`.
- Direct island GET returns 405; valid Tina preview POST returns 200.
- Both mail MX records are unchanged.
- GitHub `main` matches the intended commit and the native Cloudflare Workers
  Build for that SHA succeeds. If refreshing the rollback artifact is part of
  the release, manually run the GitHub Pages workflow and require it to complete.
- Cloudflare Worker logs show no new binding, island, or 5xx failures.

Keep the prior Worker version and GitHub Pages deployment available through the observation window. A Worker rollback does not roll back KV or DNS.

## Security and operational follow-ups

- The Cloudflare API token and R2/S3 credential used during initial activation
  were exposed in the setup conversation. Rotate/revoke both after the release,
  remove the obsolete GitHub Worker secrets, and remove unused AWS/R2 variables
  from the project `.env`. Do not revoke the distinct Cloudflare-generated
  Workers Builds token used by the native Git integration.
- The Tina build token value surfaced in a dashboard inspection result during
  release verification. Treat it as exposed: rotate it in TinaCloud, replace
  the encrypted `TINA_TOKEN` Cloudflare build variable, and prove a new native
  Workers Build before considering the incident closed. Never repeat the old or
  replacement value in logs, documentation, commits, or chat.
- R2/AWS credentials are not part of this site's production runtime.
- Keep TinaCloud publisher membership narrow; add a named backup owner only when authorized.
- `main` currently needs a branch-protection/ruleset design compatible with Tina's GitHub App publishing path.
- Add an external uptime monitor and deployment-failure/Worker-5xx alerts.
- The island endpoint serves public content but can consume compute. Monitor it and add a scoped rate-limit rule if abuse appears.
- Re-run the Worker bridge contract, editor visibility test, and dry-run size check before upgrading Astro, TinaCMS, `@tinacms/astro`, or the Cloudflare adapter.

The detailed implementation history and activation checklist are in `CLOUDFLARE_TINACMS_HANDOFF.md`.
