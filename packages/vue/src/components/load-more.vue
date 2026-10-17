<template>
  <div v-if="!context.isEmpty && !context.error" class="shilp-list__load-more">
    <slot :context="context">
      <button v-if="context.hasMore" type="button" @click="context.loadMore()">
        Load More
      </button>
      <p v-else>— That's all —</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoadMore',
})

const context = useListContext()
</script>
