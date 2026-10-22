<template>
  <div class="shilp-list">
    <slot v-bind="context" />
  </div>
</template>

<script setup lang="ts">
import type {
  Columns,
  Context,
  Events,
  FilterState,
  FilterValues,
  RequestHandlerResponse,
  RequestTrigger,
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
  createColumns,
  getRestoredState,
  hasActiveFilters,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  rowNotFoundMessage,
  toError,
  computeFilters,
} from '@shared/utils'
import equal from 'fast-deep-equal'
import { computed, onMounted, onUnmounted, provide, reactive, ref, toRefs, watch } from 'vue'
import type { ListPropsVue } from '../types'

defineOptions({
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'List',
})

const props = withDefaults(defineProps<ListPropsVue>(), {
  idKey: DEFAULT_ID_KEY,
  page: DEFAULT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  sortBy: DEFAULT_SORT_BY,
  sortOrder: DEFAULT_SORT_ORDER,
  search: DEFAULT_SEARCH,
  version: DEFAULT_VERSION,
  paginationMode: DEFAULT_PAGINATION_MODE,
  filters: () => {
    return [...DEFAULT_FILTERS]
  },
  meta: () => {
    return { ...DEFAULT_META }
  },
})

const emit = defineEmits<Events>()

const isLoadMore = computed(() => {
  return props.paginationMode === 'loadMore'
})

const defaultFilters = props.filters.map(({ column, value }): FilterState => {
  return { column, value, isDirty: false }
})

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search)
const localFilters = ref<FilterState[]>([...defaultFilters])
const localColumns = ref<Columns>(createColumns(props.columns))

const rows = ref<unknown[]>([])
const selection = ref<unknown[]>([])
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

function setRows(res: RequestHandlerResponse) {
  rows.value = mergeRows(rows.value, res.rows, {
    page: localPage.value,
    perPage: localPerPage.value,
    isLoadMore: isLoadMore.value,
  })
  count.value = res.count
}

function updateStateManager() {
  props.stateManager?.set?.(snapshot())
}

function clearState() {
  props.stateManager?.clear?.(snapshot())
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

  props
    .requestHandler(requestState)
    .then((res) => {
      if (currentRequestId !== requestId) {
        return
      }

      response.value = res
      selection.value = []
      setRows(res)
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
// setColumn and setSelection change state without a request.
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

function setPerPage(value: number) {
  if (value === localPerPage.value) {
    return
  }
  localPerPage.value = value
  requestTrigger.value = 'perPage'
  fetchPage(1)
}

function setSelection(value: unknown[]) {
  selection.value = value
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

function updateRowById(row: Partial<unknown>, id: string | number) {
  const next = patchRowById(rows.value, row, id, props.idKey)

  if (!next) {
    console.warn(rowNotFoundMessage(props.idKey, id))
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
  endpoint: props.endpoint,
  version: props.version,
  meta: props.meta,
  idKey: props.idKey,
  page: localPage,
  perPage: localPerPage,
  sortBy: localSortBy,
  sortOrder: localSortOrder,
  search: localSearch,
  rows,
  response,
  error,
  count,
  selection,
  hasMore,
  isLoading,
  isInitialLoading,
  requestTrigger,
  filters: localFilters,
  columns: localColumns,
  isEmpty,
  hasActiveFilters: computed(() => {
    return hasActiveFilters(localFilters.value)
  }),
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
  setSelection,
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
  saved = props.stateManager?.get?.(snapshot()) ?? {}
} catch (err) {
  console.error(err)
}

const restored = getRestoredState(saved, isLoadMore.value)

if (restored.page != null) {
  localPage.value = restored.page
}

if (restored.perPage != null) {
  localPerPage.value = restored.perPage
}

if (restored.sortBy != null) {
  localSortBy.value = restored.sortBy
}

if (restored.sortOrder != null) {
  localSortOrder.value = restored.sortOrder
}

if (restored.search != null) {
  localSearch.value = restored.search
}

if (restored.columns != null) {
  // Saved columns that are no longer in the `columns` prop are ignored.
  restored.columns.forEach(({ name, ...values }) => {
    Object.entries(values).forEach(([key, value]) => {
      localColumns.value = computeColumns(localColumns.value, name, key, value)
    })
  })
}

if (restored.filters != null) {
  localFilters.value = computeFilters(
    localFilters.value,
    defaultFilters,
    Object.fromEntries(
      restored.filters.map(({ column, value }) => {
        return [column, value]
      }),
    ),
  )
}

// Lifecycle 7, props changing after mount: none. `filters`, `columns` and the query props (page,
// perPage, search, sortBy, sortOrder, endpoint) are read once; change them through the context
// actions. A change of `localFilters` or `localColumns` (setFilter, setFilters, clearFilters,
// setColumn) refetches, except before the first response has arrived.
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
  props.stateManager?.init?.(snapshot())

  if (restored.filters != null && !equal(localFilters.value, defaultFilters)) {
    emit('onFiltersChange', localFilters.value)
  }

  getData()
}

// Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the restored filters differ from
// the prop, then the first request.
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
