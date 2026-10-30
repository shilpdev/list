<template>
  <div v-if="!context.isInitialLoading" class="shilp-list__refresh">
    <slot :context="context">
      <button type="button" :disabled="context.isLoading" @click="context.refresh()">
        {{ context.isLoading ? MESSAGES.loading : MESSAGES.refresh }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRefresh',
})

const context = useListContext()
</script>
