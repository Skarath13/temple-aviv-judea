import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { createHeroMediaRequestHandler } from "./hero-media-range.mjs";

export const prerender = false;

const heroMediaRequestHandler: APIRoute = ({ locals, request }) =>
	createHeroMediaRequestHandler({
		assetFetcher: env.ASSETS,
		cacheStorage: caches,
		context: locals.cfContext,
	})(request);

export const GET = heroMediaRequestHandler;
export const HEAD = heroMediaRequestHandler;
