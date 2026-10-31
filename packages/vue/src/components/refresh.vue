<template>
  <div v-if="!context.isInitialLoading" class="shilp-list__refresh">
    <slot :context="context">
      <button type="button" :disabled="context.isLoading" @click="context.refresh()">
        {{ context.isLoading ? LOADING_MESSAGE : REFRESH_MESSAGE }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { LOADING_MESSAGE, REFRESH_MESSAGE } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRefresh',
})

const context = useListContext()
</script>
