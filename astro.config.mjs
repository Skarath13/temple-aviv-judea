import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tina from "@tinacms/astro/integration";
import { tinaAdminDevRedirect } from "@tinacms/astro/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

const canonicalSiteUrl = "https://www.avivjudea.org";
const satteriWasiPackage = "@bruits/satteri-wasm32-wasi";
const satteriWasiShimId = "\0astro-satteri-wasi-build-only";
const satteriWasiShim = `
const buildOnly = () => {
  throw new Error('Astro Satteri is build-only in this Worker.');
};
export {
  buildOnly as applyCommandsAndConvertToHastHandle,
  buildOnly as applyCommandsToHandle,
  buildOnly as applyCommandsToMdastHandle,
  buildOnly as compileHandle,
  buildOnly as compileMdx,
  buildOnly as convertMdastToHastHandle,
  buildOnly as createHastHandle,
  buildOnly as createMdastHandle,
  buildOnly as createMdxHastHandle,
  buildOnly as createMdxMdastHandle,
  buildOnly as dropHandle,
  buildOnly as getHandleSource,
  buildOnly as getMdastFrontmatter,
  buildOnly as getNodeData,
  buildOnly as mdastTextContentHandle,
  buildOnly as parseEsm,
  buildOnly as parseExpression,
  buildOnly as parseToHtml,
  buildOnly as renderHandle,
  buildOnly as serializeHandle,
  buildOnly as setNodeData,
  buildOnly as textContentHandle,
  buildOnly as walkHandle,
  buildOnly as walkMdastHandle,
};
`;
const requiredWorkersBuildVariables = [
	"PUBLIC_TINA_CLIENT_ID",
	"TINA_TOKEN",
	"WORKERS_CI_BRANCH",
	"BUN_VERSION",
];

export const validateWorkersBuildEnvironment = (environment) => {
	if (!environment.WORKERS_CI) return;

	const problems = [];
	const missingVariables = requiredWorkersBuildVariables.filter(
		(name) =>
			typeof environment[name] !== "string" || environment[name].trim() === "",
	);

	if (environment.SITE_URL !== canonicalSiteUrl) {
		problems.push("SITE_URL must match the canonical production URL");
	}
	if (environment.BUN_VERSION !== "1.2.15") {
		problems.push("BUN_VERSION must match the repository package manager");
	}
	if (missingVariables.length > 0) {
		problems.push(`missing ${missingVariables.join(", ")}`);
	}

	if (problems.length > 0) {
		throw new Error(`Invalid Workers CI environment: ${problems.join("; ")}.`);
	}
};

validateWorkersBuildEnvironment(process.env);

const cmsEnabled =
	process.env.TINA_CMS === "true" ||
	process.env.DEPLOY_ADAPTER === "cloudflare" ||
	Boolean(process.env.WORKERS_CI);
const site = cmsEnabled
	? process.env.SITE_URL || "http://localhost:4321"
	: "https://skarath13.github.io";
const base = cmsEnabled ? "/" : "/temple-aviv-judea";
const staticPagesSource = fileURLToPath(
	new URL(
		cmsEnabled ? "./src/data/pages-worker-stub.ts" : "./src/data/pages.ts",
		import.meta.url,
	),
);

const integrations = [
	mdx(),
	icon({
		include: {
			tabler: [
				"arrow-right",
				"arrow-up",
				"book",
				"brand-facebook",
				"brand-paypal",
				"brand-youtube",
				"calendar-event",
				"external-link",
				"heart-handshake",
				"jewish-star",
				"lock",
				"map-pin",
				"menorah",
				"music",
				"pray",
				"script",
				"shield-check",
				"users-group",
			],
		},
	}),
	sitemap({
		filter: (page) =>
			!page.endsWith("/admin/") &&
			!page.endsWith("/admin-preview/") &&
			!page.endsWith("/artists/") &&
			!page.endsWith("/llms.txt"),
	}),
];

// Bun skips Satteri's cpu=wasm32 optional package on native build hosts.
// Astro 7.1 still exposes that browser-only fallback to the Worker bundle.
const shimAstroSatteriWasi = {
	name: "shim-astro-satteri-wasi",
	enforce: "pre",
	resolveId(source) {
		if (source === satteriWasiPackage) return satteriWasiShimId;
	},
	load(id) {
		if (id === satteriWasiShimId) return satteriWasiShim;
	},
};

if (cmsEnabled) {
	integrations.push(
		tina(),
		{
			name: "tina-island-route",
			hooks: {
				"astro:config:setup": ({ injectRoute }) => {
					injectRoute({
						pattern: "/tina-island/[name]",
						entrypoint: new URL(
							"./src/lib/tina/island-route.ts",
							import.meta.url,
						),
						prerender: false,
					});
				},
			},
		},
		{
			name: "hero-media-route",
			hooks: {
				"astro:config:setup": ({ injectRoute }) => {
					injectRoute({
						pattern: "/videos/hero/[file]",
						entrypoint: new URL(
							"./src/lib/hero-media-route.ts",
							import.meta.url,
						),
						prerender: false,
					});
				},
			},
		},
	);
}

export default defineConfig({
	site,
	base,
	output: "static",
	adapter: cmsEnabled ? cloudflare() : undefined,
	integrations,
	redirects: {
		"/artists/": `${base === "/" ? "" : base}/ministries/#creative-arts`,
	},
	vite: {
		resolve: {
			alias: {
				"#static-pages": staticPagesSource,
			},
		},
		...(cmsEnabled
			? {
					define: {
						"import.meta.env.TINA_CMS": JSON.stringify("true"),
					},
					plugins: [shimAstroSatteriWasi, tinaAdminDevRedirect()],
					ssr: {
						optimizeDeps: {
							include: ["debug"],
						},
					},
				}
			: {}),
	},
});
