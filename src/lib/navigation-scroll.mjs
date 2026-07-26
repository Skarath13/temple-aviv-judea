export const navigationScrollScript = `(() => {
  if (window.parent !== window || window.location.hash) return;

  const navigationEntry =
    typeof window.performance?.getEntriesByType === 'function'
      ? window.performance.getEntriesByType('navigation')[0]
      : undefined;
  const legacyNavigationType = window.performance?.navigation?.type;
  const isHistoryTraversal =
    navigationEntry?.type === 'back_forward' ||
    (!navigationEntry && legacyNavigationType === 2);
  if (isHistoryTraversal) return;

  const canControlRestoration = 'scrollRestoration' in window.history;
  const previousRestoration = canControlRestoration
    ? window.history.scrollRestoration
    : undefined;
  if (canControlRestoration) {
    window.history.scrollRestoration = 'manual';
  }

  const resetToTop = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  const finishRestoration = () => {
    resetToTop();
    window.requestAnimationFrame(() => {
      resetToTop();
      window.requestAnimationFrame(() => {
        resetToTop();
        if (canControlRestoration) {
          window.history.scrollRestoration =
            previousRestoration === 'manual' ? 'manual' : 'auto';
        }
      });
    });
  };

  resetToTop();
  document.addEventListener('DOMContentLoaded', resetToTop, { once: true });
  window.addEventListener('pageshow', finishRestoration, { once: true });
})();`;
