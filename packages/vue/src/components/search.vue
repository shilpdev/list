<template>
  <div class="shilp-list__search">
    <slot v-bind="scope">
      <input
        type="text"
        :value="localSearch"
        @input="handleInput(($event.target as HTMLInputElement).value)"
        placeholder="Search..."
      />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { SearchProps, SearchScope } from '@shared'
import { DEFAULT_DEBOUNCE_TIME } from '@shared/constants'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSearch',
})

const props = withDefaults(defineProps<SearchProps>(), {
  debounceTime: DEFAULT_DEBOUNCE_TIME,
})

const context = useListContext()
const localSearch = ref(context.search)

watch(
  () => {
    return context.search
  },
  (value) => {
    if (value !== localSearch.value) {
      localSearch.value = value
    }
  },
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleInput(value: string) {
  localSearch.value = value

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    context.setSearch(value)
  }, props.debounceTime)
}

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

const scope = computed((): SearchScope => {
  return {
    context,
    search: localSearch.value,
    setSearch: handleInput,
  }
})
</script>
