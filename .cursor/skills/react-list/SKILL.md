---
name: react-list
description: >-
  Implements and integrates @shilp.dev/react-list (List, ListRows,
  ListPagination, requestHandler, updateRowById). Use when building React
  lists, tables, pagination, search, load-more, or when the user mentions
  @shilp.dev/react-list or List.
---

# @shilp.dev/react-list

Headless React list: fetch, paginate, search, filter, sort. You own the UI via slot children.

Package: `@shilp.dev/react-list` (v1.1). All types ship with the package - import them from `@shilp.dev/react-list`.

Peers: `react` and `react-dom` `^19`. Do not import `@shilp.dev/vue-list`.

## Rules

1. Wrap all list slots in `<List>`. Slots use `useListContext()` and throw outside it.
2. Always pass `requestHandler`. Missing it throws.
3. Return `{ rows, count, meta? }` from `requestHandler`. Map your API into that shape.
4. Drive extra filters from parent state via `filters` and `onFiltersChange` (pass the state setter). `onFiltersChange` also runs when `stateManager` restores filters. Do not call `setFilters` from a local form unless that form lives inside the list tree.
5. Patch one row with `updateRowById(partial, id)` after a successful row API. Do not `refresh()` for a single-field edit. Rows need an `id`.
6. Use `paginationMode="loadMore"` with `ListLoadMore`, or default `"pagination"` with `ListPagination`. Do not mix both as the primary pager.

## Setup

```tsx
import List, {
  ListEmpty,
  ListError,
  ListLoaderInitial,
  ListLoader,
  ListPagination,
  ListRows,
  ListSearch,
} from '@shilp.dev/react-list'
import type { RequestHandler } from '@shilp.dev/react-list'
```

`requestHandler` receives a snapshot of `State` (data only, no methods) and must return `Promise<RequestHandlerResponse<T>>`:

```ts
const requestHandler: RequestHandler<Row> = async (state) => {
  // state: endpoint, page, perPage, search, sortBy, sortOrder, filters, version, meta, columnSettings, isRefresh (plus rows, response, selection, ...)
  const res = await fetchList(state)
  return { rows: res.data, count: res.total, meta: res.meta }
}
```

## List props

Required: `endpoint`, `requestHandler`. `endpoint` is read once at setup; to load another endpoint call `refresh()` or remount with a `key`.

| Prop                                                                   | Default        | Notes                                                                               |
| ---------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `page`                                                                 | `1`            | Initial value only; change it later with `setPage`.                                 |
| `perPage`                                                              | `25`           | Initial value only; change it later with the matching action.                       |
| `sortBy`                                                               | `''`           | Initial value only; change it later with the matching action.                       |
| `sortOrder`                                                            | `'desc'`       | Initial value only; change it later with the matching action.                       |
| `search`                                                               | `''`           | Initial value only; change it later with the matching action.                       |
| `filters`                                                              | `{}`           | Parent-controlled query filters. Pair with `onFiltersChange`.                       |
| `paginationMode`                                                       | `'pagination'` | `'loadMore'` appends pages                                                          |
| `version`                                                              | `1`            | Passed to handler / state manager                                                   |
| `meta`                                                                 | `{}`           | Passed through to handler                                                           |
| `columns`                                                              |                | Column definitions (`string[]` or `{ name }[]`)                                     |
| `idKey`                                                                | `'id'`         | Row field `updateRowById` matches on (not used for keys)                            |
| `stateManager`                                                         |                | Optional `{ init, get, set }` persistence                                           |
| `beforePageChange` / `afterPageChange` / `beforeLoadMore` / `afterLoadMore` / `onResponse` / `onError` / `onRowSelect` / `onFiltersChange` |                | Hooks, with the same names in both packages (Vue emits them, so its listeners are `@on-response`, `@before-page-change`, ...). `before*` get the `State` of the request, `after*` and `onResponse` the response, `onError` the error. `onFiltersChange` also fires when `stateManager` restores filters. `onRowSelect` fires only when the selection changes. |

