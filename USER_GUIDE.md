# Newsletter Builder User Guide

Use the hosted [ASME at OSU Newsletter Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/) in a modern browser. Your work is saved automatically in that browser.

The top toolbar includes a **Brevo** shortcut. A **Builder** shortcut also appears when the app is embedded or opened outside the hosted builder, making it easy to open the full builder in a new tab.

Select **Guide** in the header at any time to open the in-app instructions. On phones, it sits beside **Edit** and **Preview**.

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
- **Keep in date order** is on by default and sorts events after date/time edits and imports. Turn it off to arrange events yourself; **Sort once** then orders the list without enabling automatic sorting. Moving an event with its up/down controls also turns automatic sorting off. Unrecognized placeholders such as `MON DD` remain after dated events.
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

1. Click **Export → Copy HTML for Brevo**.
2. Review the pre-send checklist and correct any warnings you can.
3. In Brevo, create a campaign and choose **Design → Code your own**.
4. Paste the copied HTML into the code editor.
5. Copy the subject line shown by the builder into Brevo.
6. Send yourself a test email and check desktop, mobile, and dark-mode appearances, links, images, mailing address, and unsubscribe link before scheduling the campaign.

Use **Export → Download .html** when someone only needs an offline preview of the finished newsletter.

## Annual calendar preview and rehearsal

Calendar → enter `2027-2028` under **Academic year (August–July)** → **Preview year**. This filters the generated snapshot by Eastern calendar date; all-day dates retain their source day. **Upcoming** returns to upcoming dates. The selected view changes this browser, not a Google calendar or the newsletter draft.

**Refresh events** loads the latest saved chapter calendar and returns from fictional practice events. Google Calendar updates are collected by the hourly job. **More options** contains the source check time and available date range. A blank year view is not proof that Google has no events outside that coverage. Hub annual settings do not change this repository's calendar source.

**Load fictional Fall/Spring** creates two labeled TEST ONLY/DO NOT SEND local fixture records for the entered year. No Google event, guest or invitation is created. **Remove fictional events** reloads the chapter calendar. Importing a fictional event explicitly adds it to your editable draft; preserve a revision/export first, remove the fictional draft event afterward and restore the original draft. Refresh events clears the fictional source. Existing organization defaults and named templates are preserved.

For real chapter entry, **Open event editor**, choose the approved chapter calendar before Save and verify the calendar selector again. For a separate private native rehearsal, choose the training calendar and keep guests empty. Reuse the approved chapter calendar for routine future years; do not publish a private calendar's secret feed. Infrastructure/feed changes require the Webmaster's reviewed receipt.

Secretary: verify the official chapter postal/mailing address under Design before saving approved organization defaults or sending. The missing-address warning remains until this is verified; no street address is supplied by this repair. Before a handoff export, load the intended Spring template and confirm subject, issue year and January event, then export JSON and HTML. Import the exact JSON into a fresh builder, edit a field, confirm HTML footer and desktop/mobile/dark previews, and restore the original draft using its revision. Local HTML is a separate check from email delivery.


## Phone and tablet workspace

Use **Edit** and **Preview** in the header to switch views. Each view keeps its scroll position, and switching never resets your draft. Choose a section from **Editing section**; content, calendar tools, templates, and setup are grouped there. On a wide desktop, the editor and preview appear side by side.

Open **Export** (the download icon on phones) for Copy HTML for Brevo or Download .html. Open **Tools** (the three-dot icon) for the ASME Hub, Check newsletter links, New Issue, and help. On phones and tablets, the issue-count button beside the section selector opens readiness checks. Organization defaults and academic-year rehearsal controls are expandable to keep routine editing focused.

Event cards start collapsed on phones and tablets. Open a card to edit it, use its up/down controls to reorder it, and open **Actions** for **Duplicate**, **Use as featured**, or **Remove**. Actions expand inside the card so they do not cover the form. **Keep in date order** and **Expand all** are directly available beneath **Add Event**. **Sort once** appears when automatic sorting is off.


The dedicated **Brevo** button and the copy dialog’s **Open Brevo** link open your campaign list in a separate tab. The copy dialog lists review items first, with passed checks collapsed. Copy the subject and paste it into Brevo, then do the same for the inbox preview. Use **Copy HTML** last and paste it into the campaign HTML editor. The dialog stays open with a persistent result message; copying another value updates that message to identify the current clipboard content. Copying does not send the newsletter. Send yourself a test before sending to members.

## Reliable editing and calendar review

