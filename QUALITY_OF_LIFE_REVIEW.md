# Newsletter builder quality-of-life review

Reviewed November 9, 2026 against the local builder source and existing automated tests. This is a workflow/code review; production behavior and visual layout were not inspected in a browser.

## Calendar cleanup implemented locally

- Renamed “Refresh chapter snapshot” to “Refresh events.”
- Replaced the dense status paragraph with event count, active year/Upcoming, and one update timestamp.
- Moved coverage and source-check information into a collapsed Calendar details disclosure, alongside a plain explanation of the hourly update behavior.
- Shortened rehearsal help. Kept fictional-event labels and loading/failure messages visible.
- Preserved the saved-feed architecture, explicit import/sync actions, and missing-source readiness checks.

## Recommended next improvements, in priority order

1. **Select and import several calendar events together.** `importCalendarEvent()` switches to Events and focuses the new card after every import. Selecting events in Calendar and importing once would remove repeated navigation. Skip already imported occurrences, preserve chronological sorting, save one recovery point, and report the number imported. Include a date range for the upcoming issue.
2. **Make readiness warnings take you to the field.** The checklist currently renders labels and descriptions; “Go Back & Fix” only closes it. Add a Fix action that opens the right section, expands the relevant event, and focuses its field. Start with missing subject, invalid event links, image alt text, and incomplete footer.
3. **Use an existing event as the featured event.** Featured content is entered separately from event cards, requiring title/date/location/description/button to be copied by hand. Offer “Use as featured” on event cards, with explicit confirmation when replacing current content. Define whether the event remains in Upcoming to avoid unintended repeated content. Initially make this a copy; ongoing linking requires clear override rules.
4. **Preview calendar changes before applying them.** Sync replaces title, date/time, location, description, event type, and link while preserving images. A before/after summary and a choice of fields would help officers keep newsletter-specific copy while updating the schedule. Keep one-click full sync available, with recovery.
5. **Keep multiple named issues.** There is one active browser draft, revision history, saved templates, and JSON handoff. A named draft library would make planning the next issue alongside the current one easier. Show last saved time, duplicate/rename/archive actions, and clear browser-only storage wording. Shared cloud drafts would be a separate project requiring conflict and access handling.

## Existing capabilities to retain

Autosave status and failure recovery, revision history, template and JSON handoff, date sorting, duplicate/conflict warnings, desktop/mobile/dark previews, link checking, and copy/export readiness review already exist. Improving navigation between these features is more useful than adding another checklist or backup mechanism.

## Follow-up review using three subagents

The follow-up covered code structure, workflow, and reliability. No application code was changed in this pass. Existing checks pass: 42 tests plus HTML structure and JavaScript syntax. These tests use Node/JSDOM; this pass does not establish visual or email-client compatibility.

### Refactoring worth doing before larger features

- Separate document changes from view rendering. `render()` at index.html:1402 calls `autoSave()` at :1459; view-only dark simulation at :1493 therefore schedules a draft save. Use one explicit document-change path and keep preview state separate.
- Standardize backup/Undo behavior for replacements and bulk edits. `applyPreset()` at :2039 replaces authored fields without a recovery snapshot, despite existing backup support at :1706.
- Replace handler-string parsing with explicit field/action metadata. Event IDs and accessible labels are derived by parsing inline JavaScript at :1173–1185. This makes focus preservation fragile when handlers change.
- Extract calendar, draft storage, email rendering, and editor wiring into small files, plus the existing CSS. Keep the static GitHub Pages setup. Consolidate JSDOM fixtures first so moving scripts does not require fixing every test independently.
- Introduce a persistent draft state and separate UI state incrementally. Current data is split across globals and DOM fields collected by `collectState()` at :1652. Avoid a wholesale rewrite; migrate one workflow at a time.

### Confirmed gaps to fix early

