<template>
  <div v-if="listState.error && !listState.loader.isLoading" class="vue-list__error">
    <slot :error="listState.error">
      <div>
        <h3>Error occurred</h3>
        <pre>{{ listState.error.name }}: {{ listState.error.message }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'VueListError',
})

const { listState } = useListContext()
</script>
