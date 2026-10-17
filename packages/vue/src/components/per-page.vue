<template>
  <div v-if="showContent" class="vue-list__per-page">
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
          {{ option.label }} items per page
        </option>
      </select>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PerPageComponentOptions, PerPageScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPerPage',
})

const props = withDefaults(defineProps<PerPageComponentOptions>(), {
  options: () => [10, 25, 50, 100],
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const serializedOptions = computed(() => {
  return (props.options ?? []).map((item) => {
    if (typeof item !== 'object') {
      return {
        value: item,
        label: item,
      }
    }
    return item
  })
})

const scope = computed(
  (): PerPageScope => ({
    context,
    options: serializedOptions.value,
  }),
)
</script>
