---
name: react-list
description: >-
  Implements and integrates @shilp.dev/react-list (ReactList, ListRows,
  ListPagination, requestHandler, updateRowById). Use when building React
  lists, tables, pagination, search, load-more, or when the user mentions
  @shilp.dev/react-list or ReactList.
---

# @shilp.dev/react-list

Headless React list: fetch, paginate, search, filter, sort. You own the UI via slot children.

Package: `@shilp.dev/react-list` (v1.1). All types ship with the package - import them from `@shilp.dev/react-list`.

Peers: `react` and `react-dom` `^18.2 || ^19`. Do not import `@shilp.dev/vue-list`.

## Rules

1. Wrap all list slots in `<ReactList>`. Slots use `useListContext()` and throw outside it.
2. Always pass `requestHandler`. Missing it throws.
3. Return `{ rows, count, meta? }` from `requestHandler`. Map your API into that shape.
4. Drive extra filters from parent state via the `filters` prop. Do not call `setFilters` from a local form unless that form lives inside the list tree.
5. Patch one row with `updateRowById(partial, id)` after a successful row API. Do not `refresh()` for a single-field edit. Rows need an `id`.
6. Use `paginationMode="loadMore"` with `ListLoadMore`, or default `"pagination"` with `ListPagination`. Do not mix both as the primary pager.

## Setup

```tsx
import ReactList, {
  ListEmpty,
  ListError,
  ListInitialLoader,
  ListLoader,
  ListPagination,
  ListRows,
  ListSearch,
} from '@shilp.dev/react-list'
import type { RequestHandler } from '@shilp.dev/react-list'
```

`requestHandler` receives `RequestContext` and must return `Promise<ListResponse<T>>`:

```ts
const requestHandler: RequestHandler<Row> = async (ctx) => {
  // ctx: endpoint, page, perPage, search, sortBy, sortOrder, filters, version, meta, isRefresh?
  const res = await fetchList(ctx)
  return { rows: res.data, count: res.total, meta: res.meta }
}
```

## ReactList props

Required: `endpoint`, `requestHandler`.

| Prop                                               | Default        | Notes                                           |
| -------------------------------------------------- | -------------- | ----------------------------------------------- |
| `page`                                             | `1`            | Initial page                                    |
| `perPage`                                          | `25`           | Page size                                       |
| `sortBy`                                           | `''`           |                                                 |
| `sortOrder`                                        | `'desc'`       | `'asc' \| 'desc' \| ''`                         |
| `search`                                           | `''`           |                                                 |
| `filters`                                          | `{}`           | Parent-controlled query filters                 |
| `paginationMode`                                   | `'pagination'` | `'loadMore'` appends pages                      |
| `version`                                          | `1`            | Passed to handler / state manager               |
| `meta`                                             | `{}`           | Passed through to handler                       |
| `columns`                                          |                | Column definitions (`string[]` or `{ name }[]`) |
| `count`                                            | `0`            | Initial count before first fetch                |
| `stateManager`                                     |                | Optional `{ init, get, set }` persistence       |
| `onResponse` / `afterPageChange` / `afterLoadMore` |                | Lifecycle hooks                                 |

Children: `ReactNode` or `(state: ListState<T>) => ReactNode`.

## Slots

All slots must be descendants of `ReactList`. Most hide themselves during initial load, empty, or error.

| Component           | When it renders                              | Children scope                                                         |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `ListInitialLoader` | First fetch                                  | `{ loading }` or node                                                  |
| `ListLoader`        | Any load (`position`: `overlay` \| `inline`) | `{ isLoading }` or node                                                |
| `ListError`         | `error` and not loading                      | `{ error }`                                                            |
| `ListEmpty`         | No rows, not loading, no error               | node                                                                   |
| `ListRows`          | Has rows, not initial, no error              | `(scope) =>` or `row`                                                  |
| `ListSearch`        | Always                                       | `{ search, setSearch }` (debounced, default 500ms)                     |
| `ListPagination`    | Has rows                                     | `{ page, pagesToDisplay, hasNext, hasPrev, prev, next, setPage, ... }` |
| `ListLoadMore`      | Has rows                                     | `{ loadMore, hasMoreRows, isLoading }`                                 |
| `ListPerPage`       | Has rows                                     | `{ perPage, setPerPage, options }`                                     |
| `ListSummary`       | Has rows                                     | `{ from, to, visibleCount, count }`                                    |
| `ListRefresh`       | Always                                       | `{ refresh, isLoading }`                                               |
| `ListGoTo`          | Has rows                                     | `{ page, pages, pagesCount, setPage }`                                 |
| `ListColumns`       | Always                                       | `{ columns, columnSettings, updateColumn }`                            |

`ListRows`:

- `children={(scope) => ...}` — `scope.rows` includes `_index` (1-based across pages).
- `row={({ row, index }) => ...}` — wraps each row; key is `row.id`.
- Prefer `children` for tables (one `<table>`). Use `row` for card/row lists.

`ListSearch` `setSearch` in the scope is already debounced (`debounceTime`, default 500).

## List state (`useListContext` or root render fn)

```ts
const { listState } = useListContext<Row>()
```

Data: `rows`, `count`, `error`, `response`, `isEmpty`, `hasActiveFilters`, `search`, `filters`, `selection`, `columns`, `columnSettings`.

Slices: `loader.isLoading` / `loader.initialLoading`, `pagination.page` / `perPage` / `hasMore`, `sort.sortBy` / `sortOrder`.

Handlers: `setPage`, `setPerPage`, `setSearch`, `setSort({ by, order })`, `setFilters`, `clearFilters`, `loadMore`, `refresh`, `setSelection`, `updateRowById`, `updateColumn`.

`ListRows` scope does **not** include `updateRowById`. Call `useListContext()` in the row or use the root children function.

## Row update vs refresh

```ts
// After PATCH /rows/:id succeeds
listState.updateRowById(savedRow, savedRow.id)

// After create/delete, or when the page query is stale
listState.refresh()
```

`updateRowById` shallow-merges by `row.id`. It does not refetch, change `count`, or update `selection`.

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
