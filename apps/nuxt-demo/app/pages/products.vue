<script setup lang="ts">
import {
  List,
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListLoadMore,
  ListLoaderInitial,
  ListPerPage,
  ListRows,
  ListSearch,
  ListSummary,
} from '@shilp.dev/vue-list'
import type { Column, Context, State } from '@shilp.dev/vue-list'

/*
 * Products list with "Load More" pagination.
 *
 * Every piece of UI below is a slot: the list only owns the data and the state, Nuxt UI owns
 * the markup.
 *
 * - `endpoint`        tells the shared `requestHandler` (utils/request-handler.ts) what to fetch.
 * - `paginationMode`  'loadMore' appends the next page to the rows instead of replacing them.
 * - `perPage`         initial page size. Users can change it with <ListPerPage>.
 * - `columns`         every column the table can show. `visibility` is managed by the list.
 * - `filters`         one entry per filter. The value is an array because the select is multiple;
 *                     an empty array means the filter is off.
 */
const columns: Column[] = [
  { name: 'title', label: 'Title' },
  { name: 'brand', label: 'Brand' },
  { name: 'category', label: 'Category' },
  { name: 'price', label: 'Price' },
  { name: 'rating', label: 'Rating', visibility: false },
  { name: 'stock', label: 'Stock', visibility: false },
]

const filters = [{ column: 'category', value: [] as string[] }]

const categories = ['beauty', 'fragrances', 'furniture', 'groceries', 'laptops', 'smartphones']

/*
 * First page fetched on the server with the same `requestHandler` the list uses, so the markup
 * ships with data (no loading flash) and the list skips its first client request. `perPage` matches
 * the `:per-page` below. `useAsyncData` runs on the server during SSR and hydrates the client.
 */
const perPage = 10

const { data: initialResponse } = await useAsyncData('products-initial', () => {
  return requestHandler({
    endpoint: 'products',
    page: 1,
    perPage,
    search: '',
    filters: filters.map(({ column, value }) => ({ column, value, isDirty: false })),
  } as unknown as State)
})

/*
 * UTable columns: a checkbox column and the row number (`_index`, added by the list and counted
 * across pages) always come first, then only the columns left visible in <ListColumns>.
 */
function getTableColumns(all: Column[]) {
  const visible = all
    .filter((column) => {
      return column.visibility
    })
    .map((column) => {
      return { accessorKey: column.name, header: column.label }
    })

  return [{ id: 'select' }, { accessorKey: '_index', header: '#' }, ...visible]
}

/*
 * Row selection lives in the list. `context.selection` holds the selected ids,
 * `toggleRowSelection` flips one id, `toggleAllRowsSelection` selects or clears every loaded row,
 * and `context.selectionState` is `'none' | 'partial' | 'all'`. Selection resets when new data arrives.
 *
 * UCheckbox wants `false | true | 'indeterminate'`, so map `selectionState` to that.
 */
function getAllSelectedState(context: Context) {
  if (context.selectionState === 'all') {
    return true
  }

  if (context.selectionState === 'partial') {
    return 'indeterminate'
  }

  return false
}

function getRowId(row: unknown) {
  return (row as { id: number }).id
}
</script>

<template>
  <List
    endpoint="products"
    :request-handler="requestHandler"
    :columns="columns"
    :filters="filters"
    :per-page="perPage"
    :initial-response="initialResponse ?? undefined"
    pagination-mode="loadMore"
    class="flex flex-col gap-4"
  >
    <h1 class="text-2xl font-semibold">Products</h1>

    <!-- Toolbar: search, filters, page size and column visibility. -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Search: `setSearch` is debounced, so the API is not called on every key stroke. -->
      <ListSearch v-slot="{ search, setSearch }">
        <UInput
          :model-value="search"
          icon="i-lucide-search"
          placeholder="Search products..."
          @update:model-value="setSearch"
        />
      </ListSearch>

      <!-- Filters: the slot is named after the filter column. `multiple` removes the need for a clear button: unselect a choice to remove it. -->
      <ListFilters>
        <template #category="{ value, setValue }">
          <USelectMenu
            multiple
            :model-value="value as string[]"
            :items="categories"
            :search-input="false"
            placeholder="Categories"
            class="w-48"
            @update:model-value="setValue"
          />
        </template>
      </ListFilters>

      <!-- Columns: `setColumn` toggles the `visibility` key of a column. -->
      <ListColumns>
        <template #columns="{ context }">
          <USelectMenu
            multiple
            value-key="name"
            label-key="label"
            :model-value="
              context.columns
                .filter((column) => column.visibility)
                .map((column) => column.name)
            "
            :items="context.columns as { name: string; label: string }[]"
            :search-input="false"
            placeholder="Columns"
            class="w-48"
            @update:model-value="
              (names: string[]) =>
                context.columns.forEach((column) =>
                  context.setColumn(column.name, 'visibility', names.includes(column.name)),
                )
            "
          />
        </template>
      </ListColumns>
    </div>

    <!-- States: first load, error and no results. Each one renders only when it applies. -->
    <ListLoaderInitial>
      <UProgress animation="carousel" />
    </ListLoaderInitial>

    <ListError v-slot="{ context }">
      <UAlert
        color="error"
        title="Could not load products"
        :description="context.error?.message"
      />
    </ListError>

    <ListEmpty>
      <UAlert color="neutral" variant="subtle" title="No products found" />
    </ListEmpty>

    <!-- Rows: the list gives us `rows`, we hand them to UTable. The checkbox column is filled through the `select-*` slots. -->
    <ListRows v-slot="{ context }">
      <UTable
        :data="context.rows as Record<string, unknown>[]"
        :columns="getTableColumns(context.columns)"
        :loading="context.isLoading"
      >
        <template #select-header>
          <UCheckbox
            :model-value="getAllSelectedState(context)"
            @update:model-value="context.toggleAllRowsSelection()"
          />
        </template>
        <template #select-cell="{ row }">
          <UCheckbox
            :model-value="context.selection.includes(getRowId(row.original))"
            @update:model-value="context.toggleRowSelection(getRowId(row.original))"
          />
        </template>
      </UTable>
    </ListRows>

    <!-- Table footer: per page on the left, summary in the center, Load More on the right. -->
    <div class="grid grid-cols-3 items-center gap-3">
      <div>
        <!-- Per page: `options` are the page sizes (10, 25, 50, 100 by default). -->
        <ListPerPage v-slot="{ context, options }">
          <USelect
            :model-value="context.perPage"
            :items="options.map((option) => ({ label: `${option.label} per page`, value: option.value }))"
            @update:model-value="context.setPerPage(Number($event))"
          />
        </ListPerPage>
      </div>

      <!-- Summary: `selection` holds the ids of the checked rows. -->
      <div class="justify-self-center">
        <ListSummary v-slot="{ context }">
          <p class="text-sm text-muted">
            Showing {{ context.rows.length }} of {{ context.count }}
            <template v-if="context.selection.length"> - {{ context.selection.length }} selected</template>
          </p>
        </ListSummary>
      </div>

      <!-- Load More: `hasMore` turns false once every product is loaded. -->
      <div class="justify-self-end">
        <ListLoadMore v-slot="{ context }">
          <UButton
            v-if="context.hasMore"
            label="Load More"
            color="neutral"
            variant="outline"
            :loading="context.isLoading"
            @click="context.loadMore()"
          />
        </ListLoadMore>
      </div>
    </div>
  </List>
</template>
