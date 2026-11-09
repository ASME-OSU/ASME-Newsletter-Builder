# Newsletter sidebar audit and fixes

## Findings

1. **The control hierarchy was weak.** Navigation tabs, utility controls, status toggles and primary actions all used similarly sized, boxed buttons. The shared theme enlarged these controls consistently but did not distinguish their purpose. The sidebar also began at a fixed 390 px, leaving little room for dense tool rows.
2. **Too many independent disclosures competed for attention.** Calendar used separate disclosures for practice/year controls, source information and date filtering, while the Events list added another List options menu above per-event Actions menus.
3. **Event menus covered editing controls.** The shared `.toolbar-popover` was absolutely positioned with a high stacking level. Inside the scrollable sidebar, opening it covered the fields below and could be clipped near a pane edge.
4. **A shared CSS rule erased destructive-action styling.** `.toolbar-popover > button` set background, border and text colors with greater specificity than `.btn-danger`. Remove therefore looked like an ordinary menu action.
5. **Menu focus could interfere with destination focus.** The global click handler restored focus to a menu trigger after an action, even when the action had deliberately focused another section. That handler now checks whether the menu remains connected and whether focus is still inside it.

## Changes

- Navigation uses quiet text tabs with one strong active state; readiness is a compact status strip.
- Add/import actions retain primary emphasis. Utility actions are quieter, On toggles use success styling, and Remove has explicit destructive styling.
- Sort, auto-sort and expand controls are directly available instead of a List options dropdown.
- Calendar now has one More calendar options disclosure for source/practice tools. Its useful issue-date range is directly visible.
- Event Actions expand in normal document flow beneath a stable action row, rather than covering form fields. Changing sections closes old menus. Actions that move focus to another section keep that focus.
- A dedicated three-dot separator resizes the desktop editor. Default 420 px, minimum 340 px, maximum 760 px; the maximum also reserves at least 560 px for the preview and control rail plus the handle. The browser remembers the preferred width independently of the draft.
- Pointer capture, cancellation, keyboard adjustment and reset are supported. Compact/fullscreen layouts hide the separator. Resizing does not redraw the form or mark the newsletter dirty.

## Verification

All 83 automated tests and HTML/asset/JavaScript checks pass. New tests cover pointer resizing, saved preferences, bounds, keyboard/reset controls, cancellation, responsive/fullscreen behavior, draft isolation, section changes and focus after Use as featured.

Local browser checks confirmed actual dragging from 420 to 600 px, keyboard limits at 340 and 760 px, persistence after reload, and no horizontal overflow in either pane. At minimum width, Actions stayed inside the card, Remove retained its distinct colors, and form controls remained unobscured. Calendar has one optional disclosure. Compact view hides the divider and retains its full-width editor.

Changes are local and have not been published.

The later tab review restored the readiness checklist icon, added inactive navigation outlines, reduced the visible resize grip and removed its width readout. See TAB_REVIEW.md for the current per-tab changes and 88-test verification.
