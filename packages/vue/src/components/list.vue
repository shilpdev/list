<template>
  <div class="vue-list">
    <slot v-bind="listState" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import type {
  ColumnSettings,
  Filters,
  ListResponse,
  ListState,
  RequestContextPatch,
  SavedListState,
  SortOrder,
  StateManagerContext,
} from '../../../../shared'
import { LIST_CONTEXT_KEY } from '../composables/use-list-context'
import { deepEqual, hasActiveFilters } from '../list-utils'
import type { VueListEmits, VueListProps } from '../types'
import { DEFAULT_ID_KEY, getRowId } from '../utils'

defineOptions({
  name: 'VueList',
})

type VueListComponentProps = Omit<VueListProps, 'filters'>

const props = withDefaults(defineProps<VueListComponentProps>(), {
  idKey: DEFAULT_ID_KEY,
  page: 1,
  perPage: 25,
  sortBy: '',
  sortOrder: 'desc',
  search: '',
  version: 1,
  paginationMode: 'pagination',
  meta: () => ({}),
})

const emit = defineEmits<VueListEmits>()
const filters = defineModel<Filters>('filters', { default: () => ({}) })

if (!props.requestHandler) {
  throw new Error('VueList: requestHandler is required.')
}

const defaultFilters = ref<Filters>({ ...(filters.value ?? {}) })

const isLoadMore = computed(() => props.paginationMode === 'loadMore')

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search ?? '')
const columnSettings = ref<ColumnSettings>()

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)))

const buildContext = (): StateManagerContext => ({
  endpoint: props.endpoint,
  version: props.version,
  meta: props.meta,
  search: localSearch.value,
  page: localPage.value,
  perPage: localPerPage.value,
  sortBy: localSortBy.value,
  sortOrder: localSortOrder.value,
  filters: filters.value ?? {},
  columnSettings: columnSettings.value,
})

function getSavedState(): SavedListState {
  try {
    return props.stateManager?.get?.(buildContext()) ?? {}
  } catch (err) {
    console.error(err)
    return {}
  }
}

const savedState = getSavedState()

if (isLoadMore.value) {
  localPage.value = 1
} else if (savedState.page != null) {
  localPage.value = savedState.page
}

if (savedState.perPage != null) localPerPage.value = savedState.perPage
if (savedState.sortBy != null) localSortBy.value = savedState.sortBy
if (savedState.sortOrder != null) localSortOrder.value = savedState.sortOrder
if (savedState.search != null) localSearch.value = savedState.search
if (savedState.columnSettings != null) columnSettings.value = savedState.columnSettings
if (savedState.filters != null) filters.value = savedState.filters

const rows = ref<unknown[]>([])
const selection = ref<unknown[]>([])
const error = ref<Error | null>(null)
const response = ref<ListResponse | null>(null)
const count = ref(props.count ?? 0)
const isLoading = ref(true)
const initializingState = ref(true)
let requestId = 0

const isEmpty = computed(() => rows.value.length === 0)

function setRows(res: ListResponse) {
  emit('onResponse', res)
  props.onResponse?.(res)

  if (isLoadMore.value) {
    if (localPage.value === 1) {
      rows.value = res.rows
    } else {
      rows.value = rows.value.concat(res.rows)
    }
    emit('afterLoadMore', res)
    props.afterLoadMore?.(res)
  } else {
    rows.value = res.rows
    emit('afterPageChange', res)
    props.afterPageChange?.(res)
  }

  count.value = res.count
}

function updateStateManager() {
  props.stateManager?.set?.(buildContext())
}

function getData(addContext: RequestContextPatch = {}) {
  error.value = null
  isLoading.value = true
  const currentRequestId = ++requestId

  props
    .requestHandler({
      ...buildContext(),
      isRefresh: false,
      ...addContext,
    })
    .then((res) => {
      if (currentRequestId !== requestId) return
      response.value = res
      updateStateManager()
      selection.value = []
      setRows(res)
      initializingState.value = false
    })
    .catch((err: unknown) => {
      if (currentRequestId !== requestId) return
      error.value = toError(err)
      rows.value = []
      count.value = 0
      initializingState.value = false
      // The list UI already surfaces the error via `error`.
      // Re-throwing here creates unhandled promise rejections.
    })
    .finally(() => {
      if (currentRequestId === requestId) {
        isLoading.value = false
      }
    })
}

