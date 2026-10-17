<template>
  <div v-if="showEmpty" class="vue-list__empty">
    <slot>
      <p>No data found!</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListEmpty',
})

defineSlots<{
  default(): unknown
}>()

const context = useListContext()

const showEmpty = computed(() => {
  return !context.isInitialLoading && !context.isLoading && context.isEmpty && !context.error
})
</script>
