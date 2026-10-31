<template>
  <div v-if="showSummary" class="shilp-list__summary">
    <slot v-bind="scope">
      <span>{{ getSummaryMessage(scope) }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getSummaryMessage } from '@shared/messages'
import { getSummaryRange } from '@shared/utils'
import type { SummaryScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSummary',
})

const context = useListContext()

const showSummary = computed(() => {
  return !context.isInitialLoading && !context.isEmpty && !context.error
})

const scope = computed((): SummaryScope => {
  return {
    context,
    ...getSummaryRange(context.page, context.perPage, context.count),
    visibleCount: context.rows.length,
  }
})
</script>
