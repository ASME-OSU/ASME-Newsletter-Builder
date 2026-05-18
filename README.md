# ASME at OSU Newsletter Builder

A single-file HTML newsletter builder for creating ASME at OSU newsletter campaigns and copying the finished HTML into Brevo.

## How to Use

1. Open `asme-newsletter-builder (2).html` in your browser.
2. Edit the newsletter content using the left-side controls.
3. Add, remove, duplicate, or reorder events as needed.
4. Use **Templates** if you want to start from a preset newsletter layout.
5. Use **Settings** to update the logo URL, subject line, preheader, social links, and footer text.
6. Click **Copy HTML for Brevo**.
7. Review the pre-send checklist.
8. Click **Copy HTML**, then paste it into Brevo using **Code your own**.

## Main Features

- Editable featured event section
- Upcoming events list with add, duplicate, remove, and reorder controls
- Optional event images
- Optional event RSVP/link buttons
- Announcement section
- Quick links section
- Multiple color themes, including a light theme
- Built-in newsletter templates
- Brevo-ready HTML export
- Downloadable `.html` export
- Browser auto-save using `localStorage`

## Brevo Workflow

In Brevo, create or edit a campaign, go to the design step, choose **Code your own**, and paste the HTML copied from the builder. The builder includes email-safe table-based layout styles so the newsletter should work better across email clients than normal webpage HTML.

## SharePoint Workflow

Upload the HTML file to SharePoint or link to the GitHub-hosted version. Users can open the builder in their browser, make edits, and copy the finished newsletter HTML for Brevo. The builder saves drafts only in the user's current browser, not to SharePoint or GitHub automatically.

## Auto-Save

The builder auto-saves drafts to the browser's local storage. This means:

- Drafts stay available on the same computer and browser.
- Drafts do not automatically sync between people.
- Clearing browser data may delete the saved draft.
- Use templates or downloaded HTML if you need to share a version with someone else.

## Files

- `asme-newsletter-builder (2).html` - the newsletter builder app
- `sharepoint-blurb.md` - short usage text for a SharePoint page
- `README.md` - GitHub documentation

## Recommended GitHub Setup

Put `asme-newsletter-builder (2).html` and this `README.md` in the repository. If using GitHub Pages, rename the HTML file to `index.html` so the builder opens as the main page.

