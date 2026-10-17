<template>
  <div
    v-if="!context.isInitialLoading && !context.error && !context.isEmpty"
    class="vue-list__rows"
  >
    <slot v-bind="scope">
      <div v-for="(row, index) in scope.rows" :key="getRowId(row, context.idKey) ?? index">
        <slot name="row" :row="row" :index="index">
          <pre>{{ JSON.stringify(row, null, 2) }}</pre>
        </slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RowsScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'
import { getRowId } from '../utils'

defineOptions({
  name: 'ListRows',
})

const context = useListContext()

const scope = computed((): RowsScope => {
  const { page, perPage } = context

  return {
    context,
    rows: context.rows.map((row, index) => ({
      ...(row as object),
      _index: (page - 1) * perPage + index + 1,
    })),
  }
})
</script>
