<template>
  <div v-if="context.isInitialLoading" class="vue-list__initial-loader">
    <slot :context="context">
      <p>Initial Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListInitialLoader',
})

const context = useListContext()
</script>
