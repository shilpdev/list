<template>
  <div class="v-list">
    <slot v-bind="listState" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  AttrSettings,
  Filters,
  ListResponse,
  ListState,
  RequestContextPatch,
  SavedListState,
  SortOrder,
  StateManagerContext,
} from '@7span/list-types'
import type { ListEmits, ListProps } from '../types'
import { LIST_CONTEXT_KEY } from '../composables/use-list-context'
import { deepEqual, hasActiveFilters } from '../list-utils'
import { attrSerializer } from '../utils'

defineOptions({
  name: 'List',
})

type ListComponentProps = Omit<ListProps, 'filters'>

const props = withDefaults(defineProps<ListComponentProps>(), {
  page: 1,
  perPage: 25,
  sortBy: '',
  sortOrder: 'desc',
  search: '',
  version: 1,
  paginationMode: 'pagination',
  meta: () => ({}),
  initialItems: () => [],
  syncPageToUrl: undefined,
  hasPaginationHistory: undefined,
})

const emit = defineEmits<ListEmits>()
const filters = defineModel<Filters>('filters', { default: () => ({}) })

const route = useRoute()
const router = useRouter()

if (!props.requestHandler) {
  throw new Error('List: requestHandler is required.')
}

const requestHandler = props.requestHandler
const stateManager = props.stateManager
const defaultFilters = ref<Filters>({ ...(filters.value ?? {}) })

const syncPageToUrl = computed(
  () => props.syncPageToUrl ?? props.hasPaginationHistory ?? true,
)

const isLoadMore = computed(() => props.paginationMode === 'loadMore')

const localPage = ref<number>(props.page)
const localPerPage = ref<number>(props.perPage)
const localSortBy = ref<string>(props.sortBy)
const localSortOrder = ref<SortOrder>(props.sortOrder)
const localSearch = ref<string>(props.search ?? '')
const attrSettings = ref<AttrSettings>()

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err))

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
  attrSettings: attrSettings.value,
})

function getSavedState(): SavedListState {
  try {
    return stateManager?.get?.(buildContext()) ?? {}
  } catch (err) {
    console.error(err)
    return {}
  }
}

const savedState = getSavedState()

if (isLoadMore.value) {
  localPage.value = 1
} else if (syncPageToUrl.value && route.query.page) {
  localPage.value = Number(route.query.page)
} else if (savedState.page != null) {
  localPage.value = savedState.page
}

if (savedState.perPage != null) localPerPage.value = savedState.perPage
if (savedState.sortBy != null) localSortBy.value = savedState.sortBy
if (savedState.sortOrder != null) localSortOrder.value = savedState.sortOrder
if (savedState.search != null) localSearch.value = savedState.search
if (savedState.attrSettings != null) attrSettings.value = savedState.attrSettings
if (savedState.filters != null) filters.value = savedState.filters

const items = ref<unknown[]>([])
const selection = ref<unknown[]>([])
const error = ref<Error | null>(null)
const response = ref<ListResponse | null>(null)
const count = ref(0)
const isLoading = ref(false)
const initializingState = ref(!props.initialItems.length)

const serializedAttrs = computed(() => {
  const attrs =
    props.attrs || Object.keys((items.value[0] as Record<string, unknown>) || {})
  return attrSerializer(attrs)
})

const isEmpty = computed(() => items.value.length === 0)

function notifyResponse(res: ListResponse) {
  emit('onResponse', res)
}

function notifyAfterPageChange(res: ListResponse) {
  emit('afterPageChange', res)
}

function notifyAfterLoadMore(res: ListResponse) {
  emit('afterLoadMore', res)
}

function setItems(res: ListResponse) {
  notifyResponse(res)

  if (isLoadMore.value) {
    if (localPage.value === 1) {
      items.value = res.items
    } else {
      items.value = items.value.concat(res.items)
    }
    notifyAfterLoadMore(res)
  } else {
    items.value = res.items
    notifyAfterPageChange(res)
  }

  count.value = res.count
}

function updateStateManager() {
  stateManager?.set?.(buildContext())
}

function getData(addContext: RequestContextPatch = {}) {
  error.value = null
  isLoading.value = true

  requestHandler({
    ...buildContext(),
    isRefresh: false,
    ...addContext,
  })
    .then((res) => {
      response.value = res
      updateStateManager()
      selection.value = []
      setItems(res)
      updateUrl()
      initializingState.value = false
    })
    .catch((err: unknown) => {
      error.value = toError(err)
      items.value = []
      count.value = 0
      initializingState.value = false
      throw toError(err)
    })
    .finally(() => {
      isLoading.value = false
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
  filters.value = nextFilters
}

function clearFilters() {
  filters.value = { ...defaultFilters.value }
}

function refresh(addContext: RequestContextPatch = { isRefresh: true }) {
  if (isLoadMore.value) {
    items.value = []
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

function updateItemById(item: Partial<unknown>, id: string | number) {
  items.value = items.value.map((entry) => {
    const record = entry as Record<string, unknown> & { id?: string | number }
    if (record.id === id) {
      return { ...(entry as Record<string, unknown>), ...item }
    }
    return entry
  })
}

function updateAttr(name: string, prop: string, value: boolean | unknown) {
  if (!attrSettings.value) {
    attrSettings.value = {}
  }
  if (!attrSettings.value[name]) {
    attrSettings.value[name] = {}
  }
  attrSettings.value[name][prop] = value
  updateStateManager()
}

function updateUrl() {
  if (
    !isLoadMore.value &&
    syncPageToUrl.value &&
    route.query.page != String(localPage.value)
  ) {
    router.push({
      query: {
        ...(route.query || {}),
        page: localPage.value,
      },
    })
  }
}

const listState = computed(
  (): ListState => ({
    data: items.value,
    response: response.value,
    error: error.value,
    count: count.value,
    selection: selection.value,
    pagination: {
      page: localPage.value,
      perPage: localPerPage.value,
      hasMore: items.value.length < count.value,
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
    attrs: serializedAttrs.value,
    attrSettings: attrSettings.value,
    isEmpty: isEmpty.value,
    hasActiveFilters: hasActiveFilters(filters.value ?? {}, defaultFilters.value),
    isInitializing: initializingState.value,
    setPage,
    setPerPage,
    setSearch,
    setSort,
    setFilters,
    clearFilters,
    loadMore,
    refresh,
    setSelection,
    updateItemById,
    updateAttr,
  }),
)

provide(LIST_CONTEXT_KEY, { listState })

watch(filters, (newValue, oldValue) => {
  if (initializingState.value) return
  if (deepEqual(newValue, oldValue)) return
  setPage(1)
})

watch(selection, (newValue, oldValue) => {
  emit('onItemSelect', newValue, oldValue ?? [])
})

watch(
  () => route.query.page,
  (newValue) => {
    if (!syncPageToUrl.value || isLoadMore.value) return

    if (!newValue) {
      setPage(1)
    } else if (localPage.value !== Number(newValue)) {
      setPage(Number(newValue))
    }
  },
)

if (!attrSettings.value) {
  const settings: AttrSettings = {}
  for (const item of serializedAttrs.value) {
    settings[item.name] = { visible: true }
  }
  attrSettings.value = settings
}

stateManager?.init?.(buildContext())

if (props.initialItems.length) {
  items.value = [...props.initialItems]
  count.value = props.count ?? props.initialItems.length
  initializingState.value = false
} else {
  setPage(localPage.value)
}

defineExpose({
  items,
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
  updateItemById,
})
</script>
