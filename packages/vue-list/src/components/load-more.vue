<template>
  <div v-if="showContent" class="vue-list__load-more">
    <slot v-bind="scope">
      <button v-if="scope.hasMoreItems" type="button" @click="scope.loadMore">Load More</button>
      <p v-else>— That's all —</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadMoreScope } from '@7span/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'VueListLoadMore',
})

const { listState } = useListContext()

const showContent = computed(() => {
  const state = listState.value
  return state.data.length > 0 && !state.error
})

const scope = computed((): LoadMoreScope => {
  const state = listState.value
  const { page, perPage } = state.pagination

  return {
    isLoading: state.loader.isLoading,
    loadMore: state.loadMore,
    hasMoreItems: page * perPage < state.count,
  }
})
</script>
