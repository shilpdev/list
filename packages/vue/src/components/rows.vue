<template>
  <div
    v-if="!listState.loader.initialLoading && !listState.error && !listState.isEmpty"
    class="vue-list__rows"
  >
    <slot v-bind="scope">
      <div v-for="(row, index) in scope.rows" :key="getRowId(row, listState.idKey) ?? index">
        <slot name="row" :row="row" :index="index">
          <pre>{{ row }}</pre>
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

const { listState } = useListContext()

const scope = computed((): RowsScope => {
  const state = listState.value
  const { page, perPage } = state.pagination

  return {
    rows: state.rows.map((row, index) => ({
      ...(row as object),
      _index: (page - 1) * perPage + index + 1,
    })),
    isLoading: state.loader.isLoading,
    setSort: state.setSort,
    sort: state.sort,
  }
})
</script>
