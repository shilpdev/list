<template>
  <div
    v-if="!context.isInitialLoading && !context.error && !context.isEmpty"
    class="shilp-list__rows"
  >
    <slot :context="context">
      <div v-for="(row, index) in context.rows" :key="getKey(row)">
        <slot name="row" v-bind="getRowScope(row, index)">
          <pre>{{ JSON.stringify(row, null, 2) }}</pre>
        </slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import type { RowScope } from '@shared'
import { getRowId } from '@shared/utils'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRows',
})

const context = useListContext()

function getKey(row: unknown): number {
  return (row as { _index: number })._index
}

function getRowScope(row: unknown, index: number): RowScope {
  const id = getRowId(row, context.idKey)

  return {
    context,
    row,
    index,
    isSelected: context.selection.includes(id),
    toggleSelection: () => {
      context.toggleRowSelection(id)
    },
  }
}
</script>
