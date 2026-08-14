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
          <slot name="page" :page="item" :isActive="item === scope.page">
            <span v-if="item === scope.page">{{ item }}</span>
            <button v-else type="button" @click="scope.setPage(item)">
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
import type { PaginationComponentOptions, PaginationScope } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPagination',
})

const props = withDefaults(defineProps<PaginationComponentOptions>(), {
  pageLinks: 5,
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

const scope = computed((): PaginationScope => {
  const state = listState.value
  const { page, perPage } = state.pagination
  const total = state.count
  const pagesCount = Math.ceil(total / perPage)
  const halfWay = Math.floor(props.pageLinks / 2)
  const hasNext = page * perPage < total
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
    page,
    perPage,
    count: total,
    pagesCount,
    halfWay,
    hasNext,
    hasPrev,
    pagesToDisplay,
    prev: () => state.setPage(page - 1),
    next: () => state.setPage(page + 1),
    first: () => state.setPage(1),
    last: () => state.setPage(pagesCount),
    setPage: (nextPage: number) => state.setPage(nextPage),
  }
})
</script>
