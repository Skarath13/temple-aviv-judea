const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const withBase = (path: string) =>
	path.startsWith("/") ? `${base}${path}` : path;

export const withoutBase = (path: string) =>
	base && path.startsWith(base) ? path.slice(base.length) || "/" : path;
