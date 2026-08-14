<template>
  <div class="vue-list__search">
    <slot v-bind="scope">
      <input
        type="text"
        :value="localSearch"
        @input="handleInput(($event.target as HTMLInputElement).value)"
        placeholder="Search"
      />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import type { SearchComponentOptions, SearchScope } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListSearch',
})

const props = withDefaults(defineProps<SearchComponentOptions>(), {
  debounceTime: 500,
})

const { listState } = useListContext()
const localSearch = ref(listState.value.search)

watch(
  () => listState.value.search,
  (value) => {
    if (value !== localSearch.value) {
      localSearch.value = value
    }
  },
)

const debouncedSetSearch = debounce((value: string) => {
  listState.value.setSearch(value)
}, props.debounceTime)

function handleInput(value: string) {
  localSearch.value = value
  debouncedSetSearch(value)
}

const scope = computed((): SearchScope => ({
  search: localSearch.value,
  setSearch: handleInput,
}))
</script>
