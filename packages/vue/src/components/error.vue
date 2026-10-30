<template>
  <div v-if="context.error && !context.isLoading" class="shilp-list__error">
    <slot :context="context">
      <div>
        <h3>{{ MESSAGES.error }}</h3>
        <pre>{{ context.error.name }}: {{ context.error.message }}</pre>
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
</script>
