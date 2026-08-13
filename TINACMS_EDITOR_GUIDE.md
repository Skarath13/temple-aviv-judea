# TinaCMS editor guide

Use the Temple Aviv Judea editor at:

`https://www.avivjudea.org/admin/`

Sign in with your own TinaCloud account. Access is tied to named project
collaborators; there is no shared website password.

## What to edit

- **Pages** contains the designed content for each public page. Select a page,
  then either use the form or click highlighted content in the preview.
- **Site settings** contains the congregation name, contact information,
  navigation labels, service schedule, social links, and site-wide header and
  footer copy.
- **Upcoming events** contains the homepage event list. An event needs a title,
  start, end, and location. Turn on **Published** when it is ready. Ended events
  disappear automatically, and the site displays event times in Pacific time.

Routes, layout, code, and the approved donation destination are intentionally
developer-controlled. Ask a developer if one of those needs to change.

## Preview and publish

Typing in the editor updates the preview without publishing. If you leave
without selecting **Save**, the public website and GitHub should not change.

Selecting **Save** publishes directly to the production branch. It creates a
GitHub commit and automatically starts the Cloudflare production build; there
is no review or approval step. The live website changes after that build
finishes, so Save is automatic but not instantaneous.

After every Save:

1. Wait for the deployment to finish before making another unrelated change.
2. Open the edited public page in a new tab and verify the exact text, link,
   image, or event.
3. If the public page does not update, do not repeatedly press Save. Record the
   page, field, and approximate save time so the GitHub commit and Cloudflare
   build can be traced.

## Safe editing checklist

- Complete every field marked required; Tina will disable Save when a required
  field is empty.
- Add accurate alternative text whenever an image field includes an alt-text
  field. Describe the image's purpose, not its filename.
- Use the media picker for site images. Do not paste arbitrary external image
  URLs.
- Check link destinations before saving. The editor accepts only the approved
  link and media types used by this site.
- For events, make the end later than the start and verify the displayed Pacific
  date and time after publishing.
- Avoid deleting a page or changing structural fields. Those controls are
  intentionally hidden or disabled in the editor.
- Make one focused change per Save when practical. Git history can then identify
  and reverse a bad edit cleanly.

## First-use acceptance

Before relying on a new account for routine publishing, complete these checks
with a harmless, agreed-upon text change:

1. Change the preview without saving and confirm the public site does not
   change.
2. Save the text and confirm a new commit appears on `main`, the matching
   Cloudflare Workers Build succeeds, and the canonical public page updates.
3. Restore the original text through Tina and verify the second commit and
   deployment in the same way.
4. Upload a small approved image with alt text and verify the published image
   loads successfully before removing or replacing it.

If Save reports success but production stays unchanged, the previous Worker
version remains live. Report the failure instead of trying to work around it in
GitHub or the Cloudflare code editor.
