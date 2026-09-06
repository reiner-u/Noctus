# Noctus

A Notion-inspired scheduling and database app, built to replace a partner's Notion-based academic scheduler with a purpose-built alternative, and to learn Postgres, row-level security, and a modern full-stack Next.js/Supabase setup along the way, with no prior database or auth experience going in.

At its core it's a dynamic table system: create a board, define whatever columns you actually need (text, number, date, boolean, or a user-defined select/dropdown), add rows, and edit cells directly or through a slide-over panel that shows one row's full set of properties at once. Dates show how many days until they're due, or how overdue they are, computed live rather than stored.

**Live:** [noctus-weld.vercel.app](https://noctus-weld.vercel.app/). Login is currently restricted to two allow-listed Google accounts while the app is in Google's OAuth Testing mode, so this isn't an open public demo the way a couple of my other projects are.

---

## How it works

### The data model

Rather than a fixed `assignments` table with hardcoded columns, boards are fully dynamic: `boards` → `properties` (the columns, each with a `type`) → `entries` (the rows) → `cell_values` (the actual data). `cell_values` uses five separate nullable typed columns (`value_text`, `value_number`, `value_date`, `value_boolean`, `value_option_id`) rather than one generic column, so Postgres enforces real types at the database layer instead of the app trusting itself to store the right shape of data. Only the column matching a cell's property type is ever populated; the rest stay null. A `select` property's options live in their own `property_options` table, referenced by id from `cell_values.value_option_id` rather than storing the option's label as text, so renaming an option updates everywhere it's used automatically, and deleting one just nulls out the reference instead of leaving orphaned text behind.

### Auth and access control

Google OAuth via Supabase Auth. Every table's Row Level Security policy traces ownership back to `boards.owner_id` through joins, `properties` and `entries` check `boards.owner_id` directly, while `cell_values` and `property_options` go two hops deep (`cell_values` → `entries` → `boards`; `property_options` → `properties` → `boards`). Supabase's auto-expose-tables setting is intentionally disabled project-wide, so explicit `GRANT` statements are required alongside every RLS policy, a role-level permission check that Postgres evaluates *before* RLS ever runs, and a distinct failure mode from it (a missing `GRANT` produces a `42501 permission denied` even when the RLS policy itself is correct).

### The board table

Built on TanStack Table v8 (pinned explicitly; v9 is a breaking rewrite and npm will silently install it if the version isn't pinned). Columns don't use `accessorKey`, since cell data lives in a separate `cell_values` array rather than directly on the row object, so each column defines its own `accessorFn` that looks up the right typed value for that row and property.

One real bug worth remembering from building this: the `header` and `cell` render functions were originally defined as inline closures inside the `columns` memo. Since `columns` recomputes on *any* board data change (adding an entry, editing any cell, anything that triggers `revalidatePath`, not just changes to that specific column), those closures got a new function identity on every recompute. React treats a changed function identity as a different component type at that position, and remounts rather than updates it, silently wiping any in-progress local state, which was very noticeable on the per-column rename/retype UI, switching a property to `select` and adding an option before hitting save would revert the whole edit. The fix was a `ref` holding the latest data plus a `useCallback` with an empty dependency array, so the function's identity never changes even though the data it reads on each call is always current.

### Property types

Five so far: `text`, `number`, `date`, `boolean`, `select`. `select` is the most involved, it needs its own `property_options` table and a dedicated options-management UI (add/remove) inside the property's rename/retype panel, not just a rendering change. Changing a property's type clears every typed column on `cell_values` for that property, not just the old type's column, so switching text → number → text later doesn't resurface stale data that was never actually gone.

`date` deliberately does *not* try to replicate Notion's formula columns (the actual "Master Schedule" template this app is modeled after leans heavily on Notion formulas for things like days-until-due and weighted grades). Instead of building a general computed-property engine, `date` cells just compute and display "in N days" / "Overdue by N days" / "Due today" client-side from the stored date, which covers the actual use case without the complexity of a real formula system.

### The entry panel

Clicking a board's "+" creates the row and opens a slide-over panel (shadcn's `Sheet`) showing every property for that entry stacked vertically, reusing the exact same cell input components the table uses. This is a lighter version of a "click a row to open it as its own page" pattern; a dedicated route per entry was the original plan but the panel gets the same effect with substantially less to build.

---

## Project structure

```
src/
  app/
    (app)/
      layout.tsx              : shared shell, fetches the board list for the sidebar
      page.tsx                : empty/landing state
      board/[boardId]/page.tsx: fetches one board's full data, renders header + toolbar + table
    auth/callback/route.ts    : OAuth callback handler
    login/page.tsx            : Google sign-in
  components/
    board-header.tsx          : editable title + description, click-in-place, autosave on blur
    board-toolbar.tsx         : filter toggle, add property, add entry, delete board
    board-table.tsx           : TanStack Table wiring, columns, sorting, filtering, the table itself
    property-header.tsx       : per-column rename/retype, sort icon, delete, select-option management
    entry-panel.tsx           : slide-over showing one entry's properties vertically
    sidebar.tsx               : board list, collapse toggle, sign-out
    delete-board-button.tsx   : client-side confirm + delete, used from the sidebar
    cell-inputs/
      text-cell.tsx / number-cell.tsx / date-cell.tsx / boolean-cell.tsx / select-cell.tsx
  lib/
    actions/boards.ts         : every Server Action, CRUD for boards, properties, options, entries, cell values
    queries/boards.ts         : read queries, getBoards, getBoard (joins everything a board view needs)
    supabase/                 : client.ts, server.ts, proxy.ts (browser/server/middleware Supabase clients)
    types.ts                  : Board, Property, PropertyOption, BoardEntry, CellValue, BoardView
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

Needs a `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pointing at a Supabase project with the schema described in the planning docs below, plus a Google OAuth client registered in Google Cloud Console with both `http://localhost:3000` and the deployed URL as authorized origins.

---

## What this project taught me

Coming in with no prior Postgres, auth, or database experience, this was the first time I had to reason seriously about a layered permission model: RLS policies and table-level `GRANT`s are separate, independently-enforced checks, and a bug in one looks completely different from a bug in the other. Wiring up Google as an OAuth provider meant understanding the full trust chain between two independent systems, Google Cloud IAM and Supabase Auth, connected only by a matched callback URL and a shared client secret.

The header/cell remount bug (above) was the clearest lesson in how React's reconciliation decides between updating a component and replacing it: it comes down to reference identity of the function/type at a given position in the tree, not whether the rendered output looks the same. It's the kind of bug that "should" be rare but falls right out of a very natural way to write inline render functions inside a `useMemo`.

Server Actions and `revalidatePath` also took some getting used to: mutations are just async functions that can be called directly from a Client Component's `onClick`, or bound to a `<form>`'s `action` when the invoking component has no other reason to be a Client Component, and either way, `redirect()` inside one works via a thrown special-cased error that Next.js's rendering machinery catches, regardless of which of those two ways it was called.

---

## Known limitations / What's next

- The `select` property type's filter currently matches against the raw option id, not its label, so typing an option's name into the filter box won't find anything yet. Sorting works correctly, filtering by label is the gap.
- No colour-coding yet for `select` options or date urgency, deliberately deferred as its own visual pass rather than bundled into either feature.
- No undo, copy/paste, cut/paste, or move, for cells, rows, or whole boards. Deletes cascade at the database level, so a real undo would need to capture cascaded child data (a property's options and every cell value under it) before it's gone, not just after, this is a meaningfully bigger feature than it first looks like.
- "Board" vs. "page" terminology is still an open, undecided naming question, worth settling deliberately rather than assuming which one it should be.
- A native iOS app is planned as a fully separate future project, not a web port, specifically to get push notifications, which the web app can't do.
- Sidebar folder/grouping for boards, multiple open tabs, and a generalized block-editor page type (a page that could be a table, or a doc, or something else) are all deliberately deferred, tracked in the planning docs below.
- No real screenshot in this README yet, added once the current toolbar/header redesign settles.

---

## Documentation

`noctus-toolbar-redesign-plan.md` lives in the repo root and tracks the board header/toolbar layout decisions in more detail than this README does. The original schema plan, the phases-part-2 backlog, and the infrastructure log referenced throughout this README exist as separate reference documents, not as files in this repo.
