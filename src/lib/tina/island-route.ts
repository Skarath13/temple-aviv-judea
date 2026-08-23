import { experimental_createIslandRoute } from "@tinacms/astro/experimental";
import type { APIRoute } from "astro";
import { islands } from "./islands";

// The Tina handler performs its own same-origin POST and preview-content-type checks.
export const ALL: APIRoute = experimental_createIslandRoute(islands);
