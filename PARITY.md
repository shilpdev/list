# ShilpList parity: React vs Vue

Compared `packages/react` and `packages/vue` (with `shared/`) by reading the source after the rows/columns rename, the `ShilpList` rename and the `shared/` split. `pnpm typecheck` and `pnpm lint` pass; the app and Storybook tests were not run. Status: Fixed / Open. Priority: High / Med / Low.

All 31 original findings (A–D) and N1 are fixed. 5 findings are open: N2, N5, N6, N8 and N9.

## A. Behaviour and logic

| # | Status | Pri | Area | Original gap | Current state | Where |
|---|---|---|---|---|---|---|
| A1 | Fixed | High | setFilters / clearFilters | React always refetched; Vue skipped equal filters. | Both skip equal filters, then apply, reset to page 1 and notify (onFiltersChange / filtersChange). Leftover: Vue ignores a filters change that happens before the first response (`initializingState`); React applies it. | list.tsx handlers, list.vue setFilters / watch(filters) |
| A2 | Fixed | Med | Filters binding | Restored filters stayed internal in React but were written to the parent in Vue. | React calls onFiltersChange on mount when restored filters differ from the prop, and ignores a parent echo. Vue writes restored filters to the v-model. Leftover: Vue does not emit `filtersChange` for restored filters (see N2). | list.tsx init effect, list.vue setup |
| A3 | Fixed | High | Equality helper | Vue used JSON.stringify; React had two helpers. | Both use the same `deepEqual` (ignores undefined keys and key order) and the same `hasActiveFilters` logic. The code is duplicated in each package. | react/src/utils.ts, vue/src/list-utils.ts |
| A4 | Fixed | High | loadMore() | React had no guard; ListLoadMore bypassed the root handler. | Root `loadMore` is guarded by hasMore and !isLoading in both. ListLoadMore calls `loadMore` from state in both. | list.tsx, list.vue, load-more |
| A5 | Fixed | High | setPage('') and string pages | React stored '' and string pages; `'2' + 1` gave `'21'`. | React returns early on empty values and coerces with Number(). Leftover: Vue does not guard NaN (see N3). | list.tsx setPage, list.vue setPage |
| A6 | Fixed | High | requestHandler context | Vue sent attrSettings and isRefresh: false; React did not. | Both pass a snapshot of `State` (data only, including `endpoint`, `version`, `meta`, `columnSettings`, `isRefresh`) to `requestHandler` and every `stateManager` method. | list.tsx buildState, list.vue snapshot |
| A7 | Fixed | High | Callback timing | Callbacks and state-manager writes ran in a different order. | Both: response stored, state manager called, `onResponse`, then `afterLoadMore` / `afterPageChange`. Vue emits `response` before it assigns rows, React after; callbacks only receive the response, so this is not observable. | list.tsx fetchData, list.vue setRows |
| A8 | Fixed | Low | sortBy empty value | React gave '', Vue gave null. | `State.sortBy` is a `string` in both packages; `''` means unset. | list.tsx, list.vue |
| A9 | Fixed | Med | Initial fetch timing | React fetched after mount; Vue fetched in setup (also on SSR). | Both run `stateManager.init` and the first `setPage` after mount (React effect, Vue `onMounted`). | list.tsx, list.vue |
| A10 | Fixed | Med | requestHandler / stateManager reactivity | Vue read them once at setup. | Vue reads `props.requestHandler` and `props.stateManager` on every call, like React. | list.vue |
| A11 | Fixed | High | Stale state overwrite | React overwrote selection and column changes made during a request. | fetchData merges with `setState(prev => ...)`, so those changes survive. See N4 for one remaining snapshot. | list.tsx fetchData |
| A12 | Fixed | Med | Search debounce | Vue used @vueuse/core and never cancelled. | Vue ListSearch uses its own timer, cancelled on unmount, with debounceTime read live. `@vueuse/core` is no longer a dependency of packages/vue. | search.tsx, search.vue, packages/vue/package.json |
| A13 | Fixed | Low | Prop reactivity | Only `filters` reacted after mount. | page, perPage, search, sortBy, sortOrder and endpoint refetch in both packages. A change other than page resets to page 1. Leftover: Vue ignores these changes until the first response; React applies them once mounted. | list.tsx prop effect, list.vue watch |

## B. Props, events and public API

| # | Status | Pri | Area | Original gap | Current state | Where |
|---|---|---|---|---|---|---|
| B1 | Fixed | High | Lifecycle hooks | Props in React, emits named `onX` in Vue. | Vue emits `response`, `afterPageChange`, `afterLoadMore`, `rowSelect`, `filtersChange`. React uses the matching props. Leftover: Vue also accepts `afterPageChange` / `afterLoadMore` as props and calls both (see N5). | shared/list.ts, types.ts, list.vue |
| B2 | Fixed | High | Selection and filter events | Selection event was Vue-only. | `onRowSelect` (React effect) and `rowSelect` (Vue watch) both exist. Both also fire on every fetch (see N6). | list.tsx, list.vue |
| B3 | Fixed | Med | Imperative access | React had no ref API. | React exposes `ShilpListHandle` through `ref` (React 19 ref-as-prop; the package peer is now ^19). Vue `defineExpose` has the same members including `updateColumn`. | list.tsx, list.vue |
| B4 | Fixed | Low | Exports | Vue had no default export. | Both default-export `ShilpList` and export it by name. Vue also exports `LIST_CONTEXT_KEY` and `ShilpListEmits`; React exports `ShilpListHandle`. | index.ts, main.ts |
| B5 | Fixed | Med | useListContext() | Vue returned a ComputedRef. | Both return `Context` directly; Vue provides a `reactive` object, so `context.rows` needs no `.value`. See N7 for destructuring. | use-list-context.ts |
| B6 | Fixed | Low | Root children / slot | React and Vue typed the root scope differently. | React children is a node or `(context: Context) => node`; Vue's default slot is bound to the context. | list.tsx, list.vue |
| B7 | Fixed | Low | Slot types | React children typed function-only. | All React slot components accept a node or a render function; ListSearch renders a node as-is. | search, rows, go-to, load-more, per-page, summary, refresh, pagination |

