# React vs Vue list: parity inconsistencies

Compared `packages/react` and `packages/vue` (with `shared/`) by reading the source. Not run (typecheck and lint pass). Priority: High / Med / Low. Status: Fixed / Partial / Open / New, re-verified after the latest changes.

## A. Behaviour and logic

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| A1 | Fixed | High | setFilters / clearFilters | Always applies filters, resets to page 1, refetches, calls onFiltersChange. Refetches even when filters are unchanged. | Only writes the filters model; a watcher refetches. Skips when filters are equal or while initializing, so clearFilters() on default filters does nothing. | list.tsx:233, list.vue:216, list.vue:292 | Update: React now skips equal filters like Vue. Small leftover: Vue still emits onFiltersChange even when filters are unchanged, and ignores changes while initializing. |
| A2 | Fixed | Med | Filters binding | One-way prop plus onFiltersChange. Filters restored by stateManager stay internal; the parent is not told. | v-model (defineModel). Restored filters are written back to the parent via update:filters. | list.tsx, list.vue | Update: React calls onFiltersChange when restored filters differ from the prop. A parent echo of those filters does not reset the page or refetch. |
| A3 | Fixed | High | Equality helper | deepEqual ignores undefined keys and key order. A second helper, isEqual, also exists in utils.ts. | deepEqual is JSON.stringify(a) === JSON.stringify(b), so key order matters. | components/utils.ts, utils.ts, list-utils.ts | Update: Both use the same deepEqual (ignore undefined keys / key order). React's unused isEqual alias was removed; hasActiveFilters uses deepEqual in both packages. |
| A4 | Fixed | High | loadMore() | No guard: always page + 1. ListLoadMore calls setPage(page + 1) with its own guard. | Guarded by hasMore && !isLoading. ListLoadMore calls state.loadMore. | list.tsx, list.vue:226 | Update: React loadMore() is guarded like Vue. ListLoadMore in both packages calls state.loadMore. |
| A5 | Fixed | High | setPage('') and string pages | Stores '' as the page. A string page like '2' makes loadMore compute '2' + 1 = '21'. | Returns early and keeps the old page. Coerces with Number(). | list.tsx:setPage, list.vue:setPage | Update: React setPage now returns early on empty values and coerces with Number(), like Vue. |
| A6 | Fixed | High | requestHandler context | No columnSettings; isRefresh is undefined unless passed. | Sends buildContext() including columnSettings, plus isRefresh: false by default. | list.tsx:153, list.vue:132 | Update: Both send isRefresh: false and omit columnSettings from requestHandler (it stays on StateManagerContext only). |
| A7 | Fixed | High | Callback timing | onResponse, then afterLoadMore / afterPageChange, then rows are set. Callbacks see old rows. | Sets response and state manager, emits onResponse, sets rows, then emits afterX. Callbacks see new rows. | list.tsx, list.vue setRows | Update: React now updates state, calls the state manager, then onResponse and afterX. Order matches Vue closely enough. N1 is fixed. |
| A8 | Fixed | Low | sort.sortBy empty value | '' | null (localSortBy \|\| null) | list.tsx, list.vue | Update: React exposes sort.sortBy as null when empty, matching Vue and ListSort. Internal sortBy stays a string. |
| A9 | Fixed | Med | Initial fetch timing | stateManager.init and first setPage run in a mount useEffect (client only). | Both run synchronously in setup, so they also run during SSR. | list.tsx, list.vue | Update: Vue now runs stateManager.init and the first setPage in onMounted. Both packages defer them until mount, so neither fetches during SSR. |
| A10 | Fixed | Med | requestHandler / stateManager reactivity | Follow re-renders. | Read once from props; later changes are ignored. | list.vue | Update: Vue no longer captures `const requestHandler = props.requestHandler` / `stateManager` at setup. Both packages resolve the current prop on each fetch / stateManager call. |
| A11 | Fixed | High | Stale state overwrite | fetchData builds state from a snapshot taken at request start. setSelection / updateColumn during an in-flight request are overwritten. | Independent refs; not affected. | list.tsx fetchData | Update: fetchData now merges into the latest state with setState(prev => ...), so selection and column changes made during a request survive. N1 is fixed. |
| A12 | Fixed | Med | Search debounce | Timer cleared on unmount; debounceTime read live. | useDebounceFn from @vueuse/core (extra runtime dependency); not cancelled on unmount; debounceTime captured once. | search.tsx, search.vue | Update: Vue ListSearch uses a manual timer, cancelled on unmount, with debounceTime read live. @vueuse/core is no longer used in the source but is still listed in packages/vue/package.json dependencies. |
| A13 | Open | Low | Prop reactivity | Only filters reacts. | Only filters reacts. | Both: page, perPage, search, sortBy, endpoint ignored after mount. The old docs claim all props react. |

