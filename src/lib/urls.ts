const configuredBase = import.meta.env.BASE_URL;
const base = configuredBase === '/' ? '' : configuredBase.replace(/\/$/, '');

export const withBase = (path: string) => {
  if (!path.startsWith('/')) return path;
  return `${base}${path}`;
};

export const withoutBase = (path: string) => {
  if (!base || !path.startsWith(base)) return path;
  return path.slice(base.length) || '/';
};
