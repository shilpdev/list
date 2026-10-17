<template>
  <div class="relative max-h-screen w-full overflow-y-auto rounded-md border border-slate-200">
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
          <th
            v-if="isVisible('id')"
            class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left"
          >
            ID
          </th>
          <th
            v-if="isVisible('name')"
            class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left"
          >
            <span class="inline-flex items-center gap-1">
              Name
              <button type="button" @click="toggleSort('name')">
                <UIcon :name="sortIconName('name')" class="size-5 cursor-pointer text-slate-700" />
              </button>
            </span>
          </th>
          <th
            v-if="isVisible('status')"
            class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left"
          >
            Status
          </th>
          <th
            v-if="isVisible('date_updated')"
            class="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left"
          >
            <span class="inline-flex items-center gap-1">
              Update At
              <button type="button" @click="toggleSort('date_updated')">
                <UIcon
                  :name="sortIconName('date_updated')"
                  class="size-5 cursor-pointer text-slate-700"
                />
              </button>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td v-if="isVisible('id')" class="border border-slate-200 bg-white px-2 py-2">
            {{ row.id }}
          </td>
          <td v-if="isVisible('name')" class="border border-slate-200 bg-white px-2 py-2">
            {{ row.name }}
          </td>
          <td v-if="isVisible('status')" class="border border-slate-200 bg-white px-2 py-2">
            {{ row.status }}
          </td>
          <td v-if="isVisible('date_updated')" class="border border-slate-200 bg-white px-2 py-2">
            {{ formatDate(row.date_updated) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ListLoader, useListContext } from '@shilp.dev/vue-list'
import type { SerializedListRow, SortOrder } from '@shilp.dev/vue-list'
import type { Skill } from '@/types/skill'

const props = defineProps<{
  rows: SerializedListRow<Skill>[]
  sortBy: string
  sortOrder: SortOrder
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: SortOrder) => void
}>()

const listContext = useListContext<Skill>()
const columnSettings = computed(() => listContext.columnSettings)

function isVisible(name: string) {
  return columnSettings.value?.[name]?.visible ?? true
}

function toggleSort(by: string) {
  const currentOrder = props.sortBy === by ? props.sortOrder : ''
  const sorting: SortOrder = currentOrder === 'asc' ? 'desc' : 'asc'
  props.setSortBy(by)
  props.setSortOrder(sorting)
}

function sortIconName(by: string) {
  if (props.sortBy !== by || props.sortOrder === '') return 'i-mdi-sort'
  if (props.sortOrder === 'asc') return 'i-mdi-sort-ascending'
  return 'i-mdi-sort-descending'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>
