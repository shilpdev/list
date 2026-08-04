<template>
  <div
    v-if="listState.loader.isLoading && !listState.loader.initialLoading"
    class="vue-list__loader"
    :class="positionClass"
  >
    <slot v-bind="scope">
      <p>Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoaderComponentOptions, LoaderScope } from '@7span/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'VueListLoader',
})

const props = withDefaults(defineProps<LoaderComponentOptions>(), {
  position: 'overlay',
})

const { listState } = useListContext()

const positionClass = computed(() => `vue-list__loader--${props.position}`)

const scope = computed((): LoaderScope => ({
  isLoading: listState.value.loader.isLoading,
}))
</script>
