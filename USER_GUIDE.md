# Newsletter Builder User Guide

Use the hosted [ASME at OSU Newsletter Builder](https://asme-osu.github.io/ASME-Newsletter-Builder/) in a modern browser. Your work is saved automatically in that browser.

The top toolbar includes a **Brevo** shortcut. A **Builder** shortcut also appears when the app is embedded or opened outside the hosted builder, making it easy to open the full builder in a new tab.

## 1. Start an issue

- Click **New Issue** for a blank newsletter, or open **Templates** and load a built-in layout.
- In **Settings**, enter the email subject and preheader text.
- Keep the unsubscribe variable exactly as `{{ unsubscribe }}`.

## 2. Add events

- Open **Calendar** and click **Import Event** beside each event you want to include.
- Return to **Events** to edit the imported title, date, time, location, description, image, or button. These edits do not change Google Calendar.
- Use **+ Add Event** for an item that is not on the calendar. Events can also be reordered, duplicated, or removed.

If the calendar does not load, click **Refresh Events** or **Open Calendar**. The rest of the builder remains usable.

## 3. Customize the newsletter

- **Featured** controls the main highlighted event.
- **Announce** adds or hides a message from the board.
- **Links** manages the three quick-link cards.
- **Design** selects the color theme and updates the issue bar and mailing-address footer.
- When using the **Light** theme, add the optional **Light Theme Logo URL** in **Settings** if the regular logo was designed for a dark background.
- Watch the **Live Preview** while editing; use **Full Preview** for a final visual review.

Use complete `https://` links. Every enabled image should have a public image URL and useful alt text.

## 4. Save or share editable work

The current issue auto-saves only in the browser and computer being used. To hand it to another officer:

1. Open **Templates** and click **Export Draft .json**.
2. Send the JSON file to the other officer.
3. They can choose **Import Draft .json** to continue editing.

Use **Restore Previous Draft** if a recent import, template load, or new issue replaced work. A downloaded `.html` file is a preview, not an editable draft.

## 5. Send through Brevo

1. Click **Copy HTML for Brevo**.
2. Review the pre-send checklist and correct any warnings you can.
3. In Brevo, create a campaign and choose **Design → Code your own**.
4. Paste the copied HTML into the code editor.
5. Copy the subject line shown by the builder into Brevo.
6. Send yourself a test email and check the desktop and mobile layouts, links, images, mailing address, and unsubscribe link before scheduling the campaign.

Use **Download .html** when someone only needs an offline preview of the finished newsletter.
