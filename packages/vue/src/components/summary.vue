<template>
  <div v-if="showSummary" class="shilp-list__summary">
    <slot v-bind="scope">
      <span>{{ getSummaryMessage(scope) }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getSummaryMessage } from '@shared/constants'
import { getSummaryRange } from '@shared/utils'
import type { SummaryScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSummary',
})

const context = useListContext()
const { rows, isEmpty, count, error, page, perPage, isInitialLoading } = context

const showSummary = computed(() => {
  return !isInitialLoading && !isEmpty && !error
})

const scope = computed((): SummaryScope => {
  return {
    context,
    ...getSummaryRange(page, perPage, count),
    visibleCount: rows.length,
  }
})
</script>
