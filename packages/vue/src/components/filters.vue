<template>
  <div class="shilp-list__filters">
    <slot name="filters" v-bind="scope">
      <template v-for="filter in context.filters" :key="filter.column">
        <slot :name="filter.column" v-bind="getFilterScope(filter)">
          <label>
            <span>{{ filter.column }}</span>
            <input
              type="text"
              :value="String(filter.value ?? '')"
              @input="context.setFilter(filter.column, ($event.target as HTMLInputElement).value)"
            />
          </label>
        </slot>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FilterState, FilterScope, FiltersScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListFilters',
})

const context = useListContext()

function getFilterScope(filter: FilterState): FilterScope {
  return {
    context,
    ...filter,
    setValue: (value: unknown) => {
      context.setFilter(filter.column, value)
    },
  }
}

const scope = computed((): FiltersScope => {
  return {
    context,
    setFilter: context.setFilter,
    setFilters: context.setFilters,
  }
})
</script>
