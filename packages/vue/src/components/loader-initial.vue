<template>
  <div v-if="context.isInitialLoading" class="shilp-list__initial-loader">
    <slot :context="context">
      <p>{{ INITIAL_LOADING_MESSAGE }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { INITIAL_LOADING_MESSAGE } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoaderInitial',
})

const context = useListContext()
</script>
