<script setup lang="ts">
import {
  List,
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListGoTo,
  ListLoadMore,
  ListLoaderInitial,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListRows,
  ListSearch,
  ListSummary,
} from '@shilp.dev/vue-list'
import type {
  Context,
  Filter,
  PaginationMode,
  RequestHandlerResponse,
  RowId,
} from '@shilp.dev/vue-list'

import type { ColumnConfig, FilterConfig, Row } from '~/types/list'

const ALL = 'all'

const {
  title,
  endpoint,
  perPage,
  paginationMode,
  columns,
  filters,
  searchPlaceholder,
  initialResponse,
} = defineProps<{
  title: string
  /** The dummyjson resource to list, such as `users` or `products`. */
  endpoint: string
  /** Page size of `initialResponse`; the list starts with the same one. */
  perPage: number
  /** `pagination` shows numbered pages; `loadMore` appends the next page below the rows. */
  paginationMode: PaginationMode
  columns: ColumnConfig[]
  filters: FilterConfig[]
  searchPlaceholder: string
  /** First page fetched on the server, so the list paints without a client request. */
  initialResponse: RequestHandlerResponse<Row>
}>()

const initialFilters: Filter[] = filters.map(({ column }) => {
  return { column, value: undefined }
})

function getFilterItems(column: string) {
  const config = filters.find((item) => {
    return item.column === column
  })

  if (!config) {
    return []
  }

  return [{ value: ALL, label: `All ${config.label}` }, ...config.options]
}

function getFilterValue(value: unknown) {
  if (value == null) {
    return ALL
  }

  return String(value)
}

function resetState(context: Context) {
  context.clearState()
  window.location.reload()
}

function getColumnItems(context: Context) {
  return context.columns.map((column) => {
    return {
      label: column.label,
      type: 'checkbox' as const,
      checked: column.visibility,
      onUpdateChecked(checked: boolean) {
        context.setColumn(column.name, 'visibility', checked)
      },
      onSelect(event: Event) {
        event.preventDefault()
      },
    }
  })
}

function getTableColumns(context: Context) {
  const visible = context.columns
    .filter((column) => {
      return column.visibility
    })
    .map((column) => {
      return { accessorKey: column.name, header: column.label }
    })

  return [{ id: 'select' }, { accessorKey: '_index', header: '#' }, ...visible]
}

// Sorting is done by the API. A header click goes asc, then desc, then off. The list starts with
// `sort-order="asc"`, so the first click on a column is a single request.
function sort(context: Context, name: string) {
  if (context.sortBy !== name) {
    context.setSortBy(name)
    if (context.sortOrder !== 'asc') {
      context.setSortOrder('asc')
    }
  } else if (context.sortOrder === 'asc') {
    context.setSortOrder('desc')
  } else {
    context.setSortBy('')
  }
}

function getSortIcon(context: Context, name: string) {
  if (context.sortBy !== name) {
    return 'i-mdi-swap-vertical'
  }
  if (context.sortOrder === 'desc') {
    return 'i-mdi-arrow-down'
  }
  return 'i-mdi-arrow-up'
}

function isSortable(column: Context['columns'][number]) {
  return Boolean(column.isSortable)
}

function getAllChecked(context: Context) {
  if (context.selectionState === 'all') {
    return true
  }

  if (context.selectionState === 'partial') {
    return 'indeterminate'
  }

  return false
}

function getRowId(row: unknown) {
  return (row as Row).id as RowId
}
</script>

