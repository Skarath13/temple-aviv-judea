/**
 * Single dynamic endpoint that handles every island refetch the bridge
 * sends. The URL path (`/tina-island/page`, `/tina-island/global`, …)
 * selects an entry from the registry in `src/lib/islands.ts`; the route
 * itself comes from `@tinacms/astro/experimental`, so adding a new editable
 * region only ever touches the registry.
 */

import { experimental_createIslandRoute } from "@tinacms/astro/experimental";
import type { APIRoute } from "astro";
import { islands } from "../../lib/tina/islands";

export const prerender = false;
export const ALL: APIRoute = experimental_createIslandRoute(islands);
