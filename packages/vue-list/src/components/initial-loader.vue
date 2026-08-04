<template>
  <div v-if="scope.loading" class="vue-list__initial-loader">
    <slot v-bind="scope">
      <p>Initial Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InitialLoaderScope } from '@7span/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'VueListInitialLoader',
})

const { listState } = useListContext()

const scope = computed((): InitialLoaderScope => ({
  loading: listState.value.loader.initialLoading,
}))
</script>
