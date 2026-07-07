## Goal

Make it obvious when a search matches on **dog names** by giving the Handlers page a second, simpler view that puts handler + dogs front and centre — without the class matrix getting in the way.

## What changes

### 1. View toggle on `/handlers`
- Add a small `Matrix | List` toggle beside the search bar (in `HandlerSearchBar` or in `Handlers.tsx` header area).
- Default = **Matrix** (current `HandlerTable`) — no change to existing admin workflow.
- Selection persists in `localStorage` (`handlers-view-mode`) so Ady's choice sticks.

### 2. New Compact List view
New component `HandlerCompactList.tsx` rendered in place of `HandlerTable` when list mode is active.

Each row shows (one line, wraps on mobile):

```text
[Avatar]  Jane Smith                    jane@x.com · 082 123 4567    [Notes] [Actions]
          Dogs: Rex (Labrador) · Bella (Poodle) · Max (Boxer)
```

- Handler name links to `/handlers/:id` (same as matrix).
- Dogs rendered as chips/inline text, comma or dot-separated.
- Keep the notes sticky-note icon and `ActionMenu` on the right.
- Reuse the same `handlers` array from `useHandlersData` — no new query, no business-logic changes.
- Pagination: reuse `TablePagination` with same `itemsPerPage`.

### 3. Search-match highlighting
- When `searchQuery` is non-empty, wrap the matching substring in **both** handler name and dog name with `<mark class="bg-yellow-200 rounded px-0.5">`.
- Case-insensitive, applied via a small helper `highlightMatch(text, query)`.
- Applies in **both** views (compact list and existing matrix name/dog cells) so a dog hit is visible in either.

### 4. Card header label
- Update the `Handlers` page card title so when list view is active it reads `Handlers List` instead of `All Handlers (A-C)` etc., to reinforce the mode.

## Out of scope

- No changes to filters, alphabet pagination, data fetching, or class-status logic.
- No dog-centric (one-row-per-dog) view.
- No changes to mobile handler card in class-handlers.

## Technical notes

- Files touched:
  - `src/pages/Handlers.tsx` — add view-mode state + toggle + conditional render.
  - `src/components/handlers/HandlerCompactList.tsx` — **new**.
  - `src/components/handlers/HandlerCompactRow.tsx` — **new** (row for the list).
  - `src/components/handlers/utils/highlightMatch.tsx` — **new** small helper.
  - `src/components/handlers/table/HandlerTableRow.tsx` — apply `highlightMatch` to handler name; pass `searchQuery` through from `HandlerTable` → row.
  - `src/components/handlers/HandlerTable.tsx` — thread `searchQuery` to row.
- Toggle uses shadcn `ToggleGroup` (`Rows` / `List` icons from lucide).
- No new DB queries, no schema changes, no edge functions.
