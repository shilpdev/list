# React vs Vue list: parity inconsistencies

Compared `packages/react` and `packages/vue` (with `shared/`) by reading the source. Not run. Priority: High / Med / Low.

## A. Behaviour and logic

| # | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|
| A1 | High | setFilters / clearFilters | Always applies filters, resets to page 1, refetches, calls onFiltersChange. Refetches even when filters are unchanged. | Only writes the filters model; a watcher refetches. Skips when filters are equal or while initializing, so clearFilters() on default filters does nothing. | list.tsx:233, list.vue:216, list.vue:292 |
| A2 | Med | Filters binding | One-way prop plus onFiltersChange. Filters restored by stateManager stay internal; the parent is not told. | v-model (defineModel). Restored filters are written back to the parent via update:filters. | list.tsx, list.vue |
| A3 | High | Equality helper | deepEqual ignores undefined keys and key order. A second helper, isEqual, also exists in utils.ts. | deepEqual is JSON.stringify(a) === JSON.stringify(b), so key order matters. | components/utils.ts, utils.ts, list-utils.ts |
| A4 | High | loadMore() | No guard: always page + 1. ListLoadMore calls setPage(page + 1) with its own guard. | Guarded by hasMore && !isLoading. ListLoadMore calls state.loadMore. | list.tsx, list.vue:226 |
| A5 | High | setPage('') and string pages | Stores '' as the page. A string page like '2' makes loadMore compute '2' + 1 = '21'. | Returns early and keeps the old page. Coerces with Number(). | list.tsx:setPage, list.vue:setPage |
| A6 | High | requestHandler context | No attrSettings; isRefresh is undefined unless passed. | Sends buildContext() including attrSettings, plus isRefresh: false by default. | list.tsx:153, list.vue:132 |
| A7 | High | Callback timing | onResponse, then afterLoadMore / afterPageChange, then items are set. Callbacks see old items. | Sets response and state manager, emits onResponse, sets items, then emits afterX. Callbacks see new items. | list.tsx, list.vue setItems |
| A8 | Low | sort.sortBy empty value | '' | null (localSortBy || null) | list.tsx, list.vue |
| A9 | Med | Initial fetch timing | stateManager.init and first setPage run in a mount useEffect (client only). | Both run synchronously in setup, so they also run during SSR. | list.tsx, list.vue |
| A10 | Med | requestHandler / stateManager reactivity | Follow re-renders. | Read once from props; later changes are ignored. | list.vue |
| A11 | High | Stale state overwrite | fetchData builds state from a snapshot taken at request start. setSelection / updateAttr during an in-flight request are overwritten. | Independent refs; not affected. | list.tsx fetchData |
| A12 | Med | Search debounce | Timer cleared on unmount; debounceTime read live. | useDebounceFn from @vueuse/core (extra runtime dependency); not cancelled on unmount; debounceTime captured once. | search.tsx, search.vue |
| A13 | Low | Prop reactivity | Only filters reacts. | Only filters reacts. | Both: page, perPage, search, sortBy, endpoint ignored after mount. The old docs claim all props react. |

## B. Props, events and public API

| # | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|
| B1 | High | Lifecycle hooks | Props: onResponse, afterPageChange, afterLoadMore. | Emits with the same names (listener is @on-response). | shared/options.ts says "shared by React props and Vue emits" |
| B2 | High | Selection and filter events | No selection callback. Has onFiltersChange. | Emits onItemSelect(selection, previous). Uses update:filters. | list.vue watch(selection) |
| B3 | Med | Imperative access | None (no ref / useImperativeHandle). | defineExpose of items, state and handlers; omits updateAttr. | list.vue defineExpose |
| B4 | Low | Exports | Default export plus named ReactList. Exports ReactListProps. | Named VueList only. Also exports LIST_CONTEXT_KEY, VueListProps, VueListEmits. | index.ts, main.ts |
| B5 | Med | useListContext() | Returns { listState } as plain values. | Returns { listState: ComputedRef }; consumers need .value. Shared ListInstanceContext only fits React. | list-context.tsx, use-list-context.ts |
| B6 | Low | Root children / slot | children is a node or a function of ListRenderScope. | Default slot bound to ListState. | list.tsx, list.vue |
| B7 | Low | Slot types | Most children typed function-only, though runtime also accepts nodes. | Slots accept either. | search, items, go-to, load-more, per-page, summary, refresh |

## C. Components: naming, props and slot scope

| # | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|
| C1 | Med | ListItems | item render prop gets { item, index } from raw items (no _index). item wins over children. | #item slot comes from scope.items (has _index). Default slot overrides #item. | items.tsx, items.vue |
| C2 | Med | ListAttributes | attribute prop receives { key, attr, updateAttr, attrSettings }. | #attribute slot receives { attr, updateAttr } only. | attributes.tsx, attributes.vue |
| C3 | Med | ListPagination | renderFirst / renderPrev / renderPages / renderPage / renderNext / renderLast. renderPage gets the full scope; its result has no key (React warning). | Slots first / prev / pages / page / next / last. #page gets only { page, isActive }. | pagination.tsx, pagination.vue |
| C4 | Low | ListEmpty | children is node-only. | Default slot, no scope. | Same behaviour; only the React type spells it out |

## D. HTML output

| # | Pri | Area | React | Vue | Where |
|---|---|---|---|---|---|
| D1 | High | Root wrapper | No wrapper element. | <div class="vue-list"> around everything. | list.tsx, list.vue template |
| D2 | Low | ListEmpty / ListLoader fallback | <div><p>…</p></div> | <p>…</p> | empty, loader |
| D3 | Med | ListPagination structure | Pages inside <div>, each page in <div key>. | Flat <span> / <button>, no wrappers. | pagination |
| D4 | Low | ListItems fallback | <pre> per item, no _index. | <div><pre>…</pre></div>, JSON includes _index. | items |
| D5 | High | Buttons | ListRefresh button lacks type="button" (submits a surrounding form). ListLoadMore button gets disabled={isLoading}. | Both have type="button"; LoadMore button is not disabled while loading. | refresh, load-more |
| D6 | Low | Search placeholder | "Search..." | "Search" | search |
| D7 | Low | Select events | onChange | @input | go-to, per-page |

## Suggested order

Fix first: A1, A3, A4, A6, A7, B1-B3, D1, D5. A5, A11 and A12 are likely real bugs. D2-D4 and D6 are cheap alignments. Decide which package is the reference when they disagree.
