const staticPagesUnavailable = new Proxy<Record<string, never>>({}, {
  get() {
    throw new Error('Static MDX pages are unavailable in the Tina Worker.');
  },
});

export const pages = staticPagesUnavailable;
