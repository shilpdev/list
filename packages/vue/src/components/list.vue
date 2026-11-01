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
  InitialState,
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
  hasSelectionChanged,
  mergeRows,
  toError,
  toggleAllIds,
  toggleId,
  computeFilters,
  computeDefaultFilters,
  createColumns,
  hasSavedState,
  applySavedState,
} from '@shared/utils'
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

/*
 * Lifecycle 1, setup. `stateManager.get` runs before the refs exist, so each ref starts with its
 * final value instead of being assigned and then overwritten. A load-more list ignores a saved
 * page because it always starts on page 1.
 */
const initial: InitialState = {
  endpoint,
  version,
  meta,
  idKey,
  page,
  perPage,
  sortBy,
  sortOrder,
  search,
  filters: defaultFilters,
  columns: createColumns(columns),
}
const saved = stateManager?.get?.(initial) ?? {}
const start = applySavedState(initial, saved, isLoadMore.value)

const localPage = ref<number>(start.page)
const localPerPage = ref<number>(start.perPage)
const localSortBy = ref<string>(start.sortBy)
const localSortOrder = ref<SortOrder>(start.sortOrder)
const localSearch = ref<string>(start.search)
const localFilters = ref<FilterState[]>(start.filters)
const localColumns = ref<Column[]>(start.columns)

const rows = ref<unknown[]>([])
const selection = ref<RowId[]>([])
const error = ref<Error | null>(null)
const response = ref<RequestHandlerResponse | null>(null)
const totalRows = ref(0)
const isLoading = ref(true)
const isInitialLoading = ref(true)
const requestTrigger = ref<RequestTrigger>('mount')
let requestId = 0

const isEmpty = computed(() => {
  return rows.value.length === 0
})

const hasMore = computed(() => {
  return computeHasMore(localPage.value, localPerPage.value, totalRows.value)
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

/*
 * Lifecycle 3 to 5, one request. Only the latest request counts (`requestId`).
 * 3. Request: the `before*` event gets the State being requested, then `requestHandler` runs.
 * 4. Response: rows are replaced (page mode) or appended (load-more), selection resets, then
 *    `stateManager.set`, `onResponse` and the `after*` event run.
 * 5. Error: `error` is set, rows and totalRows are cleared and `onError` emits.
 */
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
      totalRows.value = res.totalRows
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
      totalRows.value = 0
      emit('onError', error.value)
      /*
       * The list UI already surfaces the error via `error`.
       * Re-throwing here creates unhandled promise rejections.
       */
    })
    .finally(() => {
      if (currentRequestId !== requestId) {
        return
      }
      isLoading.value = false
      isInitialLoading.value = false
    })
}

/*
 * Lifecycle 6, actions. A query-changing action sets its ref, then `fetchPage` requests straight
 * away. The action sets `requestTrigger` first so `requestHandler` and the `before*` event can
 * read what started the request.
 */
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
  totalRows,
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
  setColumn,
}) as Context

provide('shilp-list-context', context)

const snapshot = (): State => {
  return { ...state }
}

/*
 * A seeded list shows `initialResponse` without a request, but only when nothing was restored:
 * saved values may ask for another query, so then the list fetches.
 */
let isSeeded = false

if (initialResponse != null) {
  response.value = initialResponse
  rows.value = mergeRows(rows.value, initialResponse.rows, {
    page: localPage.value,
    perPage: localPerPage.value,
    isLoadMore: isLoadMore.value,
  })
  totalRows.value = initialResponse.totalRows
  isLoading.value = false
  isInitialLoading.value = false
  isSeeded = !hasSavedState(saved)
}

/*
 * Lifecycle 7, props changing after mount. The query props are read once, so a later change goes
 * through an action. A filters or columns change refetches, except before the first response:
 * the first request is already on its way.
 */
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

/*
 * Lifecycle 2, mount: `stateManager.init`, then `onFiltersChange` if a restore changed the
 * filters, then the first request (skipped for a seeded list).
 */
onMounted(() => {
  init()
})

/*
 * Lifecycle 8, unmount: drop the request in flight so a late response does not update state or
 * emit events on a list that no longer exists.
 */
onUnmounted(() => {
  requestId++
})

defineExpose(toRefs(context))
</script>
