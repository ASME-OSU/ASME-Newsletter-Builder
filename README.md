# ASME at OSU Newsletter Builder

A static newsletter builder for creating ASME at Ohio State campaigns and copying email-safe HTML into Brevo.

**Open the builder:** [asme-osu.github.io/ASME-Newsletter-Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/)

**Officer instructions:** [Read the short user guide](USER_GUIDE.md)

## Build a newsletter

1. Open the hosted builder.
2. Select several upcoming events in **Calendar** and choose **Import selected**, or add them manually. Use the optional issue date filter to narrow the list. Auto-sort arranges recognizable dates and flags possible duplicates or schedule conflicts.
3. Customize the featured event, announcement, quick links, design, subject, and preheader.
4. Watch the live readiness score and inbox preview while editing.
5. Check the Desktop, Mobile, and Email dark mode previews, then run **Check Links**.
6. Click **Export → Copy HTML for Brevo** and review the final checklist.
7. In Brevo, choose **Design → Code your own**, paste the HTML, copy the subject line, and send a test email.

The builder auto-saves in the current browser. Drafts are not automatically shared between computers.

## Calendar importing

The **Calendar** tab lists upcoming events from the public ASME Google Calendar. Clicking **Import Event** creates a normal editable newsletter event containing the calendar title, date, time, location, description, and source link. Editing the imported copy does not change Google Calendar.

The browser reads `calendar-events.json` from the same GitHub Pages site. An hourly GitHub Actions workflow refreshes that file from the public Google iCal feed. This avoids requiring officers to sign in to Google or exposing an API key in browser code.

If an imported event changes in Google Calendar, the builder marks it **Calendar update available**. Use **Update Imported Event** on that calendar card or **Sync Imported Events** to review available changes. The review shows the current and calendar values; uncheck fields to keep newsletter-specific copy, then apply the selected changes. Updating refreshes the calendar-owned title, date, time, location, description, event type, and link while preserving newsletter images. Changes are never applied silently, so newsletter-specific edits are not overwritten without a click. If an imported event is cancelled or removed, its editor card is marked **No longer on Calendar**.

## Faster editing and recovery

- Use an event card’s **Actions → Use as featured** to copy its details, image and button into Featured. The original remains in Upcoming Events. Replacing featured content asks first and supports Undo.
- **View Checks → Fix** opens the relevant section and focuses the field needing attention.
- Major changes and preset fills expose an immediate **Undo** button as well as revision history.
- An optional **Calendar date (for sorting)** stores the year separately from the editable display date. Calendar imports fill it automatically.
- Image status reports actual preview loading failures and image dimensions; failures also appear in readiness.
- **Templates → Saved issues** keeps up to 30 named issues in this browser. Use Open, Update, or Delete on saved entries. Export JSON for off-device backup or handoff.
- JSON and HTML exports use the issue subject in their filenames.
- Fictional practice events retain a dedicated readiness warning after duplication, detaching from Calendar, featured copying, and draft handoff.

## Share an editable draft

Use **Templates → Export Draft .json** to download the entire editable issue. Another officer can use **Import Draft .json** to continue editing it. The builder keeps one quick previous-draft backup and up to 20 dated revision snapshots before major changes. Restoring a revision first saves the current version, so it is safe to move backward and forward.

Finished `.html` exports are email previews, not editable builder projects. Share the draft JSON when collaboration is required.

## Main features

