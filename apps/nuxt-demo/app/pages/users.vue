<script setup lang="ts">
import {
  List,
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListLoaderInitial,
  ListPagination,
  ListPerPage,
  ListRows,
  ListSearch,
  ListSummary,
} from '@shilp.dev/vue-list'
import type { Column, Context, State } from '@shilp.dev/vue-list'

/*
 * Users list with numbered pagination.
 *
 * Every piece of UI below is a slot: the list only owns the data and the state, Nuxt UI owns
 * the markup.
 *
 * - `endpoint`        tells the shared `requestHandler` (utils/request-handler.ts) what to fetch.
 * - `paginationMode`  left out on purpose: the default, 'pagination', shows one page at a time.
 * - `perPage`         initial page size. Users can change it with <ListPerPage>.
 * - `columns`         every column the table can show. `visibility` is managed by the list.
 * - `filters`         one entry per filter. The value is an array because the select is multiple;
 *                     an empty array means the filter is off.
 */
const columns: Column[] = [
  { name: 'firstName', label: 'First name' },
  { name: 'lastName', label: 'Last name' },
  { name: 'email', label: 'Email' },
  { name: 'gender', label: 'Gender' },
  { name: 'phone', label: 'Phone', visibility: false },
  { name: 'role', label: 'Role', visibility: false },
]

const filters = [{ column: 'gender', value: [] as string[] }]

const genders = ['male', 'female']

/*
 * First page fetched on the server with the same `requestHandler` the list uses, so the markup
 * ships with data (no loading flash) and the list skips its first client request. `perPage` matches
 * the `:per-page` below. `useAsyncData` runs on the server during SSR and hydrates the client.
 */
const perPage = 10

const { data: initialResponse } = await useAsyncData('users-initial', () => {
  return requestHandler({
    endpoint: 'users',
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
    endpoint="users"
    :request-handler="requestHandler"
    :columns="columns"
    :filters="filters"
    :per-page="perPage"
    :initial-response="initialResponse ?? undefined"
    class="flex flex-col gap-4"
  >
    <h1 class="text-2xl font-semibold">Users</h1>

    <!-- Toolbar: search, filters, page size and column visibility. -->
    <div class="flex flex-wrap items-center gap-3">
      <!-- Search: `setSearch` is debounced, so the API is not called on every key stroke. -->
      <ListSearch v-slot="{ search, setSearch }">
        <UInput
          :model-value="search"
          icon="i-lucide-search"
          placeholder="Search users..."
          @update:model-value="setSearch"
        />
      </ListSearch>

      <!-- Filters: the slot is named after the filter column. `multiple` removes the need for a clear button: unselect a choice to remove it. -->
      <ListFilters>
        <template #gender="{ value, setValue }">
          <USelectMenu
            multiple
            :model-value="value as string[]"
            :items="genders"
            :search-input="false"
            placeholder="Genders"
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
        title="Could not load users"
        :description="context.error?.message"
      />
    </ListError>

    <ListEmpty>
      <UAlert color="neutral" variant="subtle" title="No users found" />
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

    <!-- Table footer: per page on the left, summary in the center, pagination on the right. -->
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
        <ListSummary v-slot="{ context, from, to }">
          <p class="text-sm text-muted">
            Showing {{ from }} - {{ to }} of {{ context.count }}
            <template v-if="context.selection.length"> - {{ context.selection.length }} selected</template>
          </p>
        </ListSummary>
      </div>

      <!-- Pagination: Nuxt UI's UPagination drives the list through `setPage`. -->
      <div class="justify-self-end">
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
  </List>
</template>
