<template>
  <div class="shilp-list__columns">
    <slot v-bind="scope">
      <template v-for="column in context.columns" :key="column.name">
        <slot :name="column.name" v-bind="getColumnScope(column, context)">
          <label>
            <span>{{ column.label ?? column.name }}</span>
            <input
              type="checkbox"
              :checked="column.visibility"
              @change="
                context.setColumn(column.name, 'visibility', ($event.target as HTMLInputElement).checked)
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
import type { ColumnsScope } from '@shared'
import { useListContext } from '../composables/use-list-context'
import { getColumnScope } from '@shared/utils'

defineOptions({
  name: 'ListColumns',
})

const context = useListContext()

const scope = computed((): ColumnsScope => {
  return {
    context,
    setColumn: context.setColumn,
  }
})
</script>
