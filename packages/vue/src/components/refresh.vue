<template>
  <div v-if="!listState.loader.initialLoading" class="vue-list__refresh">
    <slot v-bind="scope">
      <button type="button" :disabled="scope.isLoading" @click="scope.refresh">
        {{ scope.isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RefreshScope } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListRefresh',
})

const { listState } = useListContext()

const scope = computed((): RefreshScope => ({
  isLoading: listState.value.loader.isLoading,
  refresh: () => listState.value.refresh({ isRefresh: true }),
}))
</script>