- Event cards can be collapsed to a title/date/status summary. **Expand all events** opens every card; new and duplicated cards open automatically. Editing, sorting, and toggling options preserve keyboard focus.
- Every field has an associated label. Desktop section tabs support Left/Right, Home, and End. JSON import controls work with keyboard activation.
- The save indicator distinguishes unsaved changes, saving, saved, and failures. A storage failure keeps an **Export Draft** and **Retry saving** notice visible. Export a JSON backup if storage is unavailable. The builder stays open when you open Brevo.
- Draft imports assign unique event IDs, and editable exports preserve every event rather than silently truncating at 100. Backup warnings explain whether the previous-draft snapshot or only revision history could be saved.
- Weekly calendar occurrences import as separate events. Rescheduled recurring occurrences retain their original identity, and content changes can be detected even when the upstream update timestamp stays unchanged. Recurring descriptions are preserved.
- Readiness now flags missing calendar sources within verified snapshot coverage. A failed refresh or an event outside snapshot coverage is shown as unverified rather than canceled. Review the calendar, then remove the event or choose **Keep newsletter copy** to retain it as an independent authored event.
- **View Checks** uses a review-only title and close action. When copying, expand **Subject and inbox preview for Brevo** to copy those fields before the final HTML copy. The final action always restores newsletter HTML to the clipboard; copy failures are reported.

### Calendar status

Use **Refresh events** to load the latest saved calendar. The short status shows the event count, active year or Upcoming, and the calendar update time. **More options** contains the hourly update explanation, available date range, and source check time. Loading and refresh failures stay visible above the events, and practice events remain clearly marked as fictional.

### Editing shortcuts and saved issues

- In Calendar, check the events you want and choose **Import selected**. **Issue date range** limits which selected events are imported; selected events hidden by a filter are not imported. The whole import can be undone once.
- Calendar update buttons open a before/after review. Uncheck fields you want to keep as newsletter copy. Applying records the source version so kept copy does not repeatedly appear as an upstream change.
- Event **Actions → Use as featured** copies content, image, and button. The event stays in Upcoming Events. Replacing a featured event asks first and supports Undo.
- In readiness, choose **Fix** to jump to the field. Practice-content warnings persist until practice events are removed or replaced with real events.
- Use the optional **Calendar date (for sorting)** to keep the year when planning ahead. The separate display date remains editable.
- **Templates → Saved issues** supports up to 30 named local issues. **Save current issue** makes a new entry; **Update** replaces a chosen entry. Opening another issue saves a recovery point and supports Undo. These entries stay in this browser; export JSON for sharing or a separate backup.
- A previous link check is cleared when enabled destinations change. Run Check Links again after editing URLs.

### Resize the editor sidebar

In desktop split view, drag the three-dot divider between the editor and preview. Its width is saved for this browser. The editor can be 340–760 px wide, with a smaller maximum when needed to leave room for the preview. Double-click the divider to reset to 420 px.

Keyboard: focus the divider with Tab, then use Left/Right arrows (16 px), Shift+Left/Right (48 px), Home/End (minimum/maximum), or Enter (reset). Escape cancels an active drag. Compact windows retain the full-width Edit/Preview switch instead of the divider.

### Preview and tab shortcuts

The preview controls sit on the right of the email: choose Desktop/Fit width or Mobile, then toggle Email dark mode independently. These controls change only the preview. On narrow screens they use monitor, phone and moon icons.

Search Calendar by title, location or description. **Clear filters** resets both search and dates. In Events, **Expand all** becomes **Collapse all** when every card is open. Featured, Announcement and Quick Links keep their content while switched off; switch them back on to edit it.

The resize divider has a smaller grip and no measurement label. Double-click or press Enter to restore its default width.

### Simpler Calendar and phone preview

Calendar opens with search and event selection. **Select all** selects only the unimported events currently shown. Date ranges, academic-year practice and source details are under **More options**. A reset action appears when a hidden date/year filter is active.

On phones, the preview uses the available width without a device selector. Use the moon next to Edit/Preview to simulate email dark mode. Desktop keeps the device toggle and dark-mode control on the right.

The Guide is now a larger illustrated walkthrough. Its shortcuts open Calendar, starter layouts or readiness directly.

The top toolbar has Undo and Redo for the last major change (such as imports, sorting, removing content or opening another issue). These are recovery controls for major actions; text fields keep their normal editing undo. Redo clears when you make a new edit. Revision History retains older saved versions.

The inbox preview’s subject and preview-text lines are shortcuts to their Settings fields. They switch back to Edit on phones and exit Full Preview before focusing the field. Design choices show their actual colors in small samples; the selected choice has a border and checkmark. On phones, Undo/Redo share the first toolbar row; Open Brevo remains available from Export.


## Prepare the next issue and reuse event copy

