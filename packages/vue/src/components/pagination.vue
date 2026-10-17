<template>
  <div v-if="showContent" class="vue-list__pagination">
    <slot v-bind="scope">
      <slot name="first" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.first">First</button>
      </slot>

      <slot name="prev" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.prev">Prev</button>
      </slot>

      <slot name="pages" v-bind="scope">
        <template v-for="item in scope.pagesToDisplay" :key="item">
          <slot name="page" v-bind="scope" :page="item" :isActive="item === scope.context.page">
            <span v-if="item === scope.context.page">{{ item }}</span>
            <button v-else type="button" @click="scope.context.setPage(item)">
              {{ item }}
            </button>
          </slot>
        </template>
      </slot>

      <slot name="next" v-bind="scope">
        <button type="button" :disabled="!scope.hasNext" @click="scope.next">Next</button>
      </slot>

      <slot name="last" v-bind="scope">
        <button type="button" :disabled="!scope.hasNext" @click="scope.last">Last</button>
      </slot>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationComponentOptions, PaginationScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPagination',
})

const props = withDefaults(defineProps<PaginationComponentOptions>(), {
  pageLinks: 5,
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const scope = computed((): PaginationScope => {
  const { page, perPage } = context
  const total = context.count
  const pagesCount = Math.ceil(total / perPage)
  const halfWay = Math.floor(props.pageLinks / 2)
  const hasPrev = page !== 1
  const pageCount = Math.min(props.pageLinks, pagesCount)
  const pages = Array.from({ length: pageCount })

  let pagesToDisplay: number[]
  if (page <= halfWay) {
    pagesToDisplay = pages.map((_, index) => index + 1)
  } else if (pagesCount - page < halfWay) {
    pagesToDisplay = pages.map((_, index) => pagesCount - index).reverse()
  } else {
    pagesToDisplay = pages.map((_, index) => page - halfWay + index)
  }

  return {
    context,
    pagesCount,
    halfWay,
    hasNext: context.hasMore,
    hasPrev,
    pagesToDisplay,
    prev: () => context.setPage(page - 1),
    next: () => context.setPage(page + 1),
    first: () => context.setPage(1),
    last: () => context.setPage(pagesCount),
  }
})
</script>
