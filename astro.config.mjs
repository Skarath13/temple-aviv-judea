import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tina from "@tinacms/astro/integration";
import { tinaAdminDevRedirect } from "@tinacms/astro/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

async function getAdapter() {
	const vercel = async () => (await import("@astrojs/vercel")).default();
	const cloudflare = async () =>
		(await import("@astrojs/cloudflare")).default();
	const netlify = async () => (await import("@astrojs/netlify")).default();
	const nodeStandalone = async () =>
		(await import("@astrojs/node")).default({ mode: "standalone" });

	switch (process.env.DEPLOY_ADAPTER) {
		case "vercel":
			return vercel();
		case "cloudflare":
			return cloudflare();
		case "netlify":
			return netlify();
		case "node":
			return nodeStandalone();
		case undefined:
			break; // no override -> auto-detect below
		default:
			console.warn(
				`[astro.config] Unknown DEPLOY_ADAPTER "${process.env.DEPLOY_ADAPTER}" - ignoring and auto-detecting.`,
			);
	}
	if (process.env.VERCEL) return vercel();
	// CF_PAGES = Cloudflare Pages CI; WORKERS_CI = Cloudflare Workers Builds CI.
	if (process.env.WORKERS_CI || process.env.CF_PAGES) return cloudflare();
	if (process.env.NETLIFY) return netlify();

	return nodeStandalone();
}

function getSiteUrl() {
	if (process.env.SITE_URL) return process.env.SITE_URL;
	if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
		return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	if (process.env.CF_PAGES_URL) return process.env.CF_PAGES_URL;
	if (process.env.NETLIFY && process.env.URL) return process.env.URL;

	return "http://localhost:4321";
}

const integrations = [
	sitemap({
		filter: (page) =>
			!page.endsWith("/admin/") &&
			!page.endsWith("/admin-preview/") &&
			!page.endsWith("/home/") &&
			!page.endsWith("/llms.txt"),
	}),
	tina(),
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
];

export default defineConfig({
	site: getSiteUrl(),
	output: "static",
	adapter: await getAdapter(),
	integrations,
	image: {
		// Astro 6 responsive images: auto-emit srcset so the browser picks a
		// variant matched to the rendered box + DPR, not the full intrinsic size.
		layout: "constrained",
		remotePatterns: [{ protocol: "https", hostname: "assets.tina.io" }],
	},
	vite: {
		define: {
			"import.meta.env.TINA_CMS": JSON.stringify("true"),
		},
		plugins: [tinaAdminDevRedirect()],
		ssr: {
			noExternal: ["@tinacms/astro", "@tinacms/bridge"],
		},
		build: {
			rollupOptions: {
				onwarn(warning, warn) {
					if (
						warning.code === "UNUSED_EXTERNAL_IMPORT" &&
						warning.exporter === "tinacms/dist/client"
					) {
						return;
					}
					warn(warning);
				},
			},
		},
	},
});
