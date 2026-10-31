<template>
  <div v-if="context.error && !context.isLoading" class="shilp-list__error">
    <slot :context="context">
      <div>
        <h3>{{ ERROR_MESSAGE }}</h3>
        <pre>{{ getErrorMessage(context.error) }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ERROR_MESSAGE, getErrorMessage } from '@shared/messages'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListError',
})

const context = useListContext()
</script>
