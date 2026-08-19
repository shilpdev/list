<template>
  <div v-if="showContent" class="vue-list__go-to">
    <slot v-bind="scope">
      <select
        :value="scope.page"
        @input="scope.setPage(Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="pageNum in scope.pages" :key="`page-${pageNum}`" :value="pageNum">
          Page {{ pageNum }}
        </option>
      </select>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GoToScope } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListGoTo',
})

const { listState } = useListContext()

const showContent = computed(() => {
  const state = listState.value
  return !state.loader.initialLoading && state.data.length > 0 && !state.error
})

const scope = computed((): GoToScope => {
  const state = listState.value
  const { page, perPage } = state.pagination
  const pagesCount = Math.ceil(state.count / perPage)
  const pages = Array.from({ length: pagesCount }, (_, index) => index + 1)

  return {
    page,
    pages,
    pagesCount,
    setPage: state.setPage,
  }
})
</script>
