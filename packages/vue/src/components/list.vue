<template>
  <div class="shilp-list">
    <slot v-bind="context" />
  </div>
</template>

<script setup lang="ts">
import type {
  Column,
  Context,
  Events,
  FilterState,
  FilterValues,
  ListPropsBase,
  RequestHandlerResponse,
  RequestTrigger,
  RowId,
  SortOrder,
  State,
} from '@shared'
import {
  DEFAULT_FILTERS,
  DEFAULT_ID_KEY,
  DEFAULT_META,
  DEFAULT_PAGE,
  DEFAULT_PAGINATION_MODE,
  DEFAULT_PER_PAGE,
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  DEFAULT_VERSION,
} from '@shared/constants'
import {
  computeColumns,
  computeHasMore,
  computeSelectionState,
  createColumns,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  toError,
  toggleAllIds,
  toggleId,
  computeFilters,
  computeDefaultFilters,
  hasSavedState,
} from '@shared/utils'
import { rowNotFoundMessage } from '@shared/messages'
import equal from 'fast-deep-equal'
import { computed, onMounted, onUnmounted, provide, reactive, ref, toRef, toRefs, watch } from 'vue'

defineOptions({
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'List',
})

const {
  endpoint,
  idKey = DEFAULT_ID_KEY,
  page = DEFAULT_PAGE,
  perPage = DEFAULT_PER_PAGE,
  sortBy = DEFAULT_SORT_BY,
  sortOrder = DEFAULT_SORT_ORDER,
  search = DEFAULT_SEARCH,
  version = DEFAULT_VERSION,
  paginationMode = DEFAULT_PAGINATION_MODE,
  meta = { ...DEFAULT_META },
  filters = [...DEFAULT_FILTERS],
  columns,
  requestHandler,
  initialResponse,
  stateManager,
} = defineProps<ListPropsBase>()

const emit = defineEmits<Events>()

const isLoadMore = computed(() => {
  return paginationMode === 'loadMore'
})

const defaultFilters = computeDefaultFilters(filters)

const localPage = ref<number>(page)
const localPerPage = ref<number>(perPage)
const localSortBy = ref<string>(sortBy)
const localSortOrder = ref<SortOrder>(sortOrder)
const localSearch = ref<string>(search)
const localFilters = ref<FilterState[]>([...defaultFilters])
const localColumns = ref<Column[]>(createColumns(columns))

const rows = ref<unknown[]>([])
const selection = ref<RowId[]>([])
const error = ref<Error | null>(null)
const response = ref<RequestHandlerResponse | null>(null)
const count = ref(0)
const isLoading = ref(true)
const isInitialLoading = ref(true)
const requestTrigger = ref<RequestTrigger>('mount')
let requestId = 0

const isEmpty = computed(() => {
  return rows.value.length === 0
})

const hasMore = computed(() => {
  return computeHasMore(localPage.value, localPerPage.value, count.value)
})

const selectionState = computed(() => {
  return computeSelectionState(rows.value, selection.value, idKey)
})

function updateStateManager() {
  stateManager?.set?.(snapshot())
}

function clearState() {
  stateManager?.clear?.(snapshot())
  init()
}

// Lifecycle 3 to 5, one request. Only the latest request counts (`requestId`).
// 3. Request: state shows isLoading (`requestTrigger` says what started it), `beforePageChange` / `beforeLoadMore` get the
//    State being requested, then `requestHandler` runs.
// 4. Response: rows are replaced (page mode) or appended (load-more) with their `_index`, selection
//    resets, `stateManager.set` runs, then `onResponse` and `afterPageChange` / `afterLoadMore` emit.
// 5. Error: error is set, rows and count are cleared and `onError` emits. `stateManager.set` and the
//    after events do not run.
function getData() {
  error.value = null
  isLoading.value = true
  const currentRequestId = ++requestId

  const requestState = snapshot()

  if (isLoadMore.value) {
    emit('beforeLoadMore', requestState)
  } else {
    emit('beforePageChange', requestState)
  }

  requestHandler(requestState)
    .then((res) => {
      if (currentRequestId !== requestId) {
        return
      }

      response.value = res
      selection.value = []
      rows.value = mergeRows(rows.value, res.rows, {
        page: localPage.value,
        perPage: localPerPage.value,
        isLoadMore: isLoadMore.value,
      })
      count.value = res.count
      updateStateManager()
      emit('onResponse', res)

      if (isLoadMore.value) {
        emit('afterLoadMore', res)
      } else {
        emit('afterPageChange', res)
      }
    })
    .catch((err: unknown) => {
      if (currentRequestId !== requestId) {
        return
      }

      error.value = toError(err)
      rows.value = []
      count.value = 0
      emit('onError', error.value)
      // The list UI already surfaces the error via `error`.
      // Re-throwing here creates unhandled promise rejections.
    })
    .finally(() => {
      if (currentRequestId !== requestId) {
        return
      }
      isLoading.value = false
      isInitialLoading.value = false
    })
}