## C. Components: naming, props and slot scope

| # | Status | Pri | Area | Original gap | Current state | Where |
|---|---|---|---|---|---|---|
| C1 | Fixed | Med | ListRows | `item` won over children in React; Vue's default slot won over `#item`. | Children (node or function) win over `row` in React, matching Vue. `row` / `#row` both receive serialized rows with `_index`. | rows.tsx, rows.vue |
| C2 | Fixed | Med | ListColumns | React callback received `key` and `columnSettings`; Vue slot had no `key`. | Both pass `{ column, updateColumn, columnSettings }`. React wraps the result in a keyed Fragment. | columns.tsx, columns.vue |
| C3 | Fixed | Med | ListPagination | `renderPage` and `#page` had different scopes; no key in React. | Both pass the full pagination scope with `page` and `isActive` overridden. Names differ by framework (`renderFirst` etc. versus slots `first` etc.). | pagination.tsx, pagination.vue |
| C4 | Fixed | Low | ListEmpty | React type was node-only, Vue untyped. | Vue default slot is typed with no props. | empty.tsx, empty.vue |

## D. HTML output

| # | Status | Pri | Area | Original gap | Current state | Where |
|---|---|---|---|---|---|---|
| D1 | Fixed | High | Root wrapper | Only Vue rendered a root div. | Both render a root div (`react-list`, `vue-list`). | list.tsx, list.vue |
| D2 | Fixed | Low | ListEmpty / ListLoader fallback | React wrapped the text in an extra div. | Both render a bare `<p>`. | empty, loader |
| D3 | Fixed | Med | ListPagination structure | React wrapped pages in divs. | Both render flat span / button elements. | pagination |
| D4 | Fixed | Low | ListRows fallback | Output differed. | Both render `<div><pre>JSON</pre></div>` per row. | rows |
| D5 | Fixed | High | Buttons | React Refresh lacked `type="button"`; React LoadMore was disabled while loading. | All default buttons have `type="button"`; LoadMore is not disabled in either. | refresh, load-more |
| D6 | Fixed | Low | Search placeholder | 'Search...' versus 'Search'. | Both use 'Search...'. | search |
| D7 | Fixed | Low | Select events | onChange versus @input. | Both use change events. | go-to, per-page |

## N. New findings

| # | Status | Pri | Area | Original gap | Current state | Where |
|---|---|---|---|---|---|---|
| N1 | Fixed | Med | State manager call in fetchData | The call depended on a variable assigned inside a setState updater. | `updateStateManager` is called synchronously after the response, outside the updater. | list.tsx fetchData |
| N2 | Open | Low | Filters restored by stateManager | — | React calls `onFiltersChange` for restored filters; Vue updates the v-model but does not emit `filtersChange`. | list.tsx init effect, list.vue setup |
| N3 | Fixed | Low | Vue setPage with invalid values | — | Both ignore falsy pages (`0`, `NaN`); `setPage` takes a `number` only. | list.vue setPage |
| N4 | Fixed | Low | State manager snapshot | — | React builds the `stateManager.set` snapshot from the latest state plus the response, so `columnSettings` changed during a request are saved. | list.tsx fetchData |
| N5 | Open | Low | Callback props on Vue | — | `afterPageChange` and `afterLoadMore` are both Vue props and emits, and both are called. `onResponse`, `onRowSelect`, `onFiltersChange` are emits only. Consumers have two ways to subscribe to some events and one to others. | list.vue setRows, types.ts |
| N6 | Open | Med | Selection event fires on every fetch | — | Each response sets `selection` to a new `[]`, so `onRowSelect` / `rowSelect` fires with `([], previous)` after every fetch even when nothing was selected. Same in both packages. | list.tsx fetchData + selection effect, list.vue getData + watch(selection) |
| N7 | Fixed | Low | Vue useListContext destructuring | — | Vue now provides a `reactive` state object (no Proxy), so `context.rows` needs no `.value` and slots can bind it. Destructuring a reactive object still copies values once; use `toRefs` or read `state.x`. | use-list-state.ts, list.vue |
| N8 | Open | Low | ListSummary default text | — | React says "Showing N items"; Vue says "Showing N rows" (left over from the items → rows rename). | summary.tsx, summary.vue |
| N9 | Open | Low | CSS class prefix | — | Classes are `react-list__*` and `vue-list__*`, and Vue's inject key is `'vue-list-context'`, although both root components are now named `ShilpList`. Decide whether a shared `shilp-list` prefix is wanted. | all components, use-list-state.ts |
| N10 | Fixed | Med | `hasMore` in pagination mode | — | `hasMore` is `page * perPage < count` in both packages and in every component (`ListLoadMore`, `ListPagination.hasNext`, `loadMore`). | list.tsx, list.vue |

## Suggested order

N6 first (both packages, user-visible). Then N5, N2, N8, and decide N9.
