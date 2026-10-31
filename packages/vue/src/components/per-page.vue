<template>
  <div v-if="showContent" class="shilp-list__per-page">
    <slot v-bind="scope">
      <select
        :value="context.perPage"
        @change="context.setPerPage(Number(($event.target as HTMLSelectElement).value))"
      >
        <option
          v-for="option in scope.options"
          :key="`option-${option.value}`"
          :value="option.value"
        >
          {{ getPerPageMessage(option) }}
        </option>
      </select>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_PER_PAGE_OPTIONS } from '@shared/constants'
import { getPerPageMessage } from '@shared/messages'
import { normalizePerPageOptions } from '@shared/utils'
import type { PerPageProps, PerPageScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPerPage',
})

const { options = DEFAULT_PER_PAGE_OPTIONS } = defineProps<PerPageProps>()

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && !context.isEmpty && !context.error
})

const serializedOptions = computed(() => {
  return normalizePerPageOptions(options)
})

const scope = computed((): PerPageScope => {
  return {
    context,
    options: serializedOptions.value,
  }
})
</script>
