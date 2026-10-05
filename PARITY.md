# React vs Vue list: parity inconsistencies

Compared `packages/react` and `packages/vue` (with `shared/`) by reading the source. Not run (typecheck and lint pass). Priority: High / Med / Low. Status: Fixed / Partial / Open / New, re-verified after the latest changes.

## A. Behaviour and logic

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| A1 | Fixed | High | setFilters / clearFilters | Always applies filters, resets to page 1, refetches, calls onFiltersChange. Refetches even when filters are unchanged. | Only writes the filters model; a watcher refetches. Skips when filters are equal or while initializing, so clearFilters() on default filters does nothing. | list.tsx:233, list.vue:216, list.vue:292 | Update: React now skips equal filters like Vue. Small leftover: Vue still emits onFiltersChange even when filters are unchanged, and ignores changes while initializing. |
| A2 | Partial | Med | Filters binding | One-way prop plus onFiltersChange. Filters restored by stateManager stay internal; the parent is not told. | v-model (defineModel). Restored filters are written back to the parent via update:filters. | list.tsx, list.vue | Update: Both now have onFiltersChange. Filters restored by stateManager are still written to the parent in Vue (update:filters) but stay internal in React. |
| A3 | Partial | High | Equality helper | deepEqual ignores undefined keys and key order. A second helper, isEqual, also exists in utils.ts. | deepEqual is JSON.stringify(a) === JSON.stringify(b), so key order matters. | components/utils.ts, utils.ts, list-utils.ts | Update: Vue deepEqual now matches React (ignores undefined keys and key order). React still has two helpers: isEqual (used by setFilters, clearFilters, the filters effect) counts undefined keys, while deepEqual (hasActiveFilters) does not. |
| A4 | Partial | High | loadMore() | No guard: always page + 1. ListLoadMore calls setPage(page + 1) with its own guard. | Guarded by hasMore && !isLoading. ListLoadMore calls state.loadMore. | list.tsx, list.vue:226 | Update: React loadMore() is now guarded like Vue. ListLoadMore still differs: React calls setPage(page + 1), Vue calls state.loadMore. |
| A5 | Fixed | High | setPage('') and string pages | Stores '' as the page. A string page like '2' makes loadMore compute '2' + 1 = '21'. | Returns early and keeps the old page. Coerces with Number(). | list.tsx:setPage, list.vue:setPage | Update: React setPage now returns early on empty values and coerces with Number(), like Vue. |
| A6 | Partial | High | requestHandler context | No attrSettings; isRefresh is undefined unless passed. | Sends buildContext() including attrSettings, plus isRefresh: false by default. | list.tsx:153, list.vue:132 | Update: isRefresh: false is now sent by both. React still does not send attrSettings in the requestHandler context; Vue does. |
| A7 | Fixed | High | Callback timing | onResponse, then afterLoadMore / afterPageChange, then items are set. Callbacks see old items. | Sets response and state manager, emits onResponse, sets items, then emits afterX. Callbacks see new items. | list.tsx, list.vue setItems | Update: React now updates state, calls the state manager, then onResponse and afterX. Order matches Vue closely enough. But see N1. |
| A8 | Open | Low | sort.sortBy empty value | '' | null (localSortBy || null) | list.tsx, list.vue |
| A9 | Open | Med | Initial fetch timing | stateManager.init and first setPage run in a mount useEffect (client only). | Both run synchronously in setup, so they also run during SSR. | list.tsx, list.vue |
| A10 | Open | Med | requestHandler / stateManager reactivity | Follow re-renders. | Read once from props; later changes are ignored. | list.vue |
| A11 | Fixed | High | Stale state overwrite | fetchData builds state from a snapshot taken at request start. setSelection / updateAttr during an in-flight request are overwritten. | Independent refs; not affected. | list.tsx fetchData | Update: fetchData now merges into the latest state with setState(prev => ...), so selection and attr changes made during a request survive. But see N1. |
| A12 | Fixed | Med | Search debounce | Timer cleared on unmount; debounceTime read live. | useDebounceFn from @vueuse/core (extra runtime dependency); not cancelled on unmount; debounceTime captured once. | search.tsx, search.vue | Update: Vue ListSearch uses a manual timer, cancelled on unmount, with debounceTime read live. @vueuse/core is no longer used in the source but is still listed in packages/vue/package.json dependencies. |
| A13 | Open | Low | Prop reactivity | Only filters reacts. | Only filters reacts. | Both: page, perPage, search, sortBy, endpoint ignored after mount. The old docs claim all props react. |

