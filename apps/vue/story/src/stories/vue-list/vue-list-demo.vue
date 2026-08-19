<template>
  <div class="vue-list-demo">
    <VueList
      :endpoint="endpoint"
      :page="page"
      :per-page="perPage"
      :pagination-mode="paginationMode"
      :request-handler="requestHandler"
      :count="count"
      :sync-page-to-url="false"
      v-model:filters="filters"
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

        <label class="vue-list-demo__filter">
          Status
          <select
            class="vue-list-demo__select"
            @change="onStatusChange(($event.target as HTMLSelectElement).value)"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <ListInitialLoader>
        <p class="vue-list-demo__message">Loading initial data...</p>
      </ListInitialLoader>

      <ListEmpty>
        <p class="vue-list-demo__message">No skills found.</p>
      </ListEmpty>

      <ListError v-slot="{ error }">
        <div class="vue-list-demo__error">
          <p>{{ error.message }}</p>
          <ListRefresh v-slot="{ refresh, isLoading }">
            <button type="button" class="vue-list-demo__button" :disabled="isLoading" @click="refresh">
              Try again
            </button>
          </ListRefresh>
        </div>
      </ListError>

      <ListItems v-slot="{ items, sort, setSort }">
        <div class="vue-list-demo__table-wrap">
          <ListLoader>
            <p class="vue-list-demo__overlay">Updating...</p>
          </ListLoader>

          <table class="vue-list-demo__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>
                  <button type="button" class="vue-list-demo__sort" @click="toggleSort(sort, setSort, 'name')">
                    Name
                  </button>
                </th>
                <th>Status</th>
                <th>
                  <button
                    type="button"
                    class="vue-list-demo__sort"
                    @click="toggleSort(sort, setSort, 'date_updated')"
                  >
                    Updated
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items as unknown as Skill[]" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.status }}</td>
                <td>{{ formatSkillDate(item.date_updated) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ListItems>

      <div class="vue-list-demo__footer">
        <ListSummary v-slot="{ count: total, from, to }">
          <span>{{ from }} - {{ to }} of {{ total }}</span>
        </ListSummary>

        <ListPerPage v-slot="{ perPage: currentPerPage, setPerPage, options }">
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
          v-slot="{ page: currentPage, pagesToDisplay, hasNext, hasPrev, prev, next, setPage }"
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

        <ListLoadMore v-else v-slot="{ loadMore, hasMoreItems, isLoading }">
          <button
            type="button"
            class="vue-list-demo__button"
            :disabled="!hasMoreItems || isLoading"
            @click="loadMore"
          >
            {{ hasMoreItems ? (isLoading ? 'Loading...' : 'Load more') : 'All loaded' }}
          </button>
        </ListLoadMore>
      </div>
    </VueList>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ListSort, RequestHandler } from '@shilp.dev/list-types'
import {
  ListEmpty,
  ListError,
  ListInitialLoader,
  ListItems,
  ListLoadMore,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListSearch,
  ListSummary,
  VueList,
} from '@shilp.dev/vue-list'
import { formatSkillDate, type Skill } from '@/types/skill'

defineOptions({
  name: 'vue-list-demo',
})

withDefaults(
  defineProps<{
    endpoint?: string
    page?: number
    perPage?: number
    paginationMode?: 'pagination' | 'loadMore'
    requestHandler: RequestHandler<Skill>
    count?: number
  }>(),
  {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
  },
)

const filters = ref<Record<string, string | undefined>>({})

function onStatusChange(value: string) {
  filters.value = {
    ...filters.value,
    status: value === 'all' ? undefined : value,
  }
}

function toggleSort(
  sort: ListSort,
  setSort: (next: { by: string; order: 'asc' | 'desc' }) => void,
  by: string,
) {
  const currentOrder = sort.sortBy === by ? sort.sortOrder : ''
  const order: 'asc' | 'desc' = currentOrder === 'asc' ? 'desc' : 'asc'
  setSort({ by, order })
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
