# ASME at OSU Newsletter Builder

A static newsletter builder for creating ASME at Ohio State campaigns and copying email-safe HTML into Brevo.

**Open the builder:** [asme-osu.github.io/ASME-Newsletter-Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/)

**Officer instructions:** [Read the short user guide](USER_GUIDE.md)

## Build a newsletter

1. Open the hosted builder.
2. Import upcoming events from **Calendar** or add them manually. Auto-sort arranges recognizable dates and flags possible duplicates or schedule conflicts.
3. Customize the featured event, announcement, quick links, design, subject, and preheader.
4. Watch the live readiness score and inbox preview while editing.
5. Check the Desktop, Mobile, and Email dark mode previews, then run **Check Links**.
6. Click **Copy HTML for Brevo** and review the final checklist.
7. In Brevo, choose **Design → Code your own**, paste the HTML, copy the subject line, and send a test email.

The builder auto-saves in the current browser. Drafts are not automatically shared between computers.

## Calendar importing

The **Calendar** tab lists upcoming events from the public ASME Google Calendar. Clicking **Import Event** creates a normal editable newsletter event containing the calendar title, date, time, location, description, and source link. Editing the imported copy does not change Google Calendar.

The browser reads `calendar-events.json` from the same GitHub Pages site. An hourly GitHub Actions workflow refreshes that file from the public Google iCal feed. This avoids requiring officers to sign in to Google or exposing an API key in browser code.

If an event is changed in Google Calendar after it was imported, remove the newsletter copy and import it again if you want the new calendar details. Custom newsletter edits are intentionally never overwritten automatically.

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

- `index.html` — builder interface and email generator
- `newsletter-core.js` — state validation, escaping, draft schema, and calendar mapping helpers
- `calendar-events.json` — generated public event feed used by the hosted builder
- `scripts/sync-calendar.mjs` — Google iCal synchronization script
- `test/` — Node tests for state, security, draft, and calendar behavior
- `.github/workflows/` — tests and hourly calendar synchronization
