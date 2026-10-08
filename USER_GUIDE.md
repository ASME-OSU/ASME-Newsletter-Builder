# Newsletter Builder User Guide

Use the hosted [ASME at OSU Newsletter Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/) in a modern browser. Your work is saved automatically in that browser.

The top toolbar includes a **Brevo** shortcut. A **Builder** shortcut also appears when the app is embedded or opened outside the hosted builder, making it easy to open the full builder in a new tab.

Select the circular **i** above the section tabs at any time to open the in-app instructions.

## 1. Set organization defaults (first-time setup)

Confirm quick-link destinations under **Links**, the footer under **Design**, and the dark/light logos, website, Instagram, LinkedIn, and GroupMe under **Settings**. The official GroupMe defaults to [groupme.com/join_group/95825283/iaBgk5Ld](https://groupme.com/join_group/95825283/iaBgk5Ld).

- Select **Save as Defaults** after making an approved organization-wide change. Every new issue on this browser will start with those values.
- Select **Restore ASME Defaults** to return the branding, standard links, and GroupMe to the values supplied with the builder.
- Defaults are stored only in the current browser. Export an editable draft if another officer needs the same issue on another computer.

## 2. Start an issue

- Click **New Issue** for a blank newsletter, or open **Templates** and load a built-in layout.
- In **Settings**, enter the email subject and preheader text. Aim for no more than 65 subject characters and 100 preheader characters; the counters warn when either becomes long.
- Keep the unsubscribe variable exactly as `{{ unsubscribe }}`.

## 3. Add and organize events

- Open **Calendar** and click **Import Event** beside each event you want to include.
- Return to **Events** to edit the imported title, date, time, location, description, image, or button. These edits do not change Google Calendar.
- Use **+ Add Event** for an item that is not on the calendar. Events can also be reordered, duplicated, or removed.
- **Auto-sort** is on by default and sorts events when a date or time edit is finished. Select **Sort by date** at any time for a manual sort. Unrecognized placeholders such as `MON DD` remain after dated events.
- A **Possible duplicate** badge appears when two events have the same normalized title and date. A **Schedule conflict** badge appears when events have the same date and start-time text. Review these warnings; legitimate simultaneous events can stay.

If the calendar does not load, click **Refresh Events** or **Open Calendar**. The rest of the builder remains usable.

## 4. Customize and preview the newsletter

- **Featured** controls the main highlighted event.
- **Announce** adds or hides a message from the board.
- **Links** manages the three quick-link cards.
- **Design** switches between the recommended **Light** appearance and **Navy Dark**, sets the email width (600, 680, or 760 px), and updates the issue bar and mailing-address footer. The default is 680 px. The selected width is a desktop maximum; the email adapts to narrow screens.
- The builder automatically uses the white-text logo for dark themes and the black-text logo for the **Light** theme. Both URLs can be changed in **Settings** when needed.
- **Settings** starts with the organization website, Instagram, LinkedIn, and GroupMe links filled in. Update or clear any social link when an issue needs different destinations.
- Watch **Live readiness** while editing. Select **View Checks** for details; it checks missing/placeholder content, subject and preheader length, URLs, image alt text, event duplicates/conflicts, the unsubscribe variable, and the mailing-address footer.
- The inbox card shows how the sender, subject, and preheader will scan in a message list.
- Switch the preview between **Desktop** and **Mobile**. **Email dark mode** approximates a common automatic color conversion without changing the selected newsletter design or exported HTML. Email clients vary, so still send a real test.
- The sun/moon button in the top bar switches the builder between light and dark editor modes. Your choice is saved in this browser and does not change the email or its dark-mode preview.
- Use **Full Preview** for a final visual review.

Use complete `https://` links. Every enabled image should have a public image URL and useful alt text.

## 5. Check links

Select **Check Links** in the live-readiness card. The checker includes enabled website/social links, the featured button, quick links, and event buttons.

- **Reachable** means the destination answered successfully.
- **Redirects to…** means the link works but lands at a different URL; update it if the destination is unexpected.
- **Returned HTTP…** or **Invalid URL** needs attention.
- **Could not verify from this browser** commonly means the destination blocks browser-based checks. Open it manually; it is not automatically considered broken.

## 6. Save, recover, or share editable work

The current issue auto-saves only in the browser and computer being used. To hand it to another officer:

1. Open **Templates** and click **Export Draft .json**.
2. Send the JSON file to the other officer.
3. They can choose **Import Draft .json** to continue editing.

Use **Undo Last Major Change** for the most recent backup. For more choices, use **Templates → Revision History**, which keeps up to 20 snapshots made before major changes. Restoring one first records the current draft as another revision.

A downloaded `.html` file is a preview, not an editable draft. Browser autosave, templates, revision history, preferences, and organization defaults can all be lost if site data is cleared, so export important drafts.

## 7. Send through Brevo

1. Click **Copy HTML for Brevo**.
2. Review the pre-send checklist and correct any warnings you can.
3. In Brevo, create a campaign and choose **Design → Code your own**.
4. Paste the copied HTML into the code editor.
5. Copy the subject line shown by the builder into Brevo.
6. Send yourself a test email and check desktop, mobile, and dark-mode appearances, links, images, mailing address, and unsubscribe link before scheduling the campaign.

Use **Download .html** when someone only needs an offline preview of the finished newsletter.

## Annual calendar preview and rehearsal

Calendar → enter `2027-2028` under **Academic year (August–July)** → **Preview year**. This filters the generated snapshot by Eastern calendar date; all-day dates retain their source day. **Upcoming** returns to upcoming dates. The selected view changes this browser, not a Google calendar or the newsletter draft.

**Refresh chapter snapshot** reads `calendar-events.json` again and returns from a fictional source to the chapter snapshot. It does not fetch Google live. The hourly `sync-calendar.yml` job reads the public chapter iCal feed; status reports when JSON was generated/read, its source check time when available and date coverage. A blank year view is not proof that Google has no events outside that coverage. Hub annual settings do not change this repository's calendar source.

**Load fictional Fall/Spring** creates two labeled TEST ONLY/DO NOT SEND local fixture records for the entered year. No Google event, guest or invitation is created. **Remove fictional events** verifies the empty local source. Importing a fictional event explicitly adds it to your editable draft; preserve a revision/export first, remove the fictional draft event afterward and restore the original draft. Refresh chapter snapshot clears the fictional source. Existing organization defaults and named templates are preserved.

For real chapter entry, **Open event editor**, choose the approved chapter calendar before Save and verify the calendar selector again. For a separate private native rehearsal, choose the training calendar and keep guests empty. Reuse the approved chapter calendar for routine future years; do not publish a private calendar's secret feed. Infrastructure/feed changes require the Webmaster's reviewed receipt.

Secretary: verify the official chapter postal/mailing address under Design before saving approved organization defaults or sending. The missing-address warning remains until this is verified; no street address is supplied by this repair. Before a handoff export, load the intended Spring template and confirm subject, issue year and January event, then export JSON and HTML. Import the exact JSON into a fresh builder, edit a field, confirm HTML footer and desktop/mobile/dark previews, and restore the original draft using its revision. Local HTML is a separate check from email delivery.
