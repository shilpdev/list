<template>
  <div v-if="context.isInitialLoading" class="shilp-list__initial-loader">
    <slot :context="context">
      <p>Initial Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoaderInitial',
})

const context = useListContext()
</script>
