<template>
  <div class="vue-list__columns">
    <slot v-bind="scope">
      <template v-for="(column, index) in scope.columns" :key="`column-${index}`">
        <slot
          name="column"
          :column="column"
          :updateColumn="scope.updateColumn"
          :columnSettings="scope.columnSettings"
        >
          <label>
            <span>{{ column.label }}</span>
            <input
              type="checkbox"
              :checked="scope.columnSettings?.[column.name]?.visible ?? true"
              @change="
                scope.updateColumn(
                  column.name,
                  'visible',
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />
          </label>
        </slot>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColumnsScope, ListColumn } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListColumns',
})

const { listState } = useListContext()

const scope = computed((): ColumnsScope => {
  const state = listState.value

  return {
    columns: state.columns as ListColumn[],
    columnSettings: state.columnSettings ?? {},
    updateColumn: state.updateColumn ?? (() => {}),
  }
})
</script>
