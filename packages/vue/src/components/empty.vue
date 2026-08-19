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

const { listState } = useListContext()

const showEmpty = computed(() => {
  const state = listState.value
  return !state.loader.initialLoading && !state.loader.isLoading && state.isEmpty && !state.error
})
</script>