// Lifecycle 6, actions called by the consumer. They only change local state; the watcher below
// starts the request. setPerPage, setSearch, setSortBy and setSortOrder go back to page 1, and
// setFilters and clearFilters do the same through the `filters` watcher. refresh refetches the
// current page (load-more: from page 1). loadMore fetches the next page. updateRowById,
// setColumn and toggleRowSelection change state without a request.
// Internal: `requestTrigger` is set by the caller, before the request reads it.
function fetchPage(value: number) {
  localPage.value = value
  getData()
}

function setPage(value: number) {
  if (!value) {
    return
  }
  requestTrigger.value = 'page'
  fetchPage(value)
}

function setPerPage(value: number) {
  if (value === localPerPage.value) {
    return
  }
  localPerPage.value = value
  requestTrigger.value = 'perPage'
  fetchPage(1)
}

function setSearch(value: string) {
  if (value === localSearch.value) {
    return
  }
  localSearch.value = value
  requestTrigger.value = 'search'
  fetchPage(1)
}

function setSortBy(value: string) {
  if (value === localSortBy.value) {
    return
  }
  localSortBy.value = value
  requestTrigger.value = 'sortBy'
  fetchPage(1)
}

function setSortOrder(value: SortOrder) {
  if (value === localSortOrder.value) {
    return
  }
  localSortOrder.value = value
  requestTrigger.value = 'sortOrder'
  fetchPage(1)
}

function changeFilters(next: FilterState[]) {
  if (equal(localFilters.value, next)) {
    return
  }

  localFilters.value = next
  requestTrigger.value = 'filters'
  emit('onFiltersChange', next)
}

function setFilters(values: FilterValues) {
  const next = computeFilters(localFilters.value, defaultFilters, values)
  changeFilters(next)
}

function setFilter(column: string, value: unknown) {
  setFilters({ [column]: value })
}

function clearFilters() {
  changeFilters([...defaultFilters])
}

function toggleRowSelection(id: RowId) {
  selection.value = toggleId(selection.value, id)
}

function toggleAllRowsSelection() {
  selection.value = toggleAllIds(rows.value, selection.value, idKey)
}

function refresh() {
  requestTrigger.value = 'refresh'

  if (isLoadMore.value) {
    rows.value = []
    fetchPage(1)
  } else {
    getData()
  }
}

function loadMore() {
  if (hasMore.value && !isLoading.value) {
    requestTrigger.value = 'loadMore'
    fetchPage(localPage.value + 1)
  }
}

function updateRowById(row: Partial<unknown>, id: RowId) {
  const next = patchRowById(rows.value, row, id, idKey)

  if (!next) {
    console.warn(rowNotFoundMessage(idKey, id))
    return
  }

  rows.value = next
}

function setColumn(column: string, key: string, value: unknown) {
  const next = computeColumns(localColumns.value, column, key, value)

  if (equal(localColumns.value, next)) {
    return
  }

  localColumns.value = next
  requestTrigger.value = 'columns'
  updateStateManager()
}

