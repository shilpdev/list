<template>
  <div class="py">
    <UContainer>
      <VueList endpoint="skills" :per-page="5" pagination-mode="pagination">
        <template #default="listState">
          <div class="grid grid-cols-3 h-screen gap-5 p-5">
            <div class="col-span-2 overflow-y-auto p-1">
              <VueListInitialLoader />
              <VueListLoader />

              <VueListError />
              <VueListError v-slot="{ error }">
                <pre>{{ error.name }}</pre>
                <pre>{{ error.message }}</pre>
              </VueListError>
              <VueListItems>
                <template #item="{ item }">
                  <UCard>{{ (item as Skill).name }}</UCard>
                </template>
              </VueListItems>
              <VueListEmpty />
            </div>
            <div class="col-span-1 overflow-y-auto p-1">
              <p class="mb-2 text-xs text-gray-500">
                Root list state count: {{ listState.count }}
              </p>
              <UAccordion :items="components">
                <template #pagination>
                  <VueListPagination />
                  <VueListPagination v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListPagination>
                </template>
                <template #loadmore>
                  <VueListLoadMore />
                  <VueListLoadMore v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListLoadMore>
                </template>
                <template #search>
                  <VueListSearch />
                  <VueListSearch v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListSearch>
                </template>
                <template #summary>
                  <VueListSummary />
                  <VueListSummary v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListSummary>
                </template>
                <template #goto>
                  <VueListGoTo />
                  <VueListGoTo v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListGoTo>
                </template>
                <template #perpage>
                  <VueListPerPage />
                  <VueListPerPage v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </VueListPerPage>
                </template>
                <template #attributes>
                  <VueListAttributes />
                  <VueListAttributes v-slot="{ attrs, attrSettings, updateAttr }">
                    <pre class="text-xs">{{ { attrs, attrSettings, updateAttr: !!updateAttr } }}</pre>
                  </VueListAttributes>
                </template>
                <template #refresh>
                  <VueListRefresh />
                </template>
              </UAccordion>
            </div>
          </div>
        </template>
      </VueList>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import type { Skill } from '@/types/skill'

defineOptions({
  name: 'PlaygroundIndexView',
})

const components = [
  { label: 'Pagination', slot: 'pagination' },
  { label: 'Load More', slot: 'loadmore' },
  { label: 'Search', slot: 'search' },
  { label: 'Summary', slot: 'summary' },
  { label: 'Go To', slot: 'goto' },
  { label: 'Per Page', slot: 'perpage' },
  { label: 'Attributes', slot: 'attributes' },
  { label: 'Refresh', slot: 'refresh' },
] as const
</script>
