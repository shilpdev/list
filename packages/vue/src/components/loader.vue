<template>
  <div v-if="context.isLoading && !context.isInitialLoading" class="shilp-list__loader">
    <slot :context="context">
      <p>{{ MESSAGES.loading }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoader',
})

const context = useListContext()
</script>