## B. Props, events and public API

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| B1 | Fixed | High | Lifecycle hooks | Props: onResponse, afterPageChange, afterLoadMore. | Emits with the same names (listener is @on-response). | shared/options.ts says "shared by React props and Vue emits" | Update: Vue emits response, afterPageChange, afterLoadMore, rowSelect, and filtersChange (@response, @after-page-change, @after-load-more, @row-select, @filters-change). onResponse, onRowSelect, and onFiltersChange are listeners only, so each handler runs once. |
| B2 | Fixed | High | Selection and filter events | No selection callback. Has onFiltersChange. | Emits onRowSelect(selection, previous). Uses update:filters. | list.vue watch(selection) | Update: Both support onFiltersChange and onRowSelect (React via selection effect; Vue via watch). Restored filters are written back on both (see A2). |
| B3 | Fixed | Med | Imperative access | None (no ref / useImperativeHandle). | defineExpose of rows, state and handlers; omits updateColumn. | list.vue defineExpose | Update: React exposes ReactListHandle via ref (rows/response/isLoading/error/count/selection + handlers including updateColumn). Vue defineExpose matches. |
| B4 | Open | Low | Exports | Default export plus named ReactList. Exports ReactListProps. | Named VueList only. Also exports LIST_CONTEXT_KEY, VueListProps, VueListEmits. | index.ts, main.ts |
| B5 | Fixed | Med | useListContext() | Returns { listState } as plain values. | Returns { listState: ComputedRef }; consumers need .value. Shared ListInstanceContext only fits React. | list-context.tsx, use-list-context.ts | Update: Vue useListContext returns ListInstanceContext. listState is a proxy over the computed, so script reads listState.rows with no .value. |
| B6 | Open | Low | Root children / slot | children is a node or a function of ListRenderScope. | Default slot bound to ListState. | list.tsx, list.vue |
| B7 | Open | Low | Slot types | Most children typed function-only, though runtime also accepts nodes. | Slots accept either. | search, rows, go-to, load-more, per-page, summary, refresh |

## C. Components: naming, props and slot scope

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| C1 | Fixed | Med | ListRows | row render prop gets { row, index } from serialized rows (has _index). children-as-function wins over row. | #row slot comes from scope.rows (has _index). Default slot overrides #row. | rows.tsx, rows.vue | Update: React children (function or node) win over row, matching Vue's default slot. row still receives { row, index } from serialized rows. |
| C2 | Fixed | Med | ListColumns | column prop receives { key, column, updateColumn, columnSettings }. | #column slot receives { column, updateColumn, columnSettings } (no key). | columns.tsx, columns.vue | Update: React column callback no longer receives key. The mapped result is wrapped in a keyed Fragment. |
| C3 | Fixed | Med | ListPagination | renderFirst / renderPrev / renderPages / renderPage / renderNext / renderLast. renderPage gets the full scope; its result has no key (React warning). | Slots first / prev / pages / page / next / last. #page gets only { page, isActive }. | pagination.tsx, pagination.vue | Update: renderPage and #page both receive the pagination scope with page and isActive overridden. Each React page is wrapped in a keyed Fragment. render* props are the React names for those Vue slots. |
| C4 | Open | Low | ListEmpty | children is node-only. | Default slot, no scope. | Same behaviour; only the React type spells it out |

## D. HTML output

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| D1 | Fixed | High | Root wrapper | No wrapper element. | <div class="vue-list"> around everything. | list.tsx, list.vue template | Update: React now renders <div class="react-list"> around children. |
| D2 | Open | Low | ListEmpty / ListLoader fallback | <div><p>…</p></div> | <p>…</p> | empty, loader |
| D3 | Fixed | Med | ListPagination structure | Pages inside <div>, each page in <div key>. | Flat <span> / <button>, no wrappers. | pagination | Update: React pages are a flat span or button under react-list__pagination. Custom renderPage output is a keyed Fragment, which adds no DOM node. |
| D4 | Open | Low | ListRows fallback | <div><pre>…</pre></div> per row (JSON includes _index). | <div> wrapper with <pre>…</pre> (object includes _index). | rows |
| D5 | Fixed | High | Buttons | ListRefresh button lacks type="button" (submits a surrounding form). ListLoadMore button gets disabled={isLoading}. | Both have type="button"; LoadMore button is not disabled while loading. | refresh, load-more | Update: React Refresh button has type="button"; React LoadMore button is no longer disabled while loading. |
| D6 | Fixed | Low | Search placeholder | "Search..." | "Search" | search | Update: Vue placeholder is now "Search...". |
| D7 | Open | Low | Select events | onChange | @input | go-to, per-page |

## N. New findings from the changes

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| N1 | Fixed | Med | State manager call in fetchData | updateStateManager is called after a setState(prev => ...) updater that assigns mergedForStateManager. React may run updaters later, during render, so the variable can still be null and stateManager.set is skipped. In StrictMode dev the updater also runs twice. | Calls stateManager.set synchronously after the response. | list.tsx fetchData | Update: React calls updateStateManager(currentState) synchronously after scheduling setState, using the request snapshot. stateManager.set is not skipped, and StrictMode does not run it twice. |

## Suggested order

Remaining open items are all low priority: A13, B4, B6-B7, C4, D2, D4, D7. Decide which package is the reference when they disagree.
