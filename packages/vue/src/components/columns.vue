<template>
  <div class="vue-list__columns">
    <slot :context="context">
      <template v-for="(column, index) in context.columns" :key="`column-${index}`">
        <slot name="column" :column="column" :context="context">
          <label>
            <span>{{ column.label }}</span>
            <input
              type="checkbox"
              :checked="context.columnSettings[column.name]?.visible ?? true"
              @change="
                context.updateColumn(
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
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListColumns',
})

const context = useListContext()
</script>