Children: `ReactNode` or `(context: Context<T>) => ReactNode`.

## Slots

All slots must be descendants of `List`. Most hide themselves during initial load, empty, or error.

| Component           | When it renders                              | Children scope                                                                       |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ListLoaderInitial` | First fetch                                  | `{ context }` or node                                                                |
| `ListLoader`        | Any load (`position`: `overlay` \| `inline`) | `{ context }` or node                                                                |
| `ListError`         | `error` and not loading                      | `{ context }` or node (`context.error` is `Error \| null`)                           |
| `ListEmpty`         | No rows, not loading, no error               | node                                                                                 |
| `ListRows`          | Has rows, not initial, no error              | `{ context }` or `row`                                                         |
| `ListSearch`        | Always                                       | `{ context, search, setSearch }` (debounced, default 500ms)                          |
| `ListPagination`    | Has rows                                     | `{ context, pagesCount, pagesToDisplay, hasNext, hasPrev, prev, next, first, last }` |
| `ListLoadMore`      | Has rows                                     | `{ context }` (`context.hasMore`, `context.loadMore`, `context.isLoading`)           |
| `ListPerPage`       | Has rows                                     | `{ context, options }`                                                               |
| `ListSummary`       | Has rows                                     | `{ context, from, to, visibleCount }`                                                |
| `ListRefresh`       | Always                                       | `{ context }` (call `context.refresh()`)                                             |
| `ListGoTo`          | Has rows                                     | `{ context, pages, pagesCount }`                                                     |
| `ListColumns`       | Always                                       | `{ context }` (`context.columns`, `context.columnSettings`, `context.updateColumn`)  |

Every scope has `context` (the state plus every action). Other keys are values the component computes. Read shared values such as `page`, `perPage`, `count` and `isLoading` from `state`.

`ListRows`:

- `children={({ context }) => ...}` — `context.rows` entries include `_index` (1-based across pages).
- `row={({ row, index }) => ...}` — wraps each row; the wrapper's key is `row._index`.
- Prefer `children` for tables (one `<table>`). Use `row` for card/row lists.

`ListSearch` `setSearch` in the scope is already debounced (`debounceTime`, default 500).

## List context (`useListContext` or root render fn)

```ts
const context = useListContext<Row>()
```

Data: `rows`, `count`, `error`, `response`, `isEmpty`, `hasActiveFilters`, `search`, `filters`, `selection`, `columns`, `columnSettings`.

Flat keys: `isLoading`, `isInitialLoading`, `page`, `perPage`, `hasMore`, `sortBy` (`''` when unset) / `sortOrder`.

Handlers: `setPage`, `setPerPage`, `setSearch`, `setSortBy`, `setSortOrder`, `setFilters`, `clearFilters`, `loadMore`, `refresh`, `setSelection`, `updateRowById`, `updateColumn`.

`ListRows` scope does **not** include `updateRowById`. Call `useListContext()` in the row or use the root children function.

## Row update vs refresh

```ts
// After PATCH /rows/:id succeeds
context.updateRowById(savedRow, savedRow.id)

// After create/delete, or when the page query is stale
context.refresh()
```

`updateRowById` shallow-merges into the row whose `idKey` field (default `id`) equals the id you pass. It does not refetch, change `count`, or update `selection`.

## Do not

- Fetch inside `ListRows` / row components for the list itself — that is `requestHandler`.
- Put Vue SFCs or `@shilp.dev/vue-list` in a React app.
- Expect `base`/routing from this package — it is UI state only.
- Use `refresh()` to apply a single-row edit.

## Additional resources

- Compose examples: [examples.md](examples.md)
- Canonical demo: `apps/react/story/src/stories/react-list/react-list-demo.tsx`
- Handler shape: `packages/types/src/response/index.ts`
- Props: `packages/react/src/components/list.tsx`
