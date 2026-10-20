# CMS field state patch

`react-final-form@7.0.1` explicitly restores initial values whenever a field
registers without an existing registration. Tina unmounts fields when navigating
between an object list and its items, even though the form retains their current
values. Restoring initial values here loses unsaved additions, edits, removals,
and intentionally cleared fields.

The patch limits that restoration to forms which explicitly set
`destroyOnUnregister`. It changes the CommonJS build used by Node tests and the
ES module build used by the Tina editor. Bun applies the committed patch during
frozen installation; no runtime monkey patch is used.

`tests/cms-form-state.test.mjs` exercises the installed React/Final Form lifecycle
under StrictMode. The first three regressions fail without the patch. Reset and
explicit `destroyOnUnregister` behavior must continue to pass. Remove this patch
only after an upstream release passes these tests and the Tina breadcrumb
workflow retains typed edits in the browser.
