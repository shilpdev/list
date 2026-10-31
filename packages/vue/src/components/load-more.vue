<template>
  <div v-if="!context.isEmpty && !context.error" class="shilp-list__load-more">
    <slot :context="context">
      <button v-if="context.hasMore" type="button" @click="context.loadMore()">
        {{ LOAD_MORE_MESSAGE }}
      </button>
      <p v-else>{{ LOAD_MORE_END_MESSAGE }}</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { LOAD_MORE_END_MESSAGE, LOAD_MORE_MESSAGE } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListLoadMore',
})

const context = useListContext()
</script>
