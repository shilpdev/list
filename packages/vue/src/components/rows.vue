<template>
  <div
    v-if="!context.isInitialLoading && !context.error && !context.isEmpty"
    class="shilp-list__rows"
  >
    <slot :context="context">
      <div v-for="(row, index) in context.rows" :key="getKey(row)">
        <slot name="row" :row="row" :index="index">
          <pre>{{ JSON.stringify(row, null, 2) }}</pre>
        </slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRows',
})

const context = useListContext()

function getKey(row: unknown): number {
  return (row as { _index: number })._index
}
</script>
