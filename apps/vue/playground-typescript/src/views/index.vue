<template>
  <div class="flex min-h-screen items-start justify-center bg-slate-100 p-6">
    <div class="w-full max-w-350 rounded-xl bg-white p-8 text-slate-800 shadow-lg">
      <h2 class="mb-6 text-3xl font-bold text-slate-700">
        Vue List Playground (TypeScript)
      </h2>

      <VueList
        endpoint="skills"
        search=""
        :page="1"
        :per-page="10"
        v-model:filters="filters"
        pagination-mode="pagination"
        :request-handler="vueListConfig.requestHandler"
        :state-manager="vueListConfig.stateManager"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center">
            <ListSearch v-slot="{ search, setSearch }">
              <div class="relative w-60">
                <input
                  type="text"
                  :value="search"
                  placeholder="Search skills..."
                  class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  @input="setSearch(($event.target as HTMLInputElement).value)"
                />
              </div>
            </ListSearch>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="relative flex items-center gap-2">
              <label class="whitespace-nowrap text-sm text-slate-500" for="status-filter">
                Status:
              </label>
              <select
                id="status-filter"
                class="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                :value="filters.status ?? 'all'"
                @change="onStatusChange(($event.target as HTMLSelectElement).value)"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <div
                class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <UIcon name="i-mdi-chevron-down" class="h-4 w-4" />
              </div>
            </div>

            <div class="relative flex items-center gap-2">
              <label class="whitespace-nowrap text-sm text-slate-500" for="color-filter">
                Color:
              </label>
              <select
                id="color-filter"
                class="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                :value="filters.color ?? 'all'"
                @change="onColorChange(($event.target as HTMLSelectElement).value)"
              >
                <option value="all">All Colors</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
              </select>
              <div
                class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
              >
                <UIcon name="i-mdi-chevron-down" class="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div class="my-6">
          <ListInitialLoader>
            <div class="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
              <div class="flex w-full">
                <div
                  v-for="index in 4"
                  :key="`header-${index}`"
                  class="m-2 h-12 flex-1 animate-pulse rounded bg-slate-200"
                />
              </div>
              <div v-for="rowIndex in 5" :key="`row-${rowIndex}`" class="flex w-full">
                <div
                  v-for="cellIndex in 4"
                  :key="`cell-${rowIndex}-${cellIndex}`"
                  class="m-2 h-10 flex-1 animate-pulse rounded bg-linear-to-r from-slate-100 via-slate-200 to-slate-100"
                />
              </div>
            </div>
          </ListInitialLoader>

          <ListEmpty>
            <div
              class="flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-white px-4 py-16"
            >
              <div class="relative mb-8">
                <div class="absolute inset-0 animate-pulse rounded-full bg-slate-50 opacity-30" />
                <div
                  class="relative rounded-full bg-linear-to-br from-slate-50 to-slate-100 p-8 shadow-inner"
                >
                  <UIcon
                    name="i-mdi-file-search-outline"
                    class="h-16 w-16 text-slate-400"
                  />
                </div>
              </div>

              <h3 class="mb-3 text-2xl font-medium text-slate-800">No Data Found</h3>

              <p class="mb-6 max-w-md text-center leading-relaxed text-slate-500">
                We couldn't find any matching records. Try adjusting your search or filters.
              </p>

              <ListRefresh v-slot="{ refresh, isLoading }">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isLoading"
                  @click="refresh"
                >
                  <UIcon name="i-mdi-refresh" class="h-5 w-5" />
                  Refresh
                </button>
              </ListRefresh>
            </div>
          </ListEmpty>

          <ListError v-slot="{ error }">
            <div class="flex flex-col items-center justify-center px-4 py-16">
              <div class="mb-4 rounded-full bg-red-100 p-6">
                <UIcon name="i-mdi-alert-circle-outline" class="h-12 w-12 text-red-500" />
              </div>
              <h3 class="mb-2 text-xl font-medium text-slate-800">Something went wrong</h3>
              <p class="mb-4 max-w-md text-center text-slate-500">
                {{ error.message || 'An unexpected error occurred while fetching data.' }}
              </p>
              <div class="mb-6 w-full max-w-md rounded-md bg-slate-50 p-4">
                <p class="wrap-break-word font-mono text-sm text-slate-600">
                  {{ error.name }}: {{ error.message }}
                </p>
              </div>
              <ListRefresh v-slot="{ refresh, isLoading }">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="isLoading"
                  @click="refresh"
                >
                  <UIcon name="i-mdi-refresh" class="h-5 w-5" />
                  Try Again
                </button>
              </ListRefresh>
            </div>
          </ListError>

          <ListItems v-slot="{ items, sort, setSort }">
            <div
              class="relative max-h-screen w-full overflow-y-auto rounded-md border border-slate-200"
            >
              <ListLoader>
                <div
                  class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm"
                >
                  <UIcon
                    name="i-svg-spinners:blocks-shuffle-3"
                    class="h-12 w-12 animate-pulse text-primary-500"
                  />
                </div>
              </ListLoader>

              <table class="w-full whitespace-nowrap border-collapse">
                <thead>
                  <tr>
                    <th class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                      ID
                    </th>
                    <th class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                      <span class="inline-flex items-center gap-1">
                        Name
                        <button type="button" @click="toggleSort(sort, setSort, 'name')">
                          <UIcon
                            :name="sortIconName(sort, 'name')"
                            class="size-5 cursor-pointer text-slate-700"
                          />
                        </button>
                      </span>
                    </th>
                    <th class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                      Status
                    </th>
                    <th class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                      <span class="inline-flex items-center gap-1">
                        Update At
                        <button
                          type="button"
                          @click="toggleSort(sort, setSort, 'date_updated')"
                        >
                          <UIcon
                            :name="sortIconName(sort, 'date_updated')"
                            class="size-5 cursor-pointer text-slate-700"
                          />
                        </button>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in items as unknown as Skill[]"
                    :key="item.id"
                  >
                    <td class="border border-slate-200 bg-white px-2 py-2">
                      {{ item.id }}
                    </td>
                    <td class="border border-slate-200 bg-white px-2 py-2">
                      {{ item.name }}
                    </td>
                    <td class="border border-slate-200 bg-white px-2 py-2">
                      {{ item.status }}
                    </td>
                    <td class="border border-slate-200 bg-white px-2 py-2">
                      {{ formatDate(item.date_updated) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ListItems>

          <div
            class="flex w-full flex-col items-center justify-between gap-4 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-5 md:flex-row"
          >
            <div class="flex w-full flex-wrap items-center gap-6">
              <div class="flex items-center gap-2">
                <ListSummary v-slot="{ count, from, to }">
                  <span class="font-medium text-slate-700">
                    {{ from }} - {{ to }} of {{ count }} Results
                  </span>
                </ListSummary>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-slate-500">Page Size:</span>
                <ListPerPage v-slot="{ perPage, setPerPage, options }">
                  <div class="relative">
                    <select
                      :value="String(perPage)"
                      class="w-20 appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      @change="setPerPage(Number(($event.target as HTMLSelectElement).value))"
                    >
                      <option
                        v-for="option in options"
                        :key="`page-size-${option.value}`"
                        :value="String(option.value)"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <UIcon name="i-mdi-chevron-down" class="h-4 w-4" />
                    </div>
                  </div>
                </ListPerPage>
              </div>

              <ListGoTo v-slot="{ setPage, page, pagesCount }">
                <div class="flex items-center gap-2">
                  <span class="text-slate-500">Go to:</span>
                  <input
                    type="number"
                    :min="1"
                    :max="pagesCount"
                    :value="page"
                    class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-medium shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    @change="setPage(Number(($event.target as HTMLInputElement).value))"
                  />
                  <span class="text-slate-500">of {{ pagesCount }}</span>
                </div>
              </ListGoTo>
            </div>

            <ListPagination
              v-slot="{
                page,
                pagesToDisplay,
                hasNext,
                hasPrev,
                prev,
                next,
                first,
                last,
                setPage,
              }"
            >
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="First Page"
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!hasPrev"
                  @click="first"
                >
                  <UIcon name="i-mdi-chevron-double-left" class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  title="Previous Page"
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!hasPrev"
                  @click="prev"
                >
                  <UIcon name="i-mdi-chevron-left" class="h-4 w-4" />
                </button>

                <div class="mx-1 flex items-center gap-1">
                  <button
                    v-for="item in pagesToDisplay"
                    :key="`page-${item}`"
                    type="button"
                    class="h-8 min-w-8 rounded-md border px-2 text-sm font-medium transition"
                    :class="
                      item === page
                        ? 'border-primary-600 bg-primary-500 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    "
                    @click="setPage(item)"
                  >
                    {{ item }}
                  </button>
                </div>

                <button
                  type="button"
                  title="Next Page"
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!hasNext"
                  @click="next"
                >
                  <UIcon name="i-mdi-chevron-right" class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  title="Last Page"
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="!hasNext"
                  @click="last"
                >
                  <UIcon name="i-mdi-chevron-double-right" class="h-4 w-4" />
                </button>
              </div>
            </ListPagination>
          </div>
        </div>
      </VueList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  VueList,
  ListEmpty,
  ListError,
  ListGoTo,
  ListInitialLoader,
  ListItems,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListSearch,
  ListSummary,
} from '@7span/vue-list'
import type { ListSort } from '@7span/list-types'
import type { Skill, SkillFilters } from '@/types/skill'
import vueListConfig, { getStateFromSearchParams } from '@/api/vue-list-config'

defineOptions({
  name: 'playground-index-view',
})

const filters = ref<SkillFilters>(getStateFromSearchParams()?.filters ?? {})

function onStatusChange(value: string) {
  filters.value = {
    ...filters.value,
    status: value === 'all' ? undefined : value,
  }
}

function onColorChange(value: string) {
  filters.value = {
    ...filters.value,
    color: value === 'all' ? undefined : value,
  }
}

function toggleSort(
  sort: ListSort,
  setSort: (next: { by: string; order: 'asc' | 'desc' }) => void,
  by: string,
) {
  const currentOrder = sort.sortBy === by ? sort.sortOrder : ''
  const sorting: 'asc' | 'desc' = currentOrder === 'asc' ? 'desc' : 'asc'
  setSort({ by, order: sorting })
}

function sortIconName(sort: ListSort, by: string) {
  if (sort.sortBy !== by || sort.sortOrder === '') return 'i-mdi-sort'
  if (sort.sortOrder === 'asc') return 'i-mdi-sort-ascending'
  return 'i-mdi-sort-descending'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>
