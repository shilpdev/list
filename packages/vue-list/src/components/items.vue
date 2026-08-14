<template>
  <div v-if="!listState.loader.initialLoading" class="vue-list__items">
    <slot name="default" v-bind="scope">
      <div v-for="(item, index) in scope.items" :key="index">
        <slot name="item" :item="item" :index="index">
          <pre>{{ item }}</pre>
        </slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ItemsScope } from '@7span/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListItems',
})

const { listState } = useListContext()

const scope = computed((): ItemsScope => {
  const state = listState.value
  const { page, perPage } = state.pagination

  return {
    items: state.data.map((item, index) => ({
      ...(item as object),
      _index: (page - 1) * perPage + index + 1,
    })),
    isLoading: state.loader.isLoading,
    setSort: state.setSort,
    sort: state.sort,
  }
})
</script>
