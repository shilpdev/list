<template>
  <div
    v-if="!context.isInitialLoading && !context.error && !context.isEmpty"
    class="shilp-list__rows"
  >
    <slot :context="context">
      <div v-for="(row, index) in context.rows" :key="getKey(row)">
        <slot name="row" v-bind="getRowScope(row, index, context)">
          <pre>{{ JSON.stringify(row, null, 2) }}</pre>
        </slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { getKey, getRowScope } from '@shared/utils'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRows',
})

const context = useListContext()
</script>
