# ASME at OSU Newsletter Builder

A static newsletter builder for creating ASME at Ohio State campaigns and copying email-safe HTML into Brevo.

**Open the builder:** [asme-osu.github.io/ASME-Newsletter-Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/)

**Officer instructions:** [Read the short user guide](USER_GUIDE.md)

## Build a newsletter

1. Open the hosted builder.
2. Import upcoming events from the **Calendar** tab or add an event manually.
3. Edit any imported event to add newsletter-specific wording, images, or buttons.
4. Customize the featured event, announcement, quick links, theme, and settings.
5. Click **Copy HTML for Brevo** and review the pre-send checklist.
6. In Brevo, choose **Design → Code your own** and paste the copied HTML.
7. Copy the subject line from the confirmation shown by the builder.

The builder auto-saves in the current browser. Drafts are not automatically shared between computers.

## Calendar importing

The **Calendar** tab lists upcoming events from the public ASME Google Calendar. Clicking **Import Event** creates a normal editable newsletter event containing the calendar title, date, time, location, description, and source link. Editing the imported copy does not change Google Calendar.

The browser reads `calendar-events.json` from the same GitHub Pages site. An hourly GitHub Actions workflow refreshes that file from the public Google iCal feed. This avoids requiring officers to sign in to Google or exposing an API key in browser code.

If an event is changed in Google Calendar after it was imported, remove the newsletter copy and import it again if you want the new calendar details. Custom newsletter edits are intentionally never overwritten automatically.

## Share an editable draft

Use **Templates → Export Draft .json** to download the entire editable issue. Another officer can use **Import Draft .json** to continue editing it. The builder keeps one automatic previous-draft backup before potentially destructive actions such as importing a draft, loading a template, or starting a new issue.

Finished `.html` exports are email previews, not editable builder projects. Share the draft JSON when collaboration is required.

## Main features

- Google Calendar event importing
- Editable featured event and upcoming event cards
- Add, duplicate, remove, and reorder events
- Optional images and event buttons
- Announcement and quick-link sections
- Built-in and user-saved templates
- Multiple email color themes
- Browser autosave and previous-draft recovery
- Versioned editable draft import/export
- Brevo-ready HTML and downloadable HTML export
- URL, placeholder, image-alt, unsubscribe, and footer checks before copying
- Responsive editor and keyboard-visible focus states

## Brevo and footer requirements

The unsubscribe field should contain exactly `{{ unsubscribe }}`. Brevo replaces that placeholder when sending.

Before sending, replace the default footer text with a verified ASME/Ohio State mailing address appropriate for the campaign. The checklist warns when the footer does not resemble a complete postal address but still allows an officer to review and proceed.

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
