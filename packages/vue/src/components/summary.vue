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

const showSummary = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const scope = computed((): SummaryScope => {
  const { from, to } = getSummaryRange(context.page, context.perPage, context.count)

  return {
    context,
    from,
    to,
    visibleCount: context.rows.length,
  }
})
</script>
