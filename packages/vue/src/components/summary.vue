<template>
  <div v-if="showSummary" class="vue-list__summary">
    <slot v-bind="scope">
      <span>
        Showing <span>{{ scope.visibleCount }}</span> items (
        <span>{{ scope.from }} - {{ scope.to }}</span
        >) out of
        <span>{{ scope.count }}</span>
      </span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SummaryScope } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSummary',
})

const { listState } = useListContext()

const showSummary = computed(() => {
  const state = listState.value
  return !state.loader.initialLoading && state.data.length > 0 && !state.error
})

const scope = computed((): SummaryScope => {
  const state = listState.value
  const { page, perPage } = state.pagination
  const from = page * perPage - perPage + 1
  const to = Math.min(page * perPage, state.count)

  return {
    from,
    to,
    visibleCount: state.data.length,
    count: state.count,
  }
})
</script>
