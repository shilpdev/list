<template>
  <div v-if="!context.isInitialLoading" class="vue-list__refresh">
    <slot :context="context">
      <button type="button" :disabled="context.isLoading" @click="context.refresh()">
        {{ context.isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRefresh',
})

const context = useListContext()
</script>
