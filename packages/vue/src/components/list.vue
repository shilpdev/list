<template>
  <div class="vue-list">
    <slot v-bind="context" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, reactive, ref, toRefs, watch } from 'vue'
import type {
  ColumnSettings,
  Context,
  Filters,
  ListResponse,
  SortOrder,
  State,
} from '../../../../shared'
import { LIST_CONTEXT_KEY } from '../composables/use-list-context'
import { deepEqual, hasActiveFilters } from '../list-utils'
import type { ShilpListEmits, ShilpListProps } from '../types'
import { DEFAULT_ID_KEY, getRowId } from '../utils'

defineOptions({
  name: 'ShilpList',
})

type ShilpListComponentProps = Omit<
  ShilpListProps,
  'filters' | 'onResponse' | 'onRowSelect' | 'onFiltersChange'
>

const props = withDefaults(defineProps<ShilpListComponentProps>(), {
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

const emit = defineEmits<ShilpListEmits>()
const filters = defineModel<Filters>('filters', { default: () => ({}) })

if (!props.requestHandler) {
  throw new Error('ShilpList: requestHandler is required.')
}

const defaultFilters = ref<Filters>({ ...(filters.value ?? {}) })

const isLoadMore = computed(() => props.paginationMode === 'loadMore')

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search ?? '')
const columnSettings = ref<ColumnSettings>({})

const toError = (err: unknown): Error => (err instanceof Error ? err : new Error(String(err)))

const rows = ref<unknown[]>([])
const selection = ref<unknown[]>([])
const error = ref<Error | null>(null)
const response = ref<ListResponse | null>(null)
const count = ref(props.count ?? 0)
const isLoading = ref(true)
const isInitialLoading = ref(true)
const isRefresh = ref(false)
let requestId = 0

const isEmpty = computed(() => rows.value.length === 0)
const hasMore = computed(() => localPage.value * localPerPage.value < count.value)

function setRows(res: ListResponse) {
  if (isLoadMore.value && localPage.value > 1) {
    rows.value = rows.value.concat(res.rows)
  } else {
    rows.value = res.rows
  }
  count.value = res.count
}

function notify(res: ListResponse) {
  emit('response', res)

  if (isLoadMore.value) {
    emit('afterLoadMore', res)
    props.afterLoadMore?.(res)
  } else {
    emit('afterPageChange', res)
    props.afterPageChange?.(res)
  }
}

function updateStateManager() {
  props.stateManager?.set?.(snapshot())
}

function getData(refreshing = false) {
  error.value = null
  isLoading.value = true
  isRefresh.value = refreshing
  const currentRequestId = ++requestId

  props
    .requestHandler(snapshot())
    .then((res) => {
      if (currentRequestId !== requestId) return
      response.value = res
      selection.value = []
      setRows(res)
      isInitialLoading.value = false
      isLoading.value = false
      isRefresh.value = false
      updateStateManager()
      notify(res)
    })
    .catch((err: unknown) => {
      if (currentRequestId !== requestId) return
      error.value = toError(err)
      rows.value = []
      count.value = 0
      isInitialLoading.value = false
      // The list UI already surfaces the error via `error`.
      // Re-throwing here creates unhandled promise rejections.
    })
    .finally(() => {
      if (currentRequestId === requestId) {
        isLoading.value = false
        isRefresh.value = false
      }
    })
}

function fetchPage(value: number, refreshing = false) {
  if (!value) return
  localPage.value = value
  getData(refreshing)
}

function setPage(value: number) {
  fetchPage(value)
}

function setSearch(value: string) {
  if (value === localSearch.value) return
  localSearch.value = value
  setPage(1)
}

function setSortBy(value: string) {
  if (value === localSortBy.value) return
  localSortBy.value = value
  setPage(1)
}

function setSortOrder(value: SortOrder) {
  if (value === localSortOrder.value) return
  localSortOrder.value = value
  setPage(1)
}

function setSelection(value: unknown[]) {
  selection.value = value
}

function setFilters(nextFilters: Filters) {
  if (deepEqual(filters.value, nextFilters)) return
  filters.value = nextFilters
  emit('filtersChange', nextFilters)
}

function clearFilters() {
  const nextFilters = { ...defaultFilters.value }
  if (deepEqual(filters.value, nextFilters)) return
  filters.value = nextFilters
  emit('filtersChange', nextFilters)
}

function refresh() {
  if (isLoadMore.value) {
    rows.value = []
    fetchPage(1, true)
  } else {
    getData(true)
  }
}

function setPerPage(value: number) {
  localPerPage.value = value
  setPage(1)
}

function loadMore() {
  if (hasMore.value && !isLoading.value) {
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
      `ShilpList: updateRowById did not find a row where ${props.idKey} === ${JSON.stringify(id)}. ` +
      `Verify your rows expose "${props.idKey}" and that the id type matches exactly.`,
    )
    return
  }

  rows.value = next
}

