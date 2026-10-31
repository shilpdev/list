<template>
  <div v-if="showContent" class="shilp-list__pagination">
    <slot v-bind="scope">
      <slot name="first" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.first">
          {{ FIRST_MESSAGE }}
        </button>
      </slot>

      <slot name="prev" v-bind="scope">
        <button type="button" :disabled="!scope.hasPrev" @click="scope.prev">
          {{ PREV_MESSAGE }}
        </button>
      </slot>

      <slot name="pages" v-bind="scope">
        <template v-for="item in scope.pagesToDisplay" :key="item">
          <slot name="page" v-bind="getPaginationItemScope(scope, item)">
            <span v-if="item === scope.context.page">{{ item }}</span>
            <button v-else type="button" @click="scope.context.setPage(item)">
              {{ item }}
            </button>
          </slot>
        </template>
      </slot>

      <slot name="next" v-bind="scope">
        <button type="button" :disabled="!scope.hasNext" @click="scope.next">
          {{ NEXT_MESSAGE }}
        </button>
      </slot>

      <slot name="last" v-bind="scope">
        <button type="button" :disabled="!scope.hasNext" @click="scope.last">
          {{ LAST_MESSAGE }}
        </button>
      </slot>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_PAGE_LINKS } from '@shared/constants'
import { FIRST_MESSAGE, LAST_MESSAGE, NEXT_MESSAGE, PREV_MESSAGE } from '@shared/messages'
import { getPagination, getPaginationItemScope } from '@shared/utils'
import type { PaginationProps, PaginationScope } from '@shared'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListPagination',
})

const { pageLinks = DEFAULT_PAGE_LINKS } = defineProps<PaginationProps>()

const context = useListContext()

const showContent = computed(() => {
  return !context.isInitialLoading && !context.isEmpty && !context.error
})

const scope = computed((): PaginationScope => {
  const pagination = getPagination(context.page, context.perPage, context.count, pageLinks)

  return {
    context,
    ...pagination,
    hasNext: context.hasMore,
    prev: () => context.setPage(context.page - 1),
    next: () => context.setPage(context.page + 1),
    first: () => context.setPage(1),
    last: () => context.setPage(pagination.pagesCount),
  }
})
</script>