- Google Calendar event importing
- Editable featured event and upcoming event cards
- Add, duplicate, remove, and reorder events
- Chronological event sorting, optional auto-sort, duplicate detection, and same-time conflict warnings
- Optional images and event buttons
- Announcement and quick-link sections
- Built-in and user-saved templates
- Readable Light and Navy Dark email appearances
- Reusable organization defaults for logos, footer, website, quick links, social accounts, and the default [ASME GroupMe](https://groupme.com/join_group/95825283/iaBgk5Ld)
- Live send-readiness score, subject/preheader counters, and shared final checklist
- Inbox, desktop, mobile, and approximate email-client dark-mode previews
- On-demand link checker with reachable, redirected, broken, invalid, and browser-blocked results
- Browser autosave, previous-draft recovery, and 20-version revision history
- Versioned editable draft import/export
- Brevo-ready HTML and downloadable HTML export
- URL, placeholder, image-alt, duplicate, schedule-conflict, unsubscribe, and footer checks before copying
- Resizable desktop editor with a three-dot drag handle, saved width, keyboard controls and responsive compact mode
- Clear primary/secondary actions, directly available list tools and in-flow event action menus
- Right-side preview rail on desktop, full-width phone preview with a dark-mode toggle
- Larger illustrated guide with SVG workflow art and direct navigation shortcuts
- Calendar search and two-way event expansion
- Responsive editor and keyboard-visible focus states

## Brevo and footer requirements

The unsubscribe field should contain exactly `{{ unsubscribe }}`. Brevo replaces that placeholder when sending.

Before sending, replace the default footer text with a verified ASME/Ohio State mailing address appropriate for the campaign. The checklist warns when the footer does not resemble a complete postal address but still allows an officer to review and proceed.

## Organization defaults and browser storage

Update the quick links under **Links**, the footer under **Design**, and branding/contact fields under **Settings**. Then select **Settings → Save as Defaults**. New issues on that browser will reuse the saved logo, website, social accounts, GroupMe, footer, and three quick links. **Restore ASME Defaults** resets and saves the official values bundled with the builder.

Drafts, custom templates, organization defaults, auto-sort preference, and revision history use browser local storage. They are not synced between computers; export a draft JSON for handoff or backup. Clearing site data removes those local records.

## Link-check limitations

The link checker validates every enabled newsletter destination and attempts a network request. Some sites reject browser-based automated checks because of CORS or bot protection. Those are reported as **Could not verify**, not broken; open them manually before sending. Brevo's `{{ unsubscribe }}` placeholder is validated separately because it does not become a real link until Brevo sends the campaign.

## Local development

Requirements: Node.js 24 or newer.

```bash
npm install
npm run check
npm run sync:calendar
```

Serve the repository with a local web server when testing calendar imports. Opening `index.html` directly still supports the editor, but browsers generally block a `file://` page from fetching `calendar-events.json`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Repository structure

- `index.html` and `styles.css` — builder markup and responsive styling
- `newsletter-layout.js` — pointer/keyboard sidebar resizing and saved layout preferences
- `newsletter-editor.js` — editor actions, preview and readiness navigation
- `newsletter-calendar.js` — calendar feed, batch imports and reviewed updates
- `newsletter-storage.js` — autosave, revision history and draft handoff
- `newsletter-email.js` — email rendering from a supplied state snapshot
- `newsletter-readiness.js` — pure validation and field destinations
- `newsletter-links.js` — link-check invalidation and async race protection
- `newsletter-library.js` — named local issue storage
- `assets/guide-workflow.svg` — original workflow illustration for the in-app guide
- `assets/hub-theme.css` — latest shared ASME editor theme, with bundled fonts under `assets/fonts/`
- The builder interface uses locally hosted Manrope (`@fontsource-variable/manrope` 5.2.8); its open font license is in `assets/fonts/MANROPE-OFL.txt`.
- `newsletter-core.js` — state validation, escaping, draft schema, and calendar mapping helpers
- `calendar-events.json` — generated public event feed used by the hosted builder
- `scripts/sync-calendar.mjs` — Google iCal synchronization script
- `test/` — Node tests for state, security, draft, and calendar behavior
- `.github/workflows/` — tests and hourly calendar synchronization

## Practice calendar cleanup

The preview accepts either a starting year such as `2027` or its complete academic year, `2027-2028`. **Remove fictional events** leaves fictional mode immediately, restores the chapter source and refreshes its generated JSON. Loading and failure messages remain visible; a failed refresh keeps any available chapter snapshot. Choose **Upcoming** afterward to clear the year filter and show chapter events. Removing preview events does not delete editable newsletter cards already imported into a draft.

### Asset versions

All script and stylesheet URLs in `index.html` share a release version. Bump it when shipping changed assets so returning browsers load a consistent release. The shared test fixture and HTML checks resolve the versioned URLs to local files.