const state = reactive({
  // props
  endpoint: toRef(() => endpoint),
  version: toRef(() => version),
  meta: toRef(() => meta),
  idKey: toRef(() => idKey),
  //local copies
  page: localPage,
  perPage: localPerPage,
  sortBy: localSortBy,
  sortOrder: localSortOrder,
  search: localSearch,
  columns: localColumns,
  filters: localFilters,
  //local items
  rows,
  response,
  error,
  count,
  selection,
  selectionState,
  hasMore,
  isLoading,
  isInitialLoading,
  requestTrigger,
  isEmpty,
}) as State

const context = reactive({
  ...toRefs(state),
  setPage,
  setPerPage,
  setSearch,
  setSortBy,
  setSortOrder,
  setFilter,
  setFilters,
  clearFilters,
  loadMore,
  refresh,
  clearState,
  toggleRowSelection,
  toggleAllRowsSelection,
  updateRowById,
  setColumn,
}) as Context

provide('shilp-list-context', context)

const snapshot = (): State => {
  return { ...state }
}

// Lifecycle 1, setup: state starts from the props and defaults. `stateManager.get` runs before any
// state exists and may restore page, perPage, sort, search, filters and columns. A load-more
// list always starts on page 1. Nothing is fetched yet.
let saved: Partial<State> = {}

try {
  saved = stateManager?.get?.(snapshot()) ?? {}
} catch (err) {
  console.error(err)
}

if (saved.page != null && !isLoadMore.value) {
  localPage.value = saved.page
}

if (saved.perPage != null) {
  localPerPage.value = saved.perPage
}

if (saved.sortBy != null) {
  localSortBy.value = saved.sortBy
}

if (saved.sortOrder != null) {
  localSortOrder.value = saved.sortOrder
}

if (saved.search != null) {
  localSearch.value = saved.search
}

// Saved columns and filters replace the ones from the props as they are, so `get` returns the
// complete lists, with `isDirty` already worked out.
if (saved.columns != null) {
  localColumns.value = saved.columns
}

if (saved.filters != null) {
  localFilters.value = saved.filters
}

// A seeded list (`initialResponse`) shows that response without a request. It stays seeded only
// when nothing was restored: saved values may ask for another query, so then the list fetches.
let isSeeded = false

if (initialResponse != null) {
  response.value = initialResponse
  rows.value = mergeRows(rows.value, initialResponse.rows, {
    page: localPage.value,
    perPage: localPerPage.value,
    isLoadMore: isLoadMore.value,
  })
  count.value = initialResponse.count
  isLoading.value = false
  isInitialLoading.value = false
  isSeeded = !hasSavedState(saved)
}

// Lifecycle 7, props changing after mount: `filters`, `columns` and the query props (page, perPage,
// search, sortBy, sortOrder) are read once; change them through the context actions. `endpoint`,
// `version`, `meta` and `idKey` follow the prop (`toRef` in `state`) but start no request. A change
// of `localFilters` or `localColumns` (setFilter, setFilters, clearFilters, setColumn) refetches,
// except before the first response has arrived.
watch(localFilters, (newValue, oldValue) => {
  if (isInitialLoading.value) {
    return
  }

  if (equal(newValue, oldValue)) {
    return
  }

  fetchPage(1)
})

watch(localColumns, (newValue, oldValue) => {
  if (isInitialLoading.value) {
    return
  }

  if (equal(newValue, oldValue)) {
    return
  }

  getData()
})

// `onRowSelect` emits when the selection really changes, including the reset after a response.
watch(selection, (newValue, oldValue) => {
  const previous = oldValue ?? []

  if (hasSelectionChanged(newValue, previous)) {
    emit('onRowSelect', newValue, previous)
  }
})

function init() {
  stateManager?.init?.(snapshot())

  if (saved.filters != null && !equal(localFilters.value, defaultFilters)) {
    emit('onFiltersChange', localFilters.value)
  }

  if (isSeeded) {
    isSeeded = false
    return
  }

  getData()
}

// Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the saved filters differ from
// the prop, then the first request (skipped for a seeded list).
onMounted(() => {
  init()
})

// Lifecycle 8, unmount: invalidate the request in flight so its late response or error does not
// update state, call `stateManager.set` or emit events on a list that no longer exists.
onUnmounted(() => {
  requestId++
})

defineExpose(toRefs(context))
</script>