function updateColumn(name: string, prop: string, value: boolean | unknown) {
  const current = columnSettings.value
  columnSettings.value = {
    ...current,
    [name]: {
      ...current[name],
      [prop]: value,
    },
  }
  updateStateManager()
}

const state = reactive({
  endpoint: computed(() => props.endpoint),
  version: computed(() => props.version),
  meta: computed(() => props.meta),
  rows,
  response,
  error,
  count,
  selection,
  page: localPage,
  perPage: localPerPage,
  hasMore,
  isLoading,
  isInitialLoading,
  isRefresh,
  sortBy: localSortBy,
  sortOrder: localSortOrder,
  search: localSearch,
  filters: computed(() => filters.value ?? {}),
  columns: computed(
    () =>
      props.columns ??
      Object.keys((rows.value[0] as Record<string, unknown>) || {}).map((name) => ({ name })),
  ),
  columnSettings,
  isEmpty,
  hasActiveFilters: computed(() => hasActiveFilters(filters.value ?? {}, defaultFilters.value)),
  idKey: computed(() => props.idKey),
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

provide(LIST_CONTEXT_KEY, context)

/** Copy of the current state, handed to `requestHandler` and `stateManager`. */
const snapshot = (): State => ({ ...state })

let saved: Partial<State> = {}
try {
  saved = props.stateManager?.get?.(snapshot()) ?? {}
} catch (err) {
  console.error(err)
}

if (isLoadMore.value) {
  localPage.value = 1
} else if (saved.page != null) {
  localPage.value = saved.page
}

if (saved.perPage != null) localPerPage.value = saved.perPage
if (saved.sortBy != null) localSortBy.value = saved.sortBy
if (saved.sortOrder != null) localSortOrder.value = saved.sortOrder
if (saved.search != null) localSearch.value = saved.search
if (saved.columnSettings != null) columnSettings.value = saved.columnSettings
if (saved.filters != null) filters.value = saved.filters

watch(filters, (newValue, oldValue) => {
  if (isInitialLoading.value) return
  if (deepEqual(newValue, oldValue)) return
  setPage(1)
})

watch(
  () =>
    [
      props.page,
      props.perPage,
      props.search ?? '',
      props.sortBy,
      props.sortOrder,
      props.endpoint,
    ] as const,
  (next, prev) => {
    if (isInitialLoading.value || !prev) return

    const [page, perPage, search, sortBy, sortOrder, endpoint] = next
    const [prevPage, prevPerPage, prevSearch, prevSortBy, prevSortOrder, prevEndpoint] = prev
    const pageChanged = page !== prevPage
    const perPageChanged = perPage !== prevPerPage
    const searchChanged = search !== prevSearch
    const sortByChanged = sortBy !== prevSortBy
    const sortOrderChanged = sortOrder !== prevSortOrder
    const endpointChanged = endpoint !== prevEndpoint

    if (
      !pageChanged &&
      !perPageChanged &&
      !searchChanged &&
      !sortByChanged &&
      !sortOrderChanged &&
      !endpointChanged
    ) {
      return
    }

    if (perPageChanged) localPerPage.value = perPage
    if (searchChanged) localSearch.value = search
    if (sortByChanged) localSortBy.value = sortBy
    if (sortOrderChanged) localSortOrder.value = sortOrder

    setPage(pageChanged ? page : 1)
  },
)

watch(selection, (newValue, oldValue) => {
  emit('rowSelect', newValue, oldValue ?? [])
})

onMounted(() => {
  props.stateManager?.init?.(snapshot())
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
  setSortBy,
  setSortOrder,
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
