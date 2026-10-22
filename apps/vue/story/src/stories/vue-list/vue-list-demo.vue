<template>
  <div class="vue-list-demo">
    <List
      :key="listKey"
      :endpoint="endpoint"
      :page="page"
      :per-page="perPage"
      :pagination-mode="paginationMode"
      :request-handler="handler"
      :count="count"
      :sync-page-to-url="false"
      :filters="[{ column: 'status', value: undefined }]"
      :columns="columns"
    >
      <div class="vue-list-demo__toolbar">
        <ListSearch v-slot="{ search, setSearch }">
          <input
            type="search"
            class="vue-list-demo__input"
            :value="search"
            placeholder="Search skills..."
            @input="setSearch(($event.target as HTMLInputElement).value)"
          />
        </ListSearch>

        <ListFilters>
          <template #status="{ setValue }">
            <label class="vue-list-demo__filter">
              Status
              <select
                class="vue-list-demo__select"
                @change="onStatusChange(setValue, ($event.target as HTMLSelectElement).value)"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </template>
        </ListFilters>
      </div>

      <ListLoaderInitial>
        <p class="vue-list-demo__message">Loading initial data...</p>
      </ListLoaderInitial>

      <ListEmpty>
        <p class="vue-list-demo__message">No skills found.</p>
      </ListEmpty>

      <ListError v-slot="{ context: { error } }">
        <div class="vue-list-demo__error">
          <p>{{ error?.message }}</p>
          <ListRefresh v-slot="{ context: { refresh, isLoading } }">
            <button type="button" class="vue-list-demo__button" :disabled="isLoading" @click="refresh()">
              Try again
            </button>
          </ListRefresh>
        </div>
      </ListError>

      <ListRows v-slot="{ context: { rows, sortBy, sortOrder, setSortBy, setSortOrder } }">
        <div class="vue-list-demo__table-wrap">
          <ListLoader>
            <p class="vue-list-demo__overlay">Updating...</p>
          </ListLoader>

          <table class="vue-list-demo__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>
                  <button type="button" class="vue-list-demo__sort" @click="toggleSort({ sortBy, sortOrder, setSortBy, setSortOrder }, 'name')">
                    Name
                  </button>
                </th>
                <th>Status</th>
                <th>
                  <button
                    type="button"
                    class="vue-list-demo__sort"
                    @click="toggleSort({ sortBy, sortOrder, setSortBy, setSortOrder }, 'date_updated')"
                  >
                    Updated
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows as unknown as Skill[]" :key="row.id">
                <td>{{ row.id }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.status }}</td>
                <td>{{ formatSkillDate(row.date_updated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ListRows>

      <div class="vue-list-demo__footer">
        <ListSummary v-slot="{ context: { count: total }, from, to }">
          <span>{{ from }} - {{ to }} of {{ total }}</span>
        </ListSummary>

        <ListPerPage :options="perPageOptions" v-slot="{ context: { perPage: currentPerPage, setPerPage }, options }">
          <label class="vue-list-demo__filter">
            Per page
            <select
              class="vue-list-demo__select"
              :value="String(currentPerPage)"
              @change="setPerPage(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="option in options" :key="option.value" :value="String(option.value)">
                {{ option.label }}
              </option>
            </select>
          </label>
        </ListPerPage>

        <ListPagination
          v-if="paginationMode === 'pagination'"
          v-slot="{ context: { page: currentPage, setPage }, pagesToDisplay, hasNext, hasPrev, prev, next }"
        >
          <div class="vue-list-demo__pagination">
            <button type="button" class="vue-list-demo__button" :disabled="!hasPrev" @click="prev">
              Prev
            </button>
            <button
              v-for="item in pagesToDisplay"
              :key="item"
              type="button"
              class="vue-list-demo__button"
              :class="{ 'vue-list-demo__button--active': item === currentPage }"
              @click="setPage(item)"
            >
              {{ item }}
            </button>
            <button type="button" class="vue-list-demo__button" :disabled="!hasNext" @click="next">
              Next
            </button>
          </div>
        </ListPagination>

        <ListLoadMore v-else v-slot="{ context: { loadMore, hasMore, isLoading } }">
          <button
            type="button"
            class="vue-list-demo__button"
            :disabled="!hasMore || isLoading"
            @click="loadMore"
          >
            {{ hasMore ? (isLoading ? 'Loading...' : 'Load more') : 'All loaded' }}
          </button>
        </ListLoadMore>
      </div>
    </List>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Context, FilterScope } from '@shilp.dev/vue-list'
import {
  ListEmpty,
  ListError,
  ListFilters,
  ListLoaderInitial,
  ListRows,
  ListLoadMore,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListSearch,
  ListSummary,
  List,
} from '@shilp.dev/vue-list'
import {
  createRequestHandler,
  type CreateRequestHandlerOptions,
} from '@/api/request-handler'
import { formatSkillDate, type Skill } from '@/types/skill'

const PER_PAGE_OPTIONS = [8, 10, 15, 25, 50, 100]

defineOptions({
  name: 'vue-list-demo',
})

const props = withDefaults(
  defineProps<{
    endpoint?: string
    page?: number
    perPage?: number
    paginationMode?: 'pagination' | 'loadMore'
    /**
     * Serializable options for the demo request handler.
     * Sample JSON: `{ "forceEmpty": false, "shouldFail": false }`
     */
    requestHandler?: CreateRequestHandlerOptions
    count?: number
  }>(),
  {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: () => ({ forceEmpty: false, shouldFail: false }),
  },
)

const listKey = computed(() =>
  [
    props.endpoint,
    props.page,
    props.perPage,
    props.paginationMode,
    props.count,
    props.requestHandler?.forceEmpty,
    props.requestHandler?.shouldFail,
  ].join(':'),
)

const handler = computed(() => createRequestHandler(props.requestHandler ?? {}))

const perPageOptions = computed(() => {
  if (PER_PAGE_OPTIONS.includes(props.perPage)) {
    return PER_PAGE_OPTIONS
  }

  return [...PER_PAGE_OPTIONS, props.perPage].sort((a, b) => a - b)
})

const columns = [
  { name: 'id', label: 'ID' },
  { name: 'name', label: 'Name' },
  { name: 'status', label: 'Status' },
  { name: 'date_updated', label: 'Updated' },
]

function onStatusChange(setValue: FilterScope['setValue'], value: string) {
  if (value === 'all') {
    setValue(undefined)
  } else {
    setValue(value)
  }
}

function toggleSort(
  { sortBy, sortOrder, setSortBy, setSortOrder }: Pick<Context, 'sortBy' | 'sortOrder' | 'setSortBy' | 'setSortOrder'>,
  by: string,
) {
  const currentOrder = sortBy === by ? sortOrder : ''
  setSortBy(by)
  setSortOrder(currentOrder === 'asc' ? 'desc' : 'asc')
}
</script>

<style scoped>
.vue-list-demo {
  font-family: system-ui, sans-serif;
  color: #1e293b;
}

.vue-list-demo__toolbar,
.vue-list-demo__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}

.vue-list-demo__input,
.vue-list-demo__select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
}

.vue-list-demo__filter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.vue-list-demo__table-wrap {
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.vue-list-demo__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  background: rgb(255 255 255 / 70%);
}

.vue-list-demo__table {
  width: 100%;
  border-collapse: collapse;
}

.vue-list-demo__table th,
.vue-list-demo__table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 12px;
  text-align: left;
}

.vue-list-demo__table th {
  background: #f8fafc;
}

.vue-list-demo__sort {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.vue-list-demo__pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vue-list-demo__button {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  padding: 6px 10px;
  cursor: pointer;
}

.vue-list-demo__button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.vue-list-demo__button--active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.vue-list-demo__message,
.vue-list-demo__error {
  padding: 24px;
  text-align: center;
}

.vue-list-demo__error {
  color: #b91c1c;
}
</style>