- **Settings → Issue dates:** optionally save the planned send date and dates covered. Review reminders use calendar dates, not guesses from display text. Add a calendar date to manual events or Featured when you want date checks. Calendar filters change only when you explicitly choose **Use saved issue dates** under **More filters & tools**.
- **Tools → Start next issue:** review the new dates and cleanup summary, then choose **Create next issue**. Undated events stay for review. The old draft gets a recovery copy and can be restored with toolbar Undo. The featured section is cleared, and the announcement is kept switched off so you can review it before reusing it.
- **Export → Copy HTML for Brevo:** the dialog now says whether the HTML changed since your last successful copy. If it did, use **Copy updated HTML**. Copying a subject, inbox preview or event digest replaces the clipboard contents; always copy HTML last before pasting it into Brevo.
- **Tools → Copy event digest:** edit a plain-text version of the newsletter for your chat app, then copy and paste it manually. Nothing is posted, and edits in that dialog do not change the newsletter.
- A warning under an image URL may identify a sharing page. Use a direct image URL from the chapter website or Brevo’s image library, and send a test email to check rendering.

Issue dates travel with draft JSON and saved issues. Copy-history feedback stays on this browser. None of these features schedule or send a campaign.

The mailing address under Design is prefilled for ASME’s Scott Laboratory office (N147), including 201 W 19th Ave, Columbus, OH 43210. Edit it if necessary; line breaks are preserved in preview and exported email. Custom saved addresses are retained.


## Quick prefill

Open **Calendar → Auto-fill issue**, or the same action in **Tools**. Choose the start/send date; the builder picks the following 14 days, suggests a subject, and fills the newsletter date. Uncheck any events you do not want and edit the suggested text. The review warns before replacing your current event list; select **Keep other current events too** if needed. Choose **Fill issue**, then review Featured, Announcement, Links and readiness. Existing copy for matching calendar imports stays intact. Use the toolbar’s Undo to restore the previous issue in one step.

### Auto-fill and export polish

The scarlet **Auto-fill issue** button is in Calendar, Tools, and the Guide's **Start your issue** step. It opens a review; nothing is applied until you choose **Fill issue**.

Readiness flags a displayed weekday that disagrees with a known date/year, and display dates that disagree with the saved calendar date. Review the wording rather than relying on automatic correction. Ambiguous dates without a reliable year are not guessed.

Exports omit empty/title-only event descriptions and add weekday labels when a canonical date is available. Generic calendar links use **See calendar** unless you wrote a custom button label. Buttons have larger targets, contextual accessible names, and table-cell backgrounds/padding for email clients. Social links use labeled buttons without an external icon CDN.

In **Settings → Organization defaults**, optionally enable **Include Brevo's “View in browser” link**. Leave it off if your Brevo campaign already adds a mirror link. This preference can be saved with organization defaults. The exported placeholder is `{{ mirror }}` ([Brevo documentation](https://help.brevo.com/hc/en-us/articles/5316043391122-Add-a-mirror-link-to-your-emails-View-in-Browser)).

Browser previews and markup checks do not replace sending a test from Brevo to Gmail, Apple Mail, and desktop Outlook.

Quick-link cards include matching icons, and the footer GroupMe button includes the actual GroupMe mark. The export uses sharp PNG copies hosted with the builder; button labels remain visible if a mail client blocks images.

### Shared newsletter design

All layouts now use the same white action cards with scarlet icons and a scarlet first action, followed by white outlined secondary actions. Card titles, supporting text, button labels and destinations remain editable in Links. Turning Quick links off still hides the entire row.

The shared charcoal footer separates the editable chapter information from social and website links on desktop, then stacks them on phones. Social buttons retain their recognizable logos and colors. Subscription copy and the existing unsubscribe placeholder appear in a separate white strip. These components use the same HTML in the preview and export and are applied whenever an existing draft, saved issue, or built-in template is rendered. Other newsletter theme colors remain selectable.

Outlook compatibility: the light layout uses white reading surfaces and outlined secondary buttons so switching back from dark mode restores readable contrast. Explicit background fallbacks preserve the charcoal footer, colored buttons, and logo backplate while other text and surfaces adapt together. A delivered Brevo test was checked in Outlook for Mac in dark mode and after selecting View in Light Mode. Gmail, Apple Mail, and Windows Outlook still require their own delivered-message checks.

The preview control labeled Dark mode follows the observed Outlook for Mac treatment: white logo backplate, charcoal footer, dark reading surfaces, and outlined secondary actions. It is an approximation rather than a guarantee for Windows Outlook, Outlook web, or Gmail mobile. Send a real test for those clients. The full-preview close control shares the device controls’ top alignment, including while scrolling.

The mailing address is an explicitly styled Google Maps link so Gmail does not insert low-contrast blue address links into the dark footer. The address text remains editable.

Mobile preview shows the responsive email width: action cards and footer columns stack on narrow screens. Its sample inbox row now follows the same width and uses a sender avatar, sender name, subject, preview text, and sample timestamp. Blank subject/preview fields show illustrative text only; export and readiness still use your actual fields. The preview toggle is labeled Dark mode, and announcement author names remain readable when enabled.
