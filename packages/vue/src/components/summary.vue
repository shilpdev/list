<template>
  <div v-if="showSummary" class="vue-list__summary">
    <slot v-bind="scope">
      <span>
        Showing <span>{{ scope.visibleCount }}</span> rows (
        <span>{{ scope.from }} - {{ scope.to }}</span
        >) out of
        <span>{{ scope.context.count }}</span>
      </span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SummaryScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSummary',
})

const context = useListContext()

const showSummary = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const scope = computed((): SummaryScope => {
  const { page, perPage } = context
  const from = page * perPage - perPage + 1
  const to = Math.min(page * perPage, context.count)

  return {
    context,
    from,
    to,
    visibleCount: context.rows.length,
  }
})
</script>
