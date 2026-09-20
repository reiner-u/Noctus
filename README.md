# Noctus

A Notion-inspired scheduling and database app, built to replace a partner's Notion-based academic scheduler with a purpose-built alternative, and to learn Postgres, row-level security, and a modern full-stack Next.js/Supabase setup along the way, with no prior database or auth experience going in.

At its core it's a dynamic table system: create a board, define whatever columns you actually need (text, number, date, boolean, a per-row weighted grade, or a user-defined select/dropdown with colored options), add rows, and edit cells directly or through a slide-over panel that shows one row's full set of properties at once. Boards can be grouped into folders, opened as tabs, and a Notion-style "Master Schedule" starter template is one click away from the same menu that creates a blank board. Dates show how many days until they're due, or how overdue they are, computed live rather than stored.

**Live:** [noctus-weld.vercel.app](https://noctus-weld.vercel.app/). Login is currently restricted to two allow-listed Google accounts while the app is in Google's OAuth Testing mode, so this isn't an open public demo the way a couple of my other projects are.

---

## How it works

### The data model

Rather than a fixed `assignments` table with hardcoded columns, boards are fully dynamic: `boards` → `properties` (the columns, each with a `type`) → `entries` (the rows) → `cell_values` (the actual data). `cell_values` uses seven separate nullable typed columns (`value_text`, `value_number`, `value_date`, `value_boolean`, `value_option_id`, `value_grade`, `value_weight`) rather than one generic column, so Postgres enforces real types at the database layer instead of the app trusting itself to store the right shape of data. Only the columns matching a cell's property type are ever populated; the rest stay null. A `select` property's options live in their own `property_options` table, referenced by id from `cell_values.value_option_id` rather than storing the option's label as text, so renaming an option updates everywhere it's used automatically, and deleting one just nulls out the reference instead of leaving orphaned text behind. Boards can also belong to a `folder`, one flat level, a folder never contains another folder.

### Auth and access control

Google OAuth via Supabase Auth. Every table's Row Level Security policy traces ownership back to `boards.owner_id` through joins, `properties`, `entries`, and `folders` check `boards.owner_id` directly, while `cell_values` and `property_options` go two hops deep (`cell_values` → `entries` → `boards`; `property_options` → `properties` → `boards`). Supabase's auto-expose-tables setting is intentionally disabled project-wide, so explicit `GRANT` statements are required alongside every RLS policy, a role-level permission check that Postgres evaluates *before* RLS ever runs, and a distinct failure mode from it (a missing `GRANT` produces a `42501 permission denied` even when the RLS policy itself is correct).

### The board table

Built on TanStack Table v8 (pinned explicitly; v9 is a breaking rewrite and npm will silently install it if the version isn't pinned). Columns don't use `accessorKey`, since cell data lives in a separate `cell_values` array rather than directly on the row object, so each column defines its own `accessorFn` that looks up the right typed value for that row and property.

One real bug worth remembering from building this: the `header` and `cell` render functions were originally defined as inline closures inside the `columns` memo. Since `columns` recomputes on *any* board data change (adding an entry, editing any cell, anything that triggers `revalidatePath`, not just changes to that specific column), those closures got a new function identity on every recompute. React treats a changed function identity as a different component type at that position, and remounts rather than updates it, silently wiping any in-progress local state, which was very noticeable on the per-column rename/retype UI, switching a property to `select` and adding an option before hitting save would revert the whole edit. The fix was a `ref` holding the latest data plus a `useCallback` with an empty dependency array, so the function's identity never changes even though the data it reads on each call is always current.

Sort lives in the toolbar now rather than as a per-column icon, one dropdown picking a property and a direction at once, since sorting more than one column at a time isn't something this app needs yet and a single control is simpler than juggling per-column state.

### Property types

Six now: `text`, `number`, `date`, `boolean`, `select`, `grade`. `select` needs its own `property_options` table and a dedicated options-management UI (add/remove) inside the property's rename/retype panel, not just a rendering change. Its options are colored too, each new one automatically gets the next color from the theme's own six accent colors, no manual picker needed, and the actual dropdown had to move off the native HTML `<select>` element and onto shadcn's `Select` component, since a plain `<select>` can't reliably show colored backgrounds across browsers. Changing a property's type clears every typed column on `cell_values` for that property, not just the old type's column, so switching text → number → text later doesn't resurface stale data that was never actually gone.

`grade` stores two numbers per cell, a percentage and an optional weight, and shows the weighted contribution (grade × weight ÷ 100) inline once both are filled in. Weight is genuinely optional: leaving it blank just shows the raw grade with no computed line, it never blocks entering a grade on its own. This is deliberately the small, per-row version of "weighted grades." The actual Notion template this app is modeled after also tracks a running weighted average per course, which is a cross-row sum grouped by the `Course` column, a real rollup feature, not something `grade` tries to do. `date` has the same restraint built in: instead of a general computed-property engine, `date` cells just compute and display "in N days" / "Overdue by N days" / "Due today" client-side from the stored date, which covers the actual use case without building a formula system.

### The entry panel

Clicking a board's "+" creates the row and opens a slide-over panel (shadcn's `Sheet`) showing every property for that entry stacked vertically, reusing the exact same cell input components the table uses. This is a lighter version of a "click a row to open it as its own page" pattern; a dedicated route per entry was the original plan but the panel gets the same effect with substantially less to build.

### Folders and tabs

Boards can be grouped into folders (one flat level) from a "..." menu on each board row, the same menu also handles moving a board between folders and deleting it. Multiple boards can be open as tabs at once, tracked in a hand-built React Context, the first one in this codebase, everything else that needed shared state so far had a single obvious parent to hold it in, but the sidebar (which opens tabs) and the tab bar (which displays and closes them) aren't parent and child of each other, so plain props couldn't do it. Open tabs persist in `localStorage` across a refresh, read once on mount and written back on every change, with a ref guarding the very first render so the write-effect doesn't fire before the read-effect has actually loaded anything and clobber it.

### Popup menus and the Master Schedule template

Board rows, folder rows, and the sidebar's "+" button all use the same shadcn `DropdownMenu` now instead of a scattering of separate icon buttons, closer to how Notion handles per-item actions. The "+" menu is also how the Master Schedule template gets created: a board with `Name`, `Progress`, `Course`, `Assignment Type`, and `Due Date` properties, `Progress` and `Assignment Type` pre-populated with sensible colored options, structure only, no sample rows. Since it's just a menu item rather than something tied to account signup, it works the same way for an existing user or a brand new one, no "is this their first login" detection needed anywhere.

### Error handling

Every action call from a client component now awaits its Server Action and catches failures instead of firing it and moving on. Two real bugs came out of actually doing this properly, not just the general hardening: `deleteBoard` calls Next's `redirect()` when you delete the board you're currently viewing, which works by throwing a special error that Next's own framework needs to catch to navigate, so the calling code has to re-throw that specific error untouched (`unstable_rethrow`) before treating anything else as a real failure. And `window.alert()` steals focus when it opens, which fires a native blur on whatever was focused, with no related target since focus went to the browser's dialog rather than another element on the page. In the property rename/retype panel, that blur was read as "clicked away," which re-ran the save, which failed again, which alerted again, several OKs for one click. Fixed with a ref that blocks the panel's blur handler from starting a new save while one, including the alert from a failed one, is already in flight.

---

## Project structure

```
src/
  app/
    (app)/
      layout.tsx              : shared shell, fetches boards + folders for the sidebar, wraps everything in the tabs Context
      page.tsx                : empty/landing state
      board/[boardId]/page.tsx: fetches one board's full data, renders header + toolbar + table
    auth/callback/route.ts    : OAuth callback handler
    login/page.tsx            : Google sign-in
  components/
    board-header.tsx          : editable title + description, click-in-place, autosave on blur
    board-toolbar.tsx         : filter toggle, sort dropdown, add property, add entry, delete board
    board-table.tsx           : TanStack Table wiring, columns, sorting, filtering, the table itself
    property-header.tsx       : per-column rename/retype, delete, select-option management
    entry-panel.tsx           : slide-over showing one entry's properties vertically
    sidebar.tsx                : board list grouped by folder, collapse toggle, the "+" creation menu, sign-out
    folder-row.tsx            : per-folder rename + "..." menu (new board, delete)
    tabs-context.tsx          : the open-tabs Context, shared between the sidebar and the tab bar
    tab-bar.tsx               : renders open tabs, handles closing and picking where to go next
    cell-inputs/
      text-cell.tsx / number-cell.tsx / date-cell.tsx / boolean-cell.tsx / select-cell.tsx / grade-cell.tsx
  lib/
    actions/boards.ts         : every Server Action, CRUD for boards, folders, properties, options, entries, cell values
    queries/boards.ts         : read queries, getBoards, getFolders, getBoard (joins everything a board view needs)
    option-colors.ts          : the theme's six accent colors, used for select options
    supabase/                 : client.ts, server.ts, proxy.ts (browser/server/middleware Supabase clients)
    types.ts                  : Board, Folder, Property, PropertyOption, BoardEntry, CellValue, BoardView
```

---

## Running it

```bash
npm install --include=dev
```

The `--include=dev` isn't optional boilerplate here: `NODE_ENV=production` set persistently in the shell environment makes npm skip devDependencies by default, which silently breaks the TypeScript toolchain (`@types/node` goes missing) without an obvious error pointing at the cause.

```bash
npm run dev
```

Needs a `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pointing at a Supabase project with the schema described above (boards, properties, property_options, entries, cell_values, folders), plus a Google OAuth client registered in Google Cloud Console with both `http://localhost:3000` and the deployed URL as authorized origins.

---

## What this project taught me

Coming in with no prior Postgres, auth, or database experience, this was the first time I had to reason seriously about a layered permission model: RLS policies and table-level `GRANT`s are separate, independently-enforced checks, and a bug in one looks completely different from a bug in the other. Wiring up Google as an OAuth provider meant understanding the full trust chain between two independent systems, Google Cloud IAM and Supabase Auth, connected only by a matched callback URL and a shared client secret.

The header/cell remount bug (above) was the clearest lesson in how React's reconciliation decides between updating a component and replacing it: it comes down to reference identity of the function/type at a given position in the tree, not whether the rendered output looks the same. It's the kind of bug that "should" be rare but falls right out of a very natural way to write inline render functions inside a `useMemo`.

Server Actions and `revalidatePath` also took some getting used to: mutations are just async functions that can be called directly from a Client Component's `onClick`, or bound to a `<form>`'s `action` when the invoking component has no other reason to be a Client Component, and either way, `redirect()` inside one works via a thrown special-cased error that Next.js's rendering machinery catches, regardless of which of those two ways it was called.

The `alert()`-triggers-blur bug (above) was a good reminder that browser-native APIs have side effects that aren't obvious from their name. Nothing about calling `alert()` looks like it should move focus around, but a modal dialog stealing OS-level focus is exactly the kind of thing that only shows up once error handling actually starts running in a UI that's watching for blur events.

---

## Known limitations / What's next

- The `select` property type's filter still matches against the raw option id, not its label, so typing an option's name into the filter box won't find anything yet. Sorting works correctly, filtering by label is the gap.
- No filter row for the `grade` type yet, sorting by grade works, filtering doesn't have a control built for it.
- No per-course weighted grade rollup, only the per-row contribution described above. A running total grouped by `Course` is a real, separate feature, not an extension of what's there now.
- No colour-coding for date urgency yet (overdue vs. due soon vs. comfortably ahead), deliberately deferred as its own visual pass.
- No undo, copy/paste, cut/paste, or move, for cells, rows, or whole boards. Deletes cascade at the database level, so a real undo would need to capture cascaded child data (a property's options and every cell value under it) before it's gone, not just after, this is a meaningfully bigger feature than it first looks like.
- "Board" vs. "page" terminology is still an open, undecided naming question, worth settling deliberately rather than assuming which one it should be.
- A native iOS app is planned as a fully separate future project, not a web port, specifically to get push notifications, which the web app can't do.
- A generalized block-editor page type (a page that could be a table, or a doc, or something else) is deliberately deferred.
- No real screenshot in this README yet.