## B. Props, events and public API

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| B1 | Open | High | Lifecycle hooks | Props: onResponse, afterPageChange, afterLoadMore. | Emits with the same names (listener is @on-response). | shared/options.ts says "shared by React props and Vue emits" |
| B2 | Partial | High | Selection and filter events | No selection callback. Has onFiltersChange. | Emits onItemSelect(selection, previous). Uses update:filters. | list.vue watch(selection) | Update: onFiltersChange now exists in both. onItemSelect is still Vue-only. |
| B3 | Partial | Med | Imperative access | None (no ref / useImperativeHandle). | defineExpose of items, state and handlers; omits updateAttr. | list.vue defineExpose | Update: Vue now exposes updateAttr too. React still has no imperative handle. |
| B4 | Open | Low | Exports | Default export plus named ReactList. Exports ReactListProps. | Named VueList only. Also exports LIST_CONTEXT_KEY, VueListProps, VueListEmits. | index.ts, main.ts |
| B5 | Open | Med | useListContext() | Returns { listState } as plain values. | Returns { listState: ComputedRef }; consumers need .value. Shared ListInstanceContext only fits React. | list-context.tsx, use-list-context.ts |
| B6 | Open | Low | Root children / slot | children is a node or a function of ListRenderScope. | Default slot bound to ListState. | list.tsx, list.vue |
| B7 | Open | Low | Slot types | Most children typed function-only, though runtime also accepts nodes. | Slots accept either. | search, items, go-to, load-more, per-page, summary, refresh |

## C. Components: naming, props and slot scope

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| C1 | Open | Med | ListItems | item render prop gets { item, index } from raw items (no _index). item wins over children. | #item slot comes from scope.items (has _index). Default slot overrides #item. | items.tsx, items.vue |
| C2 | Open | Med | ListAttributes | attribute prop receives { key, attr, updateAttr, attrSettings }. | #attribute slot receives { attr, updateAttr } only. | attributes.tsx, attributes.vue |
| C3 | Open | Med | ListPagination | renderFirst / renderPrev / renderPages / renderPage / renderNext / renderLast. renderPage gets the full scope; its result has no key (React warning). | Slots first / prev / pages / page / next / last. #page gets only { page, isActive }. | pagination.tsx, pagination.vue |
| C4 | Open | Low | ListEmpty | children is node-only. | Default slot, no scope. | Same behaviour; only the React type spells it out |

## D. HTML output

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| D1 | Fixed | High | Root wrapper | No wrapper element. | <div class="vue-list"> around everything. | list.tsx, list.vue template | Update: React now renders <div class="react-list"> around children. |
| D2 | Open | Low | ListEmpty / ListLoader fallback | <div><p>…</p></div> | <p>…</p> | empty, loader |
| D3 | Open | Med | ListPagination structure | Pages inside <div>, each page in <div key>. | Flat <span> / <button>, no wrappers. | pagination |
| D4 | Open | Low | ListItems fallback | <pre> per item, no _index. | <div><pre>…</pre></div>, JSON includes _index. | items |
| D5 | Fixed | High | Buttons | ListRefresh button lacks type="button" (submits a surrounding form). ListLoadMore button gets disabled={isLoading}. | Both have type="button"; LoadMore button is not disabled while loading. | refresh, load-more | Update: React Refresh button has type="button"; React LoadMore button is no longer disabled while loading. |
| D6 | Fixed | Low | Search placeholder | "Search..." | "Search" | search | Update: Vue placeholder is now "Search...". |
| D7 | Open | Low | Select events | onChange | @input | go-to, per-page |

## N. New findings from the changes

| # | Status | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|---|
| N1 | New | Med | State manager call in fetchData | updateStateManager is called after a setState(prev => ...) updater that assigns mergedForStateManager. React may run updaters later, during render, so the variable can still be null and stateManager.set is skipped. In StrictMode dev the updater also runs twice. | Calls stateManager.set synchronously after the response. | list.tsx fetchData |

## Suggested order

Next: N1 (state manager may be skipped), then the remaining partials A3, A4, A6, B2, B3. Open items: A8-A10, A13, B1, B4-B7, C1-C4, D2-D4, D7. Decide which package is the reference when they disagree.