- Duplicating an imported event preserves its calendar source metadata at index.html:2013. The reliability reviewer reproduced editing that copy into a separate event, then syncing after an upstream change: both cards were overwritten from the same source. Make duplicates independent by default or explicitly offer a linked copy; add a regression test.
- Link-check results remain successful after the checked URL changes. Reproduced by checking links, changing `s-website`, and rendering: old “Reachable” results remain unchanged. `checkAllLinks()` at :2195 also lacks protection against older requests finishing after newer runs. Associate results with the checked URL set and discard obsolete responses.
- Fictional calendar events can be imported and exported without a specific rehearsal-content warning. Reproduced with the fictional Fall workshop: `getReadinessChecks()` returned no fictional/test-content warning. Add explicit rehearsal provenance and a prominent pre-send check; title matching alone is insufficient if titles are edited.
- Applying a preset overwrites title, time, location, and description without taking a backup. Use the existing recovery service and offer immediate Undo.

### Additional useful improvements

1. Store real event dates, including year, separately from display wording. Manual dates currently default to the current year in `eventDateValue()` at :1058, so preparing January alongside November can sort incorrectly. Keep custom display labels and migrate older drafts safely.
2. Expand the existing readiness checks to catch bracketed preset placeholders, enabled empty announcements, and incomplete featured details. Avoid adding another checklist panel.
3. Show image-load failures in the editor. Currently a valid-looking image URL and alt text can pass checks even when the image fails to load; preview images silently hide on error.
4. Name JSON and HTML downloads after the issue/subject and date. Current filenames at :1746 and :2321 are fixed across issues.
5. Show a short calendar freshness warning only when the source check is overdue. Use `checkedAt` when valid, and treat absent metadata separately.

### Suggested implementation sequence

1. Fix calendar-linked duplicates, stale link results, rehearsal checks, and preset recovery; add targeted regression tests.
2. Separate saving from rendering, consolidate test fixtures, and extract focused modules.
3. Add batch import, readiness Fix actions, and Use as featured.
4. Improve dates, images, filenames, and named drafts according to actual officer usage.

A framework migration, backend, real-time collaboration, and broad cosmetic rewrites are unnecessary for these improvements.

## Implementation completed locally

The four confirmed issues are fixed. Calendar duplicates detach from their source, link results invalidate and reject obsolete responses, practice provenance survives all handoffs, and presets take recovery snapshots with immediate Undo.

The focused refactor extracted styles and calendar/storage/email/editor modules, added pure readiness and link-check services, reused the Core field registry, separated preview rendering from save scheduling, introduced explicit event field/action metadata, and consolidated DOM-test asset loading. Email generation can render an explicit state snapshot without reading editor inputs.

Implemented workflow improvements: batch calendar import with issue date filtering, actionable readiness Fix buttons, Use as featured, selective before/after calendar sync, named browser-local issues, canonical dates with years, section-aware placeholder checks, actual image-load diagnostics, subject-based filenames, and overdue-calendar notices.

Verification details are recorded with the final delivery. Existing browser drafts remain readable through schema v4 migration; local browser data is not uploaded or shared.

### Final verification

`npm run check` passes all 77 tests plus external-asset, HTML structure, and JavaScript syntax checks. Local browser verification covered a two-event batch import, named-issue saving, readiness Fix navigation to the subject field, and an inclusive November date filter returning five events. The compact calendar layout was visually inspected. Browser testing exposed cached old Core code; all local JS/CSS references now share an asset version to keep releases consistent. Full email-client rendering was not tested. Changes are local and have not been published.

### Upstream baseline correction

The first implementation used local commit b84e252 and missed newer UI work on main. The current files now incorporate main at 86f3b4f258647c1792b9d3474b9fb3044892f70e: shared hub theme, bundled Inter/DM Serif Display fonts and licenses, section navigation, accessible send-readiness states, device-preview icons, and the latest generated calendar data. The new workflow features and fixes are preserved. Asset URLs were advanced to 4.0.1 to refresh the preview.

After the upstream UI merge, all 78 tests and asset/syntax checks pass. A new regression test covers readiness ARIA/state changes and preservation of device-preview icons. The refreshed local browser visibly uses the latest theme and bundled typography.
