<template>
  <div v-if="showContent" class="vue-list__go-to">
    <slot v-bind="scope">
      <select
        :value="scope.context.page"
        @change="scope.context.setPage(Number(($event.target as HTMLSelectElement).value))"
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
import type { GoToScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListGoTo',
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const scope = computed((): GoToScope => {
  const pagesCount = Math.ceil(context.count / context.perPage)
  const pages = Array.from({ length: pagesCount }, (_, index) => index + 1)

  return {
    context,
    pages,
    pagesCount,
  }
})
</script>
