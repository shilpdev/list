<template>
  <div class="shilp-list__filters">
    <slot name="filters" v-bind="scope">
      <template v-for="filter in context.filters" :key="filter.column">
        <slot :name="filter.column" v-bind="getFilterScope(filter, context)">
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
import type { FiltersScope } from '@shared'
import { useListContext } from '../composables/use-list-context'
import { getFilterScope } from '@shared/utils'

defineOptions({
  name: 'ListFilters',
})

const context = useListContext()

const scope = computed((): FiltersScope => {
  return {
    context,
    setFilter: context.setFilter,
    setFilters: context.setFilters,
  }
})
</script>
