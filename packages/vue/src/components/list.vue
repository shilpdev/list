<template>
  <div class="shilp-list">
    <slot v-bind="context" />
  </div>
</template>

<script setup lang="ts">
import type {
  ColumnSettings,
  Context,
  Events,
  Filters,
  RequestHandlerResponse,
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
  computeHasMore,
  getColumns,
  getRestoredState,
  hasActiveFilters,
  hasSelectionChanged,
  mergeRows,
  patchRowById,
  rowNotFoundMessage,
  setColumnSetting,
  toError,
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
  meta: () => {
    return { ...DEFAULT_META }
  },
})

const emit = defineEmits<Events>()
const filters = defineModel<Filters>('filters', {
  default: () => {
    return { ...DEFAULT_FILTERS }
  },
})

const defaultFilters = ref<Filters>({ ...filters.value })

const isLoadMore = computed(() => {
  return props.paginationMode === 'loadMore'
})

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search)
const columnSettings = ref<ColumnSettings>({})

const rows = ref<unknown[]>([])
const selection = ref<unknown[]>([])
const error = ref<Error | null>(null)
const response = ref<RequestHandlerResponse | null>(null)
const count = ref(0)
const isLoading = ref(true)
const isInitialLoading = ref(true)
const isRefresh = ref(false)
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

// Lifecycle 3 to 5, one request. Only the latest request counts (`requestId`).
// 3. Request: state shows isLoading (and isRefresh, set by `refresh`), `beforePageChange` / `beforeLoadMore` get the
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
      isRefresh.value = false
      isInitialLoading.value = false
    })
}

// Lifecycle 6, actions called by the consumer. They only change local state; the watcher below
// starts the request. setPerPage, setSearch, setSortBy and setSortOrder go back to page 1, and
// setFilters and clearFilters do the same through the `filters` watcher. refresh refetches the
// current page (load-more: from page 1). loadMore fetches the next page. updateRowById,
// updateColumn and setSelection change state without a request.
function setPage(value: number) {
  if (!value) {
    return
  }
  localPage.value = value
}

function setSearch(value: string) {
  if (value === localSearch.value) {
    return
  }
  localSearch.value = value
  setPage(1)
}

function setSortBy(value: string) {
  if (value === localSortBy.value) {
    return
  }
  localSortBy.value = value
  setPage(1)
}

function setSortOrder(value: SortOrder) {
  if (value === localSortOrder.value) {
    return
  }
  localSortOrder.value = value
  setPage(1)
}

function setPerPage(value: number) {
  if (value === localPerPage.value) {
    return
  }
  localPerPage.value = value
  setPage(1)
}

function setSelection(value: unknown[]) {
  selection.value = value
}

function setFilters(nextFilters: Filters) {
  if (equal(filters.value, nextFilters)) {
    return
  }

  filters.value = nextFilters
  emit('onFiltersChange', nextFilters)
}

function clearFilters() {
  const nextFilters = { ...defaultFilters.value }

  if (equal(filters.value, nextFilters)) {
    return
  }

  filters.value = nextFilters
  emit('onFiltersChange', nextFilters)
}

function refresh() {
  isRefresh.value = true

  if (isLoadMore.value) {
    rows.value = []
    setPage(1)
  } else {
    getData()
  }
}

function loadMore() {
  if (hasMore.value && !isLoading.value) {
    localPage.value++
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

function updateColumn(name: string, prop: string, value: boolean | unknown) {
  columnSettings.value = setColumnSetting(columnSettings.value, name, prop, value)
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
  isRefresh,
  filters: filters.value,
  columnSettings,
  isEmpty,
  hasActiveFilters: computed(() => {
    return hasActiveFilters(filters.value, defaultFilters.value)
  }),
  columns: computed(() => {
    return getColumns(props.columns, rows.value)
  }),
}) as State

const context = reactive({
  ...toRefs(state),
  setPage,
  setPerPage,
  setSearch,
  setSortBy,
  setSortOrder,
  setFilters,
  clearFilters,
  loadMore,
  refresh,
  setSelection,
  updateRowById,
  updateColumn,
}) as Context

provide('shilp-list-context', context)

const snapshot = (): State => {
  return { ...state }
}

// Lifecycle 1, setup: state starts from the props and defaults. `stateManager.get` runs before any
// state exists and may restore page, perPage, sort, search, filters and columnSettings. A load-more
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

if (restored.columnSettings != null) {
  columnSettings.value = restored.columnSettings
}

if (restored.filters != null) {
  filters.value = restored.filters
}

// Every request after the first starts here. One flush covers several changes, so `setSearch` from
// page 3 (search and page both change) makes a single request.
// Do not narrow this to `localPage` only: perPage, search and sort changes also set the page to 1,
// but on page 1 that is not a change, so a `localPage` watcher would not fire and no request would
// start. If it is ever narrowed, the setters, `refresh` and the `filters` watcher need a helper that
// fetches directly when the page is already 1.
// Keep the watchers below the restore block (Lifecycle 1): they only react to changes made after
// they are created, so the restored values do not start a request. Moved above it, the restore
// would fire an extra request on top of the one from `onMounted`.
watch([localPage, localPerPage, localSearch, localSortBy, localSortOrder], () => {
  getData()
})

// Lifecycle 7, props changing after mount: only `filters` refetches, except before the first response
// has arrived. The query props (page, perPage, search, sortBy, sortOrder, endpoint) are read once;
// change them through the context actions. On page 1 the page watcher would not fire, so fetch here.
watch(filters, (newValue, oldValue) => {
  if (isInitialLoading.value) {
    return
  }

  if (equal(newValue, oldValue)) {
    return
  }

  if (localPage.value === 1) {
    getData()
  } else {
    setPage(1)
  }
})

// `onRowSelect` emits when the selection really changes, including the reset after a response.
watch(selection, (newValue, oldValue) => {
  const previous = oldValue ?? []

  if (hasSelectionChanged(newValue, previous)) {
    emit('onRowSelect', newValue, previous)
  }
})

// Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if the restored filters differ from
// the prop, then the first request.
onMounted(() => {
  props.stateManager?.init?.(snapshot())

  if (restored.filters != null && !equal(restored.filters, defaultFilters.value)) {
    emit('onFiltersChange', restored.filters)
  }

  getData()
})

// Lifecycle 8, unmount: invalidate the request in flight so its late response or error does not
// update state, call `stateManager.set` or emit events on a list that no longer exists.
onUnmounted(() => {
  requestId++
})

defineExpose(toRefs(context))
</script>