<template>
  <List
    :endpoint="endpoint"
    id-key="id"
    sort-order="asc"
    :per-page="perPage"
    :pagination-mode="paginationMode"
    :columns="columns"
    :filters="initialFilters"
    :request-handler="requestHandler"
    :state-manager="stateManager"
    :initial-response="initialResponse"
    class="flex flex-col gap-4"
  >
    <h1 class="text-2xl font-semibold">{{ title }}</h1>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <ListSearch v-slot="{ search, setSearch }">
        <UInput
          type="search"
          :model-value="search"
          :placeholder="searchPlaceholder"
          class="w-60"
          @update:model-value="setSearch"
        />
      </ListSearch>

      <div class="flex flex-wrap items-center gap-3">
        <ListFilters class="flex flex-wrap items-center gap-3">
          <template
            v-for="filter in filters"
            :key="filter.column"
            #[filter.column]="{ value, setValue }"
          >
            <USelect
              :model-value="getFilterValue(value)"
              :items="getFilterItems(filter.column)"
              class="w-40"
              @update:model-value="setValue($event === ALL ? undefined : $event)"
            />
          </template>
        </ListFilters>

        <ListColumns>
          <template #default="{ context }">
            <UDropdownMenu :items="getColumnItems(context)">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-mdi-view-column-outline"
                label="Columns"
              />
            </UDropdownMenu>
          </template>
        </ListColumns>

        <ListRefresh v-slot="{ context }">
          <div class="flex items-center gap-3">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-mdi-refresh"
              label="Refresh"
              :disabled="context.isLoading"
              @click="context.refresh()"
            />
            <UTooltip
              text="Clears the saved page, filters, sort, search and columns, then reloads."
            >
              <UButton
                color="neutral"
                variant="outline"
                icon="i-mdi-restore"
                label="Reset State"
                @click="resetState(context)"
              />
            </UTooltip>
          </div>
        </ListRefresh>
      </div>
    </div>

    <ListLoaderInitial>
      <div class="flex flex-col gap-2">
        <USkeleton v-for="index in 10" :key="index" class="h-10 w-full" />
      </div>
    </ListLoaderInitial>

    <ListError v-slot="{ context }">
      <UAlert
        color="error"
        :title="`Could not load ${title.toLowerCase()}`"
        :description="context.error?.message"
      />
    </ListError>

    <ListEmpty>
      <UEmpty
        icon="i-mdi-magnify-remove-outline"
        :title="`No ${title.toLowerCase()} found`"
        description="Try adjusting your search or filters."
        class="border border-default"
      />
    </ListEmpty>

    <ListRows v-slot="{ context }">
      <UTable
        :data="context.rows as Record<string, unknown>[]"
        :columns="getTableColumns(context)"
        :loading="context.isLoading"
      >
        <template #select-header>
          <UCheckbox
            :model-value="getAllChecked(context)"
            @update:model-value="context.toggleAllRowsSelection()"
          />
        </template>
        <template #select-cell="{ row }">
          <UCheckbox
            :model-value="context.selection.includes(getRowId(row.original))"
            @update:model-value="context.toggleRowSelection(getRowId(row.original))"
          />
        </template>
        <template v-for="column in context.columns" :key="column.name" #[`${column.name}-header`]>
          <UButton
            v-if="isSortable(column)"
            color="neutral"
            variant="ghost"
            class="-ml-2.5"
            :label="column.label"
            :trailing-icon="getSortIcon(context, column.name)"
            @click="sort(context, column.name)"
          />
          <span v-else>{{ column.label }}</span>
        </template>
      </UTable>
    </ListRows>

    <div
      v-if="paginationMode === 'pagination'"
      class="grid grid-cols-1 items-center gap-3 md:grid-cols-3"
    >
      <div class="flex gap-2">
        <ListPerPage v-slot="{ context, options }">
          <USelect
            :model-value="context.perPage"
            :items="
              options.map((option) => ({ label: `${option.label} per page`, value: option.value }))
            "
            class="w-40"
            @update:model-value="context.setPerPage(Number($event))"
          />
        </ListPerPage>
        <ListGoTo v-slot="{ context, pages }">
          <USelect
            :model-value="context.page"
            :items="pages.map((item) => ({ label: `Page ${item}`, value: item }))"
            class="w-28"
            @update:model-value="context.setPage(Number($event))"
          />
        </ListGoTo>
      </div>

      <ListSummary v-slot="{ context, from, to }">
        <p class="text-center text-sm text-muted">
          Showing {{ from }} - {{ to }} of {{ context.count }}
          <template v-if="context.selection.length">
            - {{ context.selection.length }} selected</template
          >
        </p>
      </ListSummary>

      <div class="flex flex-wrap items-center gap-3 md:justify-end">
        <ListPagination v-slot="{ context }">
          <UPagination
            :page="context.page"
            :items-per-page="context.perPage"
            :total="context.count"
            @update:page="context.setPage"
          />
        </ListPagination>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
      <div />

      <ListSummary v-slot="{ context, visibleCount }">
        <p class="text-center text-sm text-muted">
          Showing {{ visibleCount }} of {{ context.count }}
        </p>
      </ListSummary>

      <div class="flex md:justify-end">
        <ListLoadMore v-slot="{ context }">
          <UButton
            v-if="context.hasMore"
            color="neutral"
            variant="outline"
            icon="i-mdi-chevron-down"
            label="Load More"
            :loading="context.isLoading"
            @click="context.loadMore()"
          />
          <p v-else class="text-sm text-muted">You have reached the end.</p>
        </ListLoadMore>
      </div>
    </div>
  </List>
</template>
