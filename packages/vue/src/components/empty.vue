<template>
  <div v-if="showEmpty" class="shilp-list__empty">
    <slot>
      <p>{{ EMPTY_MESSAGE }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EMPTY_MESSAGE } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListEmpty',
})

defineSlots<{
  default(): unknown
}>()

const context = useListContext()

const showEmpty = computed(() => {
  return (
    !context.isInitialLoading && !context.isLoading && context.isEmpty && !context.error
  )
})
</script>
