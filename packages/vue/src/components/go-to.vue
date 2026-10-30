<template>
  <div v-if="showContent" class="shilp-list__go-to">
    <slot v-bind="scope">
      <select :value="context.page" @change="context.setPage(Number(($event.target as HTMLSelectElement).value))">
        <option v-for="pageNum in scope.pages" :key="`page-${pageNum}`" :value="pageNum">
          {{ MESSAGES.pageOptionPrefix }} {{ pageNum }}
        </option>
      </select>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPagesCount } from '@shared/utils'
import { MESSAGES } from '@shared/constants'
import type { GoToScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListGoTo',
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && !context.isEmpty && !context.error
})

const scope = computed((): GoToScope => {
  const pagesCount = getPagesCount(context.count, context.perPage)
  const pages = Array.from({ length: pagesCount }, (_, index) => {
    return index + 1
  })

  return {
    context,
    pages,
    pagesCount,
  }
})
</script>