function setPage(value: number | string, addContext?: RequestContextPatch) {
  let nextPage: number | string = value
  if (value === 0) {
    nextPage = ''
  }
  if (nextPage === '') {
    return
  }
  localPage.value = Number(nextPage)
  getData(addContext)
}

function setSearch(value: string) {
  if (value === localSearch.value) return
  localSearch.value = value
  setPage(1)
}

function setSort({ by, order }: { by: string; order: 'asc' | 'desc' }) {
  localSortBy.value = by
  localSortOrder.value = order
  setPage(1)
}

function setSelection(value: unknown[]) {
  selection.value = value
}

function setFilters(nextFilters: Filters) {
  if (deepEqual(filters.value, nextFilters)) return
  filters.value = nextFilters
  emit('onFiltersChange', nextFilters)
  props.onFiltersChange?.(nextFilters)
}

function clearFilters() {
  const nextFilters = { ...defaultFilters.value }
  if (deepEqual(filters.value, nextFilters)) return
  filters.value = nextFilters
  emit('onFiltersChange', nextFilters)
  props.onFiltersChange?.(nextFilters)
}

function refresh(addContext: RequestContextPatch = { isRefresh: true }) {
  if (isLoadMore.value) {
    rows.value = []
    setPage(1, addContext)
  } else {
    getData(addContext)
  }
}

function setPerPage(value: number) {
  localPerPage.value = value
  setPage(1)
}

function loadMore() {
  const hasMore = localPage.value * localPerPage.value < count.value
  if (hasMore && !isLoading.value) {
    localPage.value++
    getData()
  }
}

function updateRowById(row: Partial<unknown>, id: string | number) {
  let matched = false

  const next = rows.value.map((entry) => {
    if (getRowId(entry, props.idKey) !== id) return entry
    matched = true
    return { ...(entry as Record<string, unknown>), ...row }
  })

  if (!matched) {
    console.warn(
      `VueList: updateRowById did not find a row where ${props.idKey} === ${JSON.stringify(id)}. ` +
      `Verify your rows expose "${props.idKey}" and that the id type matches exactly.`,
    )
    return
  }

  rows.value = next
}

function updateColumn(name: string, prop: string, value: boolean | unknown) {
  const current = columnSettings.value ?? {}
  columnSettings.value = {
    ...current,
    [name]: {
      ...current[name],
      [prop]: value,
    },
  }
  updateStateManager()
}

const listState = computed(
  (): ListState => ({
    rows: rows.value,
    response: response.value,
    error: error.value,
    count: count.value,
    selection: selection.value,
    pagination: {
      page: localPage.value,
      perPage: localPerPage.value,
      hasMore: rows.value.length < count.value,
    },
    loader: {
      isLoading: isLoading.value,
      initialLoading: initializingState.value,
    },
    sort: {
      sortBy: localSortBy.value || null,
      sortOrder: localSortOrder.value,
    },
    search: localSearch.value,
    filters: filters.value ?? {},
    columns:
      props.columns ??
      Object.keys((rows.value[0] as Record<string, unknown>) || {}).map((name) => ({ name })),
    columnSettings: columnSettings.value,
    isEmpty: isEmpty.value,
    hasActiveFilters: hasActiveFilters(filters.value ?? {}, defaultFilters.value),
    isInitializing: initializingState.value,
    idKey: props.idKey,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
    loadMore,
    refresh,
    setSelection,
    updateRowById,
    updateColumn,
  }),
)

provide(LIST_CONTEXT_KEY, { listState })

watch(filters, (newValue, oldValue) => {
  if (initializingState.value) return
  if (deepEqual(newValue, oldValue)) return
  setPage(1)
})

watch(selection, (newValue, oldValue) => {
  emit('onRowSelect', newValue, oldValue ?? [])
  props.onRowSelect?.(newValue, oldValue ?? [])
})

onMounted(() => {
  props.stateManager?.init?.(buildContext())
  setPage(localPage.value)
})

defineExpose({
  rows,
  response,
  isLoading,
  error,
  count,
  selection,
  setPage,
  setPerPage,
  setSort,
  setSearch,
  setSelection,
  refresh,
  loadMore,
  setFilters,
  clearFilters,
  updateRowById,
  updateColumn,
})
</script>
