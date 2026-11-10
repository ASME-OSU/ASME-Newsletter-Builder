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


## Follow-up from the expanded visual review

Implemented three focused improvements: separate theme swatches from selection styling, place phone Undo/Redo in the first toolbar row instead of a third row, and turn inbox subject/preheader text into field-specific Settings shortcuts. The phone Brevo launcher was removed from the header, with Open Brevo retained in Export. Shortcut navigation handles phone Preview and Full Preview without modifying draft content.

All 98 tests and HTML/asset/syntax checks pass. Browser checks verified both theme selections, subject/preheader focus, the two-row phone header, and no horizontal overflow at 320px. Changes are local and have not been published.


## Hub typography alignment

Switched the UI back to locally hosted Inter, matching the live ASME Officer Hub, and retained DM Serif Display for headings. The font preload and cache version were updated. Browser verification confirmed Inter loads and is used by the editor and inbox preview. All 98 tests and HTML/asset/syntax checks pass. This font change and the three preceding visual-review improvements remain local and unpublished.


## Additional officer workflows

Added optional saved issue dates and date-aware readiness checks, explicit Calendar filtering by the saved range, recoverable next-issue preparation, persistent last-successful-HTML-copy comparison, a reviewed plain-text event digest, and inline sharing-page image guidance. The workflows are isolated in `newsletter-workflows.js`. Optional fields extend the existing draft format without making older drafts unreadable; loading older drafts clears missing planning fields. Calendar imports retain an inclusive end date for multi-day planning and handoff. Free-text dates are retained for manual review rather than guessed.

Next-issue preparation requires a successful recovery copy and supports Undo/Redo. It starts from the current issue, preserves reusable branding/links, clears featured/inbox content, and retains the announcement switched off. No campaign is marked sent or sent automatically. Copy tracking changes only on successful HTML clipboard writes, survives dialog reopening, and detects edits made while copying.

All 109 tests and HTML/asset/syntax checks pass, including failure paths, legacy handoff, multi-day dates, planning filters, digest safety, image guidance, export comparison and next-issue recovery. Local browser verification covered the desktop next-issue summary, create/Undo, digest copying and phone modal layout. Changes remain local and unpublished.


## Sidebar density pass

Reduced repeated card/field gaps, navigation/readiness padding and label spacing across the editor. Mouse-driven desktop forms use 36px controls and 13px text, while phones/touch inputs retain 44px targets and 16px input text. Desktop textareas remain at least 64px. The narrow-desktop header uses a smaller single-line brand and removes the redundant Brevo launcher; its link remains in Export. Guide/Tools use accessible icon labels at the narrowest tablet breakpoint.

At a 1440×950 viewport, the same Featured sidebar measured 978px tall instead of 1236px (about 21% less), with the first field about 115px higher. At the 720px Chrome window, header height dropped from about 225px to 116px. All eight tabs were checked for horizontal overflow; phone inputs retained their original touch size. The HTML/asset/syntax checks pass. No document behavior or email rendering changed in this density pass. Changes remain local and unpublished.


## Two-week issue prefill

Added Auto-fill issue in Calendar and Tools, with a single review dialog for the start date, suggested subject, newsletter date, and checked events. The 14-day window uses chapter dates, includes overlapping multi-day events, and ignores unrelated list filters. Suggestions stay editable and user edits survive checkbox/date changes. Chapter event titles take priority over campus calendar labels when suggesting a concise subject.

Applying requires a recovery copy, preserves authored matching imports, avoids duplicates, supports keeping other current events, and fills issue-planning dates. The default replaces the event list only after the review is confirmed. Other sections are retained for manual review. Empty windows, unavailable data, practice content, coverage limits, stale draft reviews and closed-dialog load races are handled.

All 117 tests and HTML/asset/syntax checks pass. Local browser checks covered calendar placement, subject/date suggestions, choosing one event, replacing the list, one-step Undo and phone dialog layout. This change remains local and unpublished.


## Phone density follow-up

Checked all eight editor tabs at 390px and 320px, plus the prefill review at 375×667. Removed the padded outer section-picker frame on phones, shortened the header, tightened form/card spacing and collapsed event summaries, and aligned Calendar selection checkboxes beside event headings rather than on their own row. Secondary state/type controls are more compact; native form inputs remain 16px and 44px tall. Disabled Synced status buttons no longer reserve an active-button-sized row. The phone inbox preview uses less chrome while keeping both Settings shortcuts.

At 390×844, the section picker/readiness row is 44px rather than 70px, with its bottom gap reduced from 18px to 8px. Header height dropped from about 118px to 105px, and the first Calendar event moved from about 523px to 456px. The first card also became shorter. The prefill review has a compact date row, shorter explanatory text and a visible action footer on a 375×667 screen. No horizontal overflow was observed in any tab at 320px or 390px. Checkbox selection was verified through the UI; full-width email Preview was retained. The newsletter’s actual typography was not reduced.

All 117 tests and HTML/asset/syntax checks pass. Changes remain local and unpublished.

## Export and Auto-fill follow-up

Auto-fill issue is now a filled scarlet Calendar action and has a first-step Guide explanation and direct shortcut. Manual import remains secondary. Phone density changes retain 16px inputs while reducing repeated chrome and spacing.

Email output now uses table-cell button fallbacks, readable small text, canonical weekday labels, nonempty descriptions, contextual link names, explicit dimensions for bundled logos, padded preheaders and Apple detector styling. Generic calendar links are labeled honestly. Social links no longer depend on an icon CDN. Brevo mirror markup is optional, off by default, and survives draft/default handoff. Date consistency checks warn without rewriting authored copy. Delivered-message validation is recorded below.

## Shared action-card and footer redesign

Applied the supplied visual direction to reusable rendering functions in newsletter-email.js. The editor invokes the same components with local image paths, while exports use public HTTPS paths. White action cards share typography, spacing, minimum heights and full-width CTA treatment, with the first action scarlet. The charcoal footer uses organization/social columns with branded, labeled buttons and a separate light subscription strip. Narrow layouts stack both components. All fields, links, section toggles, event data, dates, messages, templates and export operations retain their existing behavior. The new regression checks verify preview/export parity, custom content, all stored theme values, unsafe input handling and subscription placeholders.

Validation: automated suite passes; desktop and 390px/320px browser layouts checked, including loaded PNGs and aligned card CTAs. Delivered Brevo tests were subsequently checked in Outlook for Mac, as recorded below. Gmail, Apple Mail and Windows Outlook remain unverified.


## Delivered Outlook verification

Outlook for Mac kept pale gray/pink backgrounds dark after switching to View in Light Mode, while restoring dark text. The light layout now uses white reading surfaces, white outlined secondary buttons, and a white subscription strip. Explicit background-color and legacy bgcolor fallbacks accompany painted surfaces. Flat inset shadows preserve dark brand surfaces and the logo backplate; adaptive reading surfaces and text remain paired, without foreground color locks.

The final delivered Brevo sample was inspected in dark mode and after switching to View in Light Mode: card text, secondary buttons, the subscription strip, charcoal footer, branded social buttons, and logo stayed readable. Test deliveries went only to allen.2906@osu.edu. The QA campaign remains an unscheduled draft with distribution recipients unset. This does not establish Gmail, Apple Mail or Windows Outlook rendering. All 124 tests and HTML/asset/JavaScript checks pass. Changes remain local and unpublished.
