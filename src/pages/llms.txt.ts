import type { APIRoute } from 'astro';
import { pages } from '../data/pages';
import { site as siteContent } from '../data/site';
import { renderLlmsTxt } from '../lib/llms-txt.mjs';
import { withBase } from '../lib/urls';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    throw new Error('Astro site configuration is required to generate llms.txt.');
  }

  const siteRoot = new URL(withBase('/'), site);
  const body = renderLlmsTxt({
    pages: Object.values(pages),
    site: siteContent,
    siteRoot,
  });

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Content-Language': 'en',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
