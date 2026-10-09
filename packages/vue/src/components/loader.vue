<template>
  <div
    v-if="listState.loader.isLoading && !listState.loader.initialLoading"
    class="vue-list__loader"
  >
    <slot v-bind="scope">
      <p>Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoaderScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoader',
})

const { listState } = useListContext()

const scope = computed(
  (): LoaderScope => ({
    isLoading: listState.value.loader.isLoading,
  }),
)
</script>
