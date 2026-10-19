<template>
  <div v-if="showContent" class="shilp-list__per-page">
    <slot v-bind="scope">
      <select
        :value="scope.context.perPage"
        @change="scope.context.setPerPage(Number(($event.target as HTMLSelectElement).value))"
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
import { getPerPageMessage, normalizePerPageOptions } from '@shared/utils'
import type { PerPageProps, PerPageScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPerPage',
})

const props = withDefaults(defineProps<PerPageProps>(), {
  options: () => {
    return DEFAULT_PER_PAGE_OPTIONS
  },
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const serializedOptions = computed(() => {
  return normalizePerPageOptions(props.options ?? [])
})

const scope = computed((): PerPageScope => {
  return {
    context,
    options: serializedOptions.value,
  }
})
</script>
