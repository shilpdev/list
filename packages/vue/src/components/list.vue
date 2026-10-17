<template>
  <div class="shilp-list">
    <slot v-bind="context" />
  </div>
</template>

<script setup lang="ts">
import equal from 'fast-deep-equal'
import { computed, onMounted, provide, reactive, ref, toRefs, watch } from 'vue'
import type {
  ColumnSettings,
  Context,
  Events,
  Filters,
  RequestHandlerResponse,
  SortOrder,
  State,
} from '../../../../shared'
import {
  computeHasMore,
  hasSelectionChanged,
  getColumns,
  getQueryChange,
  getRestoredState,
  hasActiveFilters,
  mergeRows,
  patchRowById,
  rowNotFoundMessage,
  setColumnSetting,
  toError,
} from '../../../../shared/utils'
import {
  DEFAULT_COUNT,
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
} from '../../../../shared/constants'
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

const defaultFilters = ref<Filters>({ ...(filters.value ?? {}) })

const isLoadMore = computed(() => {
  return props.paginationMode === 'loadMore'
})

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search ?? DEFAULT_SEARCH)
const columnSettings = ref<ColumnSettings>({})

const rows = ref<unknown[]>([])
const selection = ref<unknown[]>([])
const error = ref<Error | null>(null)
const response = ref<RequestHandlerResponse | null>(null)
const count = ref(props.count ?? DEFAULT_COUNT)
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

function getData(refreshing = false) {
  error.value = null
  isLoading.value = true
  isRefresh.value = refreshing
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
      isInitialLoading.value = false
      isLoading.value = false
      isRefresh.value = false
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
      isInitialLoading.value = false
      emit('onError', error.value)
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
  if (!value) {
    return
  }

  localPage.value = value
  getData(refreshing)
}

function setPage(value: number) {
  fetchPage(value)
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
  endpoint: computed(() => {
    return props.endpoint
  }),
  version: computed(() => {
    return props.version
  }),
  meta: computed(() => {
    return props.meta
  }),
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
  filters: computed(() => {
    return filters.value ?? {}
  }),
  columns: computed(() => {
    return getColumns(props.columns, rows.value)
  }),
  columnSettings,
  isEmpty,
  hasActiveFilters: computed(() => {
    return hasActiveFilters(filters.value, defaultFilters.value)
  }),
  idKey: computed(() => {
    return props.idKey
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

watch(filters, (newValue, oldValue) => {
  if (isInitialLoading.value) {
    return
  }

  if (equal(newValue, oldValue)) {
    return
  }

  setPage(1)
})

watch(
  () => {
    return {
      page: props.page,
      perPage: props.perPage,
      search: props.search ?? DEFAULT_SEARCH,
      sortBy: props.sortBy,
      sortOrder: props.sortOrder,
      endpoint: props.endpoint,
    }
  },
  (next, prev) => {
    if (isInitialLoading.value) {
      return
    }

    const patch = getQueryChange(prev, next)

    if (!patch) {
      return
    }

    if (patch.perPage != null) {
      localPerPage.value = patch.perPage
    }

    if (patch.search != null) {
      localSearch.value = patch.search
    }

    if (patch.sortBy != null) {
      localSortBy.value = patch.sortBy
    }

    if (patch.sortOrder != null) {
      localSortOrder.value = patch.sortOrder
    }

    setPage(patch.page ?? 1)
  },
)

watch(selection, (newValue, oldValue) => {
  const previous = oldValue ?? []

  if (hasSelectionChanged(newValue, previous)) {
    emit('onRowSelect', newValue, previous)
  }
})

onMounted(() => {
  props.stateManager?.init?.(snapshot())

  if (restored.filters != null && !equal(restored.filters, defaultFilters.value)) {
    emit('onFiltersChange', restored.filters)
  }

  setPage(localPage.value)
})

defineExpose(toRefs(context))
</script>
