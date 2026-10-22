<template>
  <div v-if="!context.isEmpty && !context.error" class="shilp-list__load-more">
    <slot :context="context">
      <button v-if="context.hasMore" type="button" @click="context.loadMore()">
        {{ MESSAGES.loadMore }}
      </button>
      <p v-else>{{ MESSAGES.loadMoreEnd }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoadMore',
})

const context = useListContext()
</script>
