<template>
  <div v-if="showContent" class="vue-list__per-page">
    <slot v-bind="scope">
      <select
        :value="scope.perPage"
        @input="scope.setPerPage(Number(($event.target as HTMLSelectElement).value))"
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
import type { PerPageComponentOptions, PerPageScope } from '@7span/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPerPage',
})

const props = withDefaults(defineProps<PerPageComponentOptions>(), {
  options: () => [10, 25, 50, 100],
})

const { listState } = useListContext()

const showContent = computed(() => {
  const state = listState.value
  return (
    !state.loader.initialLoading &&
    state.data.length > 0 &&
    !state.error
  )
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

const scope = computed((): PerPageScope => ({
  perPage: listState.value.pagination.perPage,
  setPerPage: listState.value.setPerPage,
  options: serializedOptions.value,
}))
</script>
