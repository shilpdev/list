<template>
  <div v-if="error && !isLoading" class="shilp-list__error">
    <slot :context="context">
      <div>
        <h3>{{ MESSAGES.error }}</h3>
        <pre>{{ error.name }}: {{ error.message }}</pre>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListError',
})

const context = useListContext()
const { error, isLoading } = context
</script>
