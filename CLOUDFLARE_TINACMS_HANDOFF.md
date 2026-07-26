# Cloudflare Workers and TinaCloud handoff

Prepared July 25, 2026.

## Goal

Move Temple Aviv Judea from its current GitHub Pages deployment to Cloudflare Workers, connect TinaCloud, and give approved nontechnical publishers normal CMS control without replacing the existing visual design.

## Verified repository state

- The normal `pnpm run build` still targets the existing GitHub Pages base path at `/temple-aviv-judea`.
- `pnpm run build:cms:local` enables TinaCMS, switches Astro to the Cloudflare adapter, uses a root base path, generates `/admin/`, and builds successfully under Node 24.
- `pnpm exec wrangler deploy --dry-run` succeeds and detects the generated Cloudflare asset configuration.
- Local Worker smoke checks returned HTTP 200 for `/`, `/admin/`, `/visit/`, and `/admin-preview/`.
- The guarded Worker island route returned 405 for GET and 200 for a valid Tina preview POST, including the primary form payload and field-level edit markers.
- iOS and WebKit chrome theming is scaffolded with `theme-color`, `viewport-fit=cover`, safe-area insets, standalone app metadata, an Apple touch icon, and `site.webmanifest`.
- The production dependency audit currently reports zero vulnerabilities with `pnpm audit --prod`.
- No TinaCloud project, Cloudflare Worker, KV namespace, route, custom domain, account ID, secret, deployment, or DNS change was created during this work.

Current CMS-managed sources:

- Global site settings: `src/content/settings/site.json`
- Every public page's SEO, hero, designed body content, media, links, and additional page blocks: `src/content/pages/*.json`
- Upcoming events: `src/content/events/events.json`
- Schema: `tina/`
- CMS uploads: `public/uploads/`

The schema provides global settings, navigation, service times, SEO, page-specific designed sections, rich text, text-and-image sections, card grids, galleries, calls to action, media, and up to three events.

## Completed local CMS boundary

The pre-Cloudflare content migration is complete:

- All existing public page headings, paragraphs, images, accessible descriptions, captions, link labels, and safe destinations are seeded in typed Tina JSON documents.
- The custom visual components remain in Astro, but they now render their content from Tina documents instead of hard-coded page literals.
- Page-specific templates keep the editor focused and preserve the current design.
- Routes, component styles, arbitrary code, raw HTML, and PayPal mechanics remain developer-controlled.
- `requestWithMetadata()`, the page island registry, the conditionally injected on-demand `/tina-island/[name]` endpoint, `<TinaIsland>`, and `tinaField()` markers are wired.
- The existing GitHub Pages build omits the runtime island behavior; CMS/Cloudflare mode enables it.
- `scripts/validate-content.mjs` enforces document identity, fixed routes, required structures, list limits, safe links, safe image sources, and the existence of local media.

Normal form-based CMS control is locally complete. Page content has click-to-edit markers. Shared global settings and events remain separate Tina forms, which avoids duplicating site-wide data inside each page.

The remaining boundary is hosted integration: TinaCloud authentication and saving, the real Worker runtime, the persistent `SESSION` KV namespace, and production-domain behavior cannot be proven until the authorized TinaCloud and Cloudflare resources exist.

## Remaining activation order

### 1. Reconfirm the repository baseline

Use Node 24.

```sh
pnpm install --frozen-lockfile
pnpm run validate:content
pnpm run check
pnpm run build
pnpm run build:cms:local
pnpm audit --prod
pnpm exec wrangler deploy --dry-run
```

Expected results:

- Content validation passes.
- Astro reports zero diagnostics.
- Both GitHub Pages and Tina/Cloudflare builds pass.
- The production audit reports zero vulnerabilities.
- Wrangler identifies the generated assets and exits without deploying.
- The compressed Worker remains below the intended Cloudflare plan's current script-size limit.

Inspect `git status` and the full diff before committing. Do not include `.env`, `public/admin`, `tina/__generated__`, `.wrangler`, or `dist`.

### 2. Connect TinaCloud

This requires user-authorized account work.

1. Create a TinaCloud project.
2. Connect the correct GitHub repository.
3. Set the production branch deliberately, normally `main`.
4. Invite only approved publisher email addresses.
5. Obtain:
   - `PUBLIC_TINA_CLIENT_ID`
   - `TINA_TOKEN`
6. Confirm the least-privileged Tina token suitable for builds. Do not use a personal GitHub token or place credentials in source files.

The branch resolver in `tina/config.ts` already includes `WORKERS_CI_BRANCH`, which prevents a preview deployment from silently editing `main`.

### 3. Create the Cloudflare Worker from the repository

Use Workers, not the legacy Cloudflare Pages flow.

In Workers & Pages:

1. Create a Worker by importing the GitHub repository.
2. Select the intended production branch.
3. Set the build command:

   ```sh
   pnpm run build:cloudflare
   ```

4. Set the deploy command:

   ```sh
   pnpm exec wrangler deploy
   ```

5. Add these build-time variables in Worker Settings, Build, Variables and Secrets:
   - `PUBLIC_TINA_CLIENT_ID`
   - `TINA_TOKEN`
   - `SITE_URL`
6. Confirm the build runtime uses Node 24, consistent with `.node-version` and `package.json`.

