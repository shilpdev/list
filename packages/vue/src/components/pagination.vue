<template>
  <div v-if="showContent" class="shilp-list__pagination">
    <slot v-bind="scope">
      <slot name="first" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.first">First</button>
      </slot>

      <slot name="prev" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.prev">Prev</button>
      </slot>

      <slot name="pages" v-bind="scope">
        <template v-for="item in scope.pagesToDisplay" :key="item">
          <slot name="page" v-bind="itemScope(item)">
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
import { DEFAULT_PAGE_LINKS } from '../../../../shared/constants'
import { getPagination } from '../../../../shared/utils'
import type { PaginationProps, PaginationScope, PaginationItemScope } from '../../../../shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPagination',
})

const props = withDefaults(defineProps<PaginationProps>(), {
  pageLinks: DEFAULT_PAGE_LINKS,
})

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && context.rows.length > 0 && !context.error
})

const scope = computed((): PaginationScope => {
  const { page, perPage, count } = context
  const pagination = getPagination(page, perPage, count, props.pageLinks)

  return {
    context,
    ...pagination,
    hasNext: context.hasMore,
    prev: () => context.setPage(page - 1),
    next: () => context.setPage(page + 1),
    first: () => context.setPage(1),
    last: () => context.setPage(pagination.pagesCount),
  }
})

const itemScope = (item: number): PaginationItemScope => {
  return {
    ...scope.value,
    page: item,
    isActive: item === context.page,
  }
}
</script>
