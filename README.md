# Shilp List

[![react-list](https://img.shields.io/npm/v/@shilp.dev/react-list.svg?label=react-list)](https://www.npmjs.com/package/@shilp.dev/react-list)
[![vue-list](https://img.shields.io/npm/v/@shilp.dev/vue-list.svg?label=vue-list)](https://www.npmjs.com/package/@shilp.dev/vue-list)
[![license](https://img.shields.io/github/license/shilpdev/list)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/shilpdev/list?style=social)](https://github.com/shilpdev/list)

## Contents

- [What is Shilp List](#what-is-shilp-list)
  - [The mental model](#the-mental-model)
  - [What is in the box](#what-is-in-the-box)
- [Why you should use it](#why-you-should-use-it)
- [How it is different from AG Grid and TanStack Table](#how-it-is-different-from-ag-grid-and-tanstack-table-and-how-it-works-with-them)
  - [With TanStack Table](#with-tanstack-table)
  - [With AG Grid](#with-ag-grid)
  - [When to pick which](#when-to-pick-which)
- [How it helps AI build listing pages](#how-it-helps-ai-build-listing-pages)
  - [A prompt that works well](#a-prompt-that-works-well)
  - [Tips for teaching your AI assistant](#tips-for-teaching-your-ai-assistant)
- [Examples](#examples)

**Headless list components for React and Vue.** You write the markup. Shilp handles fetching, pagination, search, filters, sorting, selection and state persistence.

```bash
npm install @shilp.dev/react-list   # React 19+
npm install @shilp.dev/vue-list     # Vue 3.5+
```

| Package                 | Version | Peer dependency           |
| ----------------------- | ------- | ------------------------- |
| `@shilp.dev/react-list` | 0.1.0   | `react` / `react-dom` ^19 |
| `@shilp.dev/vue-list`   | 0.1.0   | `vue` ^3.5                |

Both packages expose **the same API**: same props, state keys, events, defaults and component names. Learn it once, use it in either framework.

---

## What is Shilp List

Every app has a dozen listing pages: users, orders, products, invoices. Each one needs the same plumbing:

- call an API with `page`, `perPage`, `search`, `sort` and `filters`
- track loading, empty and error states
- keep the URL, `localStorage` or the server in sync with the list state
- refetch when any of those inputs change, without races or stale responses
- selection, column visibility, "load more", refresh...

Shilp List is that plumbing, packaged as a small set of **headless components**. It renders no styles and no layout of its own. Your design system (shadcn/ui, Tailwind, MUI, plain HTML) draws every pixel.

You describe the list once:

```tsx
import {
  List,
  ListSearch,
  ListRows,
  ListEmpty,
  ListError,
  ListLoaderInitial,
  ListPagination,
  ListSummary,
} from '@shilp.dev/react-list'

async function requestHandler(state) {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.perPage),
    q: state.search,
    sort: state.sortBy,
    order: state.sortOrder,
  })
  const res = await fetch(`/api/${state.endpoint}?${params}`)
  const data = await res.json()

  return { rows: data.items, totalRows: data.total }
}

export function Users() {
  return (
    <List
      endpoint="users"
      perPage={10}
      columns={[{ name: 'name' }, { name: 'email' }]}
      requestHandler={requestHandler}
    >
      <ListSearch>
        {({ search, setSearch }) => (
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
          />
        )}
      </ListSearch>

      <ListLoaderInitial>Loading…</ListLoaderInitial>
      <ListError>Something went wrong.</ListError>
      <ListEmpty>No users found.</ListEmpty>

      <ListRows>
        {({ context }) => (
          <ul>
            {context.rows.map((user) => (
              <li key={user.id}>
                {user.name}, {user.email}
              </li>
            ))}
          </ul>
        )}
      </ListRows>

      <ListPagination />
    </List>
  )
}
```

The same list in Vue:

```vue
<script setup lang="ts">
import {
  List,
  ListRows,
  ListEmpty,
  ListError,
  ListLoaderInitial,
  ListPagination,
} from '@shilp.dev/vue-list'
import { requestHandler } from '~/api/request-handler'
</script>

<template>
  <List
    endpoint="users"
    :per-page="10"
    :columns="[{ name: 'name' }, { name: 'email' }]"
    :request-handler="requestHandler"
  >
    <ListLoaderInitial>Loading…</ListLoaderInitial>
    <ListError>Something went wrong.</ListError>
    <ListEmpty>No users found.</ListEmpty>

    <ListRows v-slot="{ context }">
      <ul>
        <li v-for="user in context.rows" :key="user.id">{{ user.name }}, {{ user.email }}</li>
      </ul>
    </ListRows>

    <ListPagination />
  </List>
</template>
```

### The mental model

```
┌───────────────────────────── <List> ──────────────────────────────┐
│  owns state: page, perPage, search, sortBy, filters, rows, ...    │
│  calls     : requestHandler(state)  →  { rows, totalRows, meta? } │
│  exposes   : context = state + actions (setPage, setFilter, ...)  │
│                                                                   │
│   <ListSearch/>  <ListFilters/>  <ListColumns/>  <ListRefresh/>   │
│   <ListLoaderInitial/>  <ListError/>  <ListEmpty/>  <ListRows/>   │
│   <ListPagination/>  <ListPerPage/>  <ListGoTo/>  <ListSummary/>  │
│   <ListLoadMore/>                                                 │
└───────────────────────────────────────────────────────────────────┘
```

- `requestHandler` is the **only** place that knows about your API. It receives a plain data snapshot of the list state and returns `{ rows, totalRows }`.
- `context` is state plus actions. Every slot component receives it, and `useListContext()` (React) / `useListContext()` (Vue) gives it to your own components.
- Change a prop (`page`, `filters`, `search`...) or call an action and the list refetches. No `useEffect` chains to write.

### What is in the box

| Concern     | What you get                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Fetching    | One `requestHandler`, race-safe, with `isLoading` / `isInitialLoading` / `error` / `isEmpty`                                        |
| Pagination  | Page links, per-page selector, go-to-page, summary ("1–10 of 240"), or `loadMore` mode                                              |
| Search      | Debounced search input slot                                                                                                         |
| Filters     | Per-column filters with `isDirty` tracking and `clearFilters`                                                                       |
| Sorting     | `sortBy` and `sortOrder` as plain state                                                                                             |
| Columns     | Show/hide columns, plus any custom keys you attach                                                                                  |
| Selection   | `selection`, `selectionState` (`none` / `partial` / `all`), toggle one or all rows                                                  |
| Persistence | `stateManager` hook (`get` / `set` / `clear`) for `localStorage`, URL, or an API                                                    |
| SSR         | `initialResponse` skips the first client request (Next.js, Nuxt)                                                                    |
| Lifecycle   | `beforePageChange`, `afterPageChange`, `beforeLoadMore`, `afterLoadMore`, `onResponse`, `onError`, `onRowSelect`, `onFiltersChange` |
| Types       | Fully typed, `.d.ts` bundled with each package                                                                                      |

---

## Why you should use it

**1. Stop rewriting the same list page.**
The fetch, loading, empty, error and pagination logic lives in one tested place. A new listing page is columns, a handler and markup.

**2. You keep full control of the UI.**
There are no CSS classes to override, no theme to fight, no "almost the design we need". Slots give you state and actions; you return whatever markup you want. It drops into any design system.

**3. One API contract for the whole app.**
Define `requestHandler` once, in one file, and every list reuses it. Authentication headers, base URLs, error mapping and response normalisation stay in one place instead of 40 components.

**4. Works with how your backend really is.**
Offset or page-based, REST or GraphQL, Directus or a custom API: `requestHandler` receives the state and you translate it. The `meta` object passes through for anything list-specific (tenant id, extra params).

**5. Predictable state.**
State uses flat keys (`page`, `isLoading`, `sortBy`). Data (`State`) is separate from behaviour (`Context`). Request-phase hooks fire in a documented order ([LIFECYCLE.md](./LIFECYCLE.md)).

**6. Remembers where the user was.**
Plug in a `stateManager` and the page, per-page, search, sort, filters and column visibility survive reloads and navigation, without touching the list code.

**7. Same API in React and Vue.**
Teams with both stacks, or a migration in progress, don't need two mental models. Known differences are tracked in [PARITY.md](./PARITY.md).

**8. Small and dependency-light.**
No UI framework, no data layer you must adopt. Just React or Vue as a peer dependency.

---

## How it is different from AG Grid and TanStack Table, and how it works with them

Short version: **they solve different problems, so you rarely have to choose.**

|                                                    | Shilp List                         | TanStack Table                   | AG Grid                            |
| -------------------------------------------------- | ---------------------------------- | -------------------------------- | ---------------------------------- |
| What it is                                         | Data-fetching and list-state layer | Headless table engine            | Full data grid with built-in UI    |
| Owns the server request                            | **Yes** (`requestHandler`)         | No, you bring the data           | Server-side row model (Enterprise) |
| Owns pagination / search / filter state            | **Yes**                            | Yes, as table state              | Yes, inside the grid               |
| Renders markup                                     | No                                 | No                               | Yes, its own grid DOM              |
| Layout                                             | Any: table, cards, feed, kanban    | Tables                           | Grid only                          |
| Cell/row features (resize, pin, group, virtualize) | No                                 | Some (via plugins and your code) | **Yes**, a lot                     |
| Persistence of list state                          | Built-in `stateManager`            | DIY                              | Grid state API                     |
| Frameworks                                         | React, Vue (same API)              | React, Vue, Solid, Svelte, ...   | React, Vue, Angular, JS            |

**Shilp List is not a grid.** It does not draw cells, resize columns or virtualize ten thousand rows. It answers a different question: _"what is the current page of data, and how do I change what's being asked for?"_ Cards, galleries, activity feeds and mobile lists have no table at all, but they still need pagination, search, and loading states. Shilp covers those and tables alike.

**TanStack Table and AG Grid are strong at the rendering side** (cell models, column pinning, grouping, virtualization). Neither wants to own your fetching, URL state and server contract for every list in your app. That is the gap Shilp fills, so use them together.

### With TanStack Table

Let Shilp own the server state and give TanStack the rows. Turn on `manualPagination` and `manualSorting`, so TanStack never tries to slice or sort what the server already did.

```tsx
import { List, ListRows, ListPagination } from '@shilp.dev/react-list'
import type { Context } from '@shilp.dev/react-list'
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
]

function UsersTable({ context }: { context: Context<User> }) {
  const table = useReactTable({
    data: context.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: context.totalRows,
    state: {
      sorting: context.sortBy ? [{ id: context.sortBy, desc: context.sortOrder === 'desc' }] : [],
      pagination: { pageIndex: context.page - 1, pageSize: context.perPage },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater([]) : updater
      context.setSortBy(next[0]?.id ?? '')
      context.setSortOrder(next[0]?.desc ? 'desc' : 'asc')
    },
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Users() {
  return (
    <List
      endpoint="users"
      columns={[{ name: 'name' }, { name: 'email' }]}
      requestHandler={requestHandler}
    >
      <ListRows>{({ context }) => <UsersTable context={context as Context<User>} />}</ListRows>
      <ListPagination />
    </List>
  )
}
```

You still get Shilp's search, filters, per-page, summary, `stateManager` and `initialResponse`, and TanStack keeps doing what it does best.

### With AG Grid

Use AG Grid for the grid UI and feed it the rows Shilp fetched. The grid shows one page at a time, and Shilp is the single source of truth for what that page is.

```tsx
import { AgGridReact } from 'ag-grid-react'
import { List, ListRows, ListPagination, ListSearch } from '@shilp.dev/react-list'

function UsersGrid({ context }) {
  return (
    <AgGridReact
      rowData={context.rows}
      columnDefs={[{ field: 'name' }, { field: 'email' }]}
      loading={context.isLoading}
      onSortChanged={(event) => {
        const sort = event.api.getColumnState().find((column) => column.sort)
        context.setSortBy(sort?.colId ?? '')
        context.setSortOrder(sort?.sort ?? '')
      }}
    />
  )
}

export function Users() {
  return (
    <List
      endpoint="users"
      columns={[{ name: 'name' }, { name: 'email' }]}
      requestHandler={requestHandler}
    >
      <ListSearch>{/* your input */}</ListSearch>
      <ListRows>{({ context }) => <UsersGrid context={context} />}</ListRows>
      <ListPagination />
    </List>
  )
}
```

This works with AG Grid's free community edition, because the grid only ever sees an array of rows. Your own pagination, search and filter controls (built from Shilp slots) sit around it in your design system. You skip the Enterprise-only server-side row model, and the server contract is the same `requestHandler` your other lists use.

### When to pick which

- **Cards, feeds, mobile lists, custom layouts:** Shilp List alone.
- **A plain table with search, filters and pagination:** Shilp List alone; render a `<table>` or your design system's `Table`.
- **A table that needs pinning, grouping, resizing or virtualization:** Shilp List for data and state, plus TanStack Table or AG Grid for rendering.
- **A spreadsheet-style editing grid:** AG Grid, with Shilp supplying the paged data if you want server-side lists elsewhere to behave the same.

---

## How it helps AI build listing pages

Coding assistants (Claude Code, Cursor, Copilot, Codex) are good at layout and weak at project-specific plumbing. Listing pages are where that shows: the AI invents its own `useEffect` fetch loop, forgets the empty state, double-fetches on filter change, or builds pagination that doesn't match the page next door.

Shilp List removes most of that surface area:

**A tiny, closed vocabulary.**
Every list page is the same recipe: `columns` + `requestHandler` + slot components. There are about a dozen components and one `Context` type. An AI that has seen one list page can write the next one, and every page in the codebase ends up looking the same.

**The hard parts are not generated.**
Debouncing, race conditions, refetch triggers, page reset on filter change, selection state, persistence: the assistant never writes them, so it cannot get them subtly wrong. It only fills in markup, which is the part it is good at.

**One fully typed contract.**
`requestHandler(state) → { rows, totalRows }` is a single function signature, and every slot scope extends the same `Context`. Types ship in the package, so an AI can read `State` and `Context` straight from `node_modules` and autocomplete real field names (`isInitialLoading`, `setFilter`, `selectionState`) instead of hallucinating them.

**Separation of data and UI.**
"Add a status filter and a bulk-select checkbox to the orders list" becomes a small, reviewable diff: one entry in `filters`, a few lines in a slot. The data layer is not touched.

**Same prompt, either framework.**
Because React and Vue share one API, a prompt, a skill or a rule file like _"build listing pages with Shilp List"_ works in both stacks.

**Reviewable output.**
Reviewers check the columns, the handler mapping and the markup. They don't need to re-audit fetch logic on every list PR.

### A prompt that works well

> Build a list page for `orders` using `@shilp.dev/react-list`.
> Reuse the existing `requestHandler` from `src/api/request-handler.ts`.
> Columns: id, customer, status, total. Add a `status` filter (pending, paid, shipped) and a search box.
> Use our `Table` and `Select` components for the markup. Show a skeleton in `ListLoaderInitial`, and handle `ListError` and `ListEmpty`.

### Tips for teaching your AI assistant

1. Put one reference list page in the repo, such as `apps/next-demo/src/app/users/page.tsx`, and point your rules at it.
2. Add a line to `AGENTS.md`, `CLAUDE.md` or `.cursor/rules`: _"Listing pages use Shilp List. Don't hand-write fetch, pagination or search state."_
3. Keep `requestHandler` in one file, so the assistant reuses it instead of writing a new fetch.

---

## Examples

Working demos live in this repo:

- [`apps/next-demo`](./apps/next-demo): Next.js, shadcn/ui, server-side `initialResponse`, `localStorage` `stateManager`
- [`apps/nuxt-demo`](./apps/nuxt-demo): the same list in Nuxt
