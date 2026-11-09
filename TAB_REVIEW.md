# Newsletter builder tab review

Reviewed and refined all eight tabs against the current working copy, including the latest upstream ASME theme.

## Visual changes requested

- Reduced the visible three-dot grip from 22 × 54 to 14 × 32, while retaining the full-height drag area, keyboard support and saved width.
- Removed the visible width readout. Assistive technology receives a plain narrow/balanced/wide description.
- Outlined inactive section buttons; the active section keeps its filled selected state.
- Removed the readiness accent stripe and restored the clipboard/check icon with a normal outline around the status card.
- Moved the existing Desktop/Mobile segmented toggle and independent email dark-mode toggle to a sticky right rail. This frees the row above the email. On compact screens the same controls use labelled icons. The rail does not overlay the newsletter.

## Tab-by-tab improvements

| Tab | Finding | Applied improvement |
| --- | --- | --- |
| Events | Expand all had no matching way to close the resulting long form. | The same control switches between Expand all and Collapse all, without modifying the draft. |
| Calendar | A long list required scanning even when the officer knew the event name or location. | Added search across title, location and description. Clear filters resets search and date filters together; hidden selections are not imported. |
| Featured | Re-entering an existing event was still tempting, and fields looked editable while the section was off. | Added a Choose from Events shortcut; disabled fields retain their content when off. RSVP fields hide when that button is off. |
| Announcement | The off state still exposed editable content, and an empty optional author produced a stray attribution line. | Retained-but-disabled content when off, a clearer optional author label, and clean omission of blank attribution in both preview and export. |
| Links | Repeated Link 1/2/3 headings made it harder to locate the right destination. | Headers now include each link’s title. Switching the section off disables its fields without losing saved links. |
| Design | Width choices exposed implementation numbers and footer guidance read like internal instructions. | Standard/Balanced/Wide width labels, a clear Email footer group, and plain mailing-address guidance. |
| Settings | Clear Saved Draft removed storage but left the current form and pending autosave able to recreate it. | Replaced this confusing action with the existing Start a new issue flow, which confirms and creates a recovery point. |
| Templates | Generic Load/Save labels blurred the difference between layouts, reusable templates and named issues; long saved names were clipped by action buttons. | Use layout / Use template / Save template labels; quieter starter actions; readable full issue names with actions on a separate row. |

## Validation

All 88 tests pass, together with HTML, local-asset and JavaScript syntax checks. New behavioral coverage verifies retained disabled content, preview-toggle independence from saving, Calendar search and clearing, two-way event expansion, and optional attribution.

All eight tabs were inspected in the local browser with no horizontal overflow at the normal sidebar width. The updated preview was also checked in compact mode: the rail uses a narrow icon strip, device/dark toggles retain accessible labels, and the preview does not overflow horizontally.

Changes are local and have not been published.

## Calendar, phone and guide follow-up

Calendar now defaults to search, a Select all checkbox, Import selected and the event list. Date filters and uncommon tools are in More options. Select all reflects mixed/checked states, skips imported events and affects only the visible results. Clearing active filters also resets academic-year filtering.

Phones use a full-width preview, with the dark-mode moon beside Edit/Preview; there is no redundant phone/desktop selector. The desktop rail remains. The divider avoids a permanently reserved scrollbar gutter and compensates for the measured scrollbar width when a browser reserves one, keeping its grip and hover line aligned.

The enlarged Guide uses six illustrated step cards, an original SVG workflow graphic, more readable type and direct navigation shortcuts.

All 92 automated tests and asset/syntax checks pass. Browser verification covered phone preview width, the mobile dark control, desktop Calendar search/Select all, guide shortcuts and both guide layouts. The grip aligned with the measured divider/scrollbar lane. Changes remain local.

## Typography and control polish

The editor, section labels, form controls and inbox preview now use locally hosted Manrope. Older Arial overrides were removed from the interface; email content keeps its selected email typography. The font loads without an external font service.

The resize grip shifts slightly on hover, with only the divider bar highlighted. Calendar commands share an outlined treatment, and the disclosure reads “More filters & tools.” The Guide has a book icon and slightly smaller text. Tools groups occasional issue actions separately from related tools.

All 92 tests and HTML/asset/syntax checks pass. Desktop and phone browser checks confirmed font loading, matching Calendar commands, readable Tools groups and the revised Guide.


## Brevo export handoff

The copy dialog leads with review items and collapses passed checks. Fix buttons retain their original field destinations. Subject and inbox preview are numbered before the HTML copy action; each clipboard result identifies what was copied and tells users to copy HTML last. Empty metadata cannot be copied.

Copy HTML keeps the dialog open with a persistent, accessible success or failure message. Open Brevo is a separate link to a new tab, preserving the builder. The old temporary subject toast and combined copy/navigation action were removed. One scrolling body keeps the footer actions and result visible on phones.

All 96 tests and HTML/asset/syntax checks pass. Clipboard success/failure, metadata replacing HTML, Fix routing, new-tab link behavior, and readiness-only mode are covered. Phone and desktop layouts were verified in the local browser. Changes remain local and unpublished.