Cloudflare Workers does not inject its public URL into the build. Set `SITE_URL` to the exact HTTPS Worker preview origin first, then to the approved custom domain at cutover.

Do not duplicate the Tina variables as runtime Worker secrets unless current Tina documentation explicitly requires that behavior. The current guide describes them as build-time variables.

### 4. Pin the Astro session namespace

The Astro Cloudflare adapter generates a `SESSION` KV binding. Tina's guide warns that an automatically created namespace is not written back to the repository, so a later git build can fail when it tries to create the same namespace again.

Either create it before the first production deploy:

```sh
pnpm exec wrangler kv namespace create SESSION
```

or copy the namespace ID created by the first deploy from the Cloudflare dashboard.

Then add the real ID to `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSION",
    "id": "<real namespace id>"
  }
]
```

Never guess or fabricate the ID. Commit the binding after Cloudflare confirms the namespace.

### 5. Preview-deployment acceptance test

Before changing DNS:

- `/` returns 200 with the intended canonical URL.
- Every public route returns 200.
- `/admin/` loads the TinaCloud sign-in flow.
- An approved publisher can sign in.
- An unapproved account cannot edit.
- Editing global settings saves to the intended Git branch.
- Editing every page collection saves and triggers a new Worker build.
- A page update appears after deployment without losing layout or media.
- The events section handles zero through three published events.
- Media upload, alt text, replacement, and deletion work.
- Unsafe or invalid content fails validation before deployment.
- Click-to-edit highlights the correct fields.
- `/tina-island/*` succeeds on the Worker with `nodejs_compat`.
- Sitemap and OpenGraph URLs use the preview Worker origin.
- Safari browser chrome uses the dark blue theme color.
- Portrait and landscape layouts keep interactive content clear of the notch, rounded corners, and home indicator.
- An iOS Home Screen install opens in standalone mode with the intended title, icon, status bar treatment, and launch background.
- The second CMS save succeeds, proving the pinned `SESSION` namespace is reusable.
- Cloudflare logs show no repeated 4xx/5xx, binding, or Tina route errors.

### 6. Custom-domain cutover

Do not change `avivjudea.org` until the preview passes and the user explicitly approves cutover.

Before cutover:

- inventory current DNS records and the existing production host
- confirm which apex and `www` hostnames should resolve
- establish a tested rollback target
- update `SITE_URL` in both the Worker build settings and TinaCloud
- run the final build and preview smoke test

After cutover:

- verify apex and `www` HTTPS behavior
- verify redirects and canonical URLs
- verify `/admin/`, one real save, the resulting Git commit, and redeployment
- keep the prior GitHub Pages deployment available until the production observation window passes

Rollback options:

- roll back to the previous Cloudflare Worker version
- revert the content commit generated by Tina
- restore the previous DNS target if the domain cutover fails

## Dependency and security notes

- Astro was updated to 7.1.3 to remove a direct reflected-XSS advisory affecting 7.0.9 and earlier.
- Patched `postcss` and `tar` versions are enforced through pnpm overrides.
- `pnpm audit --prod` reports zero production vulnerabilities as of this handoff.
- The repository pins pnpm 11.17.0. `supportedArchitectures` intentionally installs both the current native target and Satteri's WASM target because Astro's on-demand renderer bundles for Cloudflare. Do not remove the WASM target without re-proving the CMS build.
- Cloudflare dev mode explicitly prebundles the CommonJS `debug` dependency used by `astro-icon`; without that narrow rule, the Worker-based Vite runner throws `module is not defined`. Keep the rule until the upstream packages no longer require it.
- pnpm only allows reviewed install scripts for `better-sqlite3`, `esbuild`, and `workerd`; `core-js` is explicitly denied.
- The last dry run measured 2,519.28 KiB gzip. That is below Cloudflare's current 3 MB Free-plan Worker limit but leaves limited headroom; recheck the dry-run size before activation and use a paid Worker or reduce the editor route bundle if it grows past the selected plan's limit.
- The ignored local `.env` currently contains unrelated Cloudflare and AWS credential variables. Wrangler auto-loads them in local mode. Move unrelated credentials out of this project before future Worker testing and keep only the variables documented in `.env.example`; no values should be committed.
- The latest full `pnpm audit` request returned malformed compressed data from npm's audit endpoint during this handoff. Re-run it before activation; do not treat the production-only result as a complete development-toolchain audit.
- Do not use forced dependency downgrades to silence Tina toolchain advisories or peer warnings.
- Recheck current Tina releases and advisories before activation. Treat the editor and build environment as privileged, keep publisher membership narrow, and do not expose local Tina development servers publicly.
- Tina's current Astro starter pins matching React and React DOM versions for the admin build. Peer warnings from older nested Tina UI packages remain upstream; the local admin build and Worker smoke tests pass.
- Ordinary page content belongs in Tina's Git-backed files. Do not add D1 or R2 merely to duplicate CMS content. Add runtime storage only for a separately defined application feature that needs request-time writes.

## Current documentation

- [TinaCMS on Cloudflare Workers](https://tina.io/docs/tinacloud/deployment-options/cloudflare-workers)
- [TinaCMS Astro setup](https://tina.io/docs/frameworks/astro)
- [TinaCMS Astro visual editing](https://tina.io/docs/contextual-editing/astro)
- [Cloudflare Workers Astro guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/)
