# Temple Aviv Judea production operating notes

These instructions apply to this repository. Treat production, CMS, DNS, and credential work as release engineering: inspect the actual state, preserve mail, prove the hosted result, and report any unverified gate.

## Production architecture

Current production state as of July 25, 2026:

- Canonical site: `https://www.avivjudea.org`
- Production Worker: `temple-aviv-judea`
- Workers.dev diagnostic origin: `https://temple-aviv-judea.dark-dust-d162.workers.dev`
- TinaCloud project: `Temple Aviv Judea`
- TinaCloud client/project ID: `db67c20c-61e7-446a-a095-f9e126ae28df`
- GitHub repository and production branch: `Skarath13/temple-aviv-judea`, `main`
- Persistent Astro session binding: `SESSION`
- Persistent KV namespace ID: `b8711c2ee9344dc689033a6c4fba823c`
- `www.avivjudea.org` is a Cloudflare Worker Custom Domain for `temple-aviv-judea`.
- Apex DNS is a proxied placeholder `A @ -> 192.0.2.0`. An active Cloudflare Single Redirect sends `https://avivjudea.org/*` to `https://www.avivjudea.org/${1}` with status 301 and query preservation.
- A second active Single Redirect upgrades `http://*` to `https://${1}` with status 301 and query preservation.
- The normal GitHub Pages deployment remains available as a rollback aid. It is not the canonical production host.

Cloudflare Custom Domains and redirect rules are dashboard-managed. They are intentionally not in `wrangler.jsonc` because the current deploy token does not have DNS permission. Confirm that both remain attached after any Worker replacement or infrastructure migration.

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
- Inspect the dry-run upload size. The July 25 artifact was about 2.505 MiB gzip against the current 3 MiB Workers Free limit, so bundle headroom is limited.

Pushes to `main` trigger:

- `.github/workflows/deploy.yml` for the GitHub Pages rollback build.
- `.github/workflows/deploy-worker.yml` for the production Worker.

The GitHub `main` workflow is the primary production deployment method. Use
manual `wrangler deploy` only for an explicitly documented emergency or release
diagnostic, then reconcile the deployed source with `main`. Do not make the
Cloudflare dashboard editor an alternate source of truth.

The Worker workflow requires these GitHub Actions settings:

- Secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `TINA_TOKEN`
- Variables: `PUBLIC_TINA_CLIENT_ID`, `SITE_URL`
- `SITE_URL` must be `https://www.avivjudea.org`.

Never print, commit, or copy secret values into issues, logs, documentation, workflow YAML, or runtime client code. `PUBLIC_TINA_CLIENT_ID` and the site URL are public configuration; the Tina content token and Cloudflare token are not.

## TinaCMS invariants

- CMS content lives in `src/content/`; schema lives in `tina/`; uploads live in `public/uploads/`.
- Routes, arbitrary code/HTML, PayPal mechanics, and validation rules remain developer-controlled.
- Clean builds depend on `generate:tina-types`; `tina/__generated__` and `public/admin` remain ignored.
- Cloudflare mode must compile `import.meta.env.TINA_CMS` to `"true"`. Do not switch page modules back to runtime `process.env` checks; prerendered pages otherwise omit the Tina island and bridge.
- The Worker build needs `PUBLIC_TINA_CLIENT_ID`, read-only `TINA_TOKEN`, `SITE_URL`, and the intended branch.
- `/tina-island/page` is POST-only for Tina preview requests. Normal GET should return 405. Invalid or cross-site requests must not become a write path.
- Tina visual preview replaces the editable island after form acknowledgement. The layout deliberately removes `motion-ready` only inside a Tina iframe so replacement content never remains hidden by one-time reveal animations. Preserve top-level public motion and reduced-motion behavior when changing this guard.
- `SESSION` must remain bound to the pinned namespace above. Do not create a fresh namespace per deploy.

No-save CMS acceptance requires:

1. Open `https://www.avivjudea.org/admin/`.
2. Authenticate with an approved TinaCloud user.
3. Open Pages -> Home and require real fields such as `Page name`, `Site route`, `Search and sharing`, and `Page introduction`.
4. Require the preview iframe to remain fully visible after Tina acknowledges the form; do not accept a blank island.
5. Confirm successful Tina preview POSTs and no content commit when no Save action was used.

A complete publishing acceptance test still requires an intentional first save and second save: each must create the expected `main` commit, pass the production Worker workflow, create a new Worker version, and appear at the canonical site. Coordinate real content and an approved publisher before running this test.

## Release verification

After every production deploy or DNS change, verify:

- HTTPS `www` public routes, `/admin/`, sitemap, icons, and manifest return 200.
- Apex HTTP and HTTPS preserve path/query and end at canonical HTTPS `www`.
- Canonical and OpenGraph URLs use `https://www.avivjudea.org`.
- Homepage HTML contains `admin/bridge.js` and `data-tina-island`.
- Direct island GET returns 405; valid Tina preview POST returns 200.
- Both mail MX records are unchanged.
- GitHub `main` matches the intended commit and both deployment workflows complete successfully.
- Cloudflare Worker logs show no new binding, island, or 5xx failures.

Keep the prior Worker version and GitHub Pages deployment available through the observation window. A Worker rollback does not roll back KV or DNS.

## Security and operational follow-ups

- The Cloudflare API token and R2/S3 credential used during initial activation were exposed in the setup conversation. Rotate/revoke both after the release, replace the GitHub Worker secret with a least-privileged token, and remove unused AWS/R2 variables from the project `.env`.
- R2/AWS credentials are not part of this site's production runtime.
- Keep TinaCloud publisher membership narrow; add a named backup owner only when authorized.
- `main` currently needs a branch-protection/ruleset design compatible with Tina's GitHub App publishing path.
- Add an external uptime monitor and deployment-failure/Worker-5xx alerts.
- The island endpoint serves public content but can consume compute. Monitor it and add a scoped rate-limit rule if abuse appears.
- Re-run the Worker bridge contract, editor visibility test, and dry-run size check before upgrading Astro, TinaCMS, `@tinacms/astro`, or the Cloudflare adapter.

The detailed implementation history and activation checklist are in `CLOUDFLARE_TINACMS_HANDOFF.md`.
