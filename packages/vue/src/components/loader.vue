<template>
  <div v-if="context.isLoading && !context.isInitialLoading" class="shilp-list__loader">
    <slot :context="context">
      <p>{{ LOADING_MESSAGE }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { LOADING_MESSAGE } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoader',
})

const context = useListContext()
</script>
