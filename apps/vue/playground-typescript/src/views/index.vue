<template>
  <div class="py">
    <UContainer>
      <List
        endpoint="skills"
        :per-page="5"
        pagination-mode="pagination"
        :request-handler="vueListConfig.requestHandler"
        :state-manager="vueListConfig.stateManager"
      >
        <template #default="listState">
          <div class="grid grid-cols-3 h-screen gap-5 p-5">
            <div class="col-span-2 overflow-y-auto p-1">
              <ListInitialLoader />
              <ListLoader />

              <ListError />
              <ListError v-slot="{ error }">
                <pre>{{ error.name }}</pre>
                <pre>{{ error.message }}</pre>
              </ListError>
              <ListItems>
                <template #item="{ item }">
                  <UCard>{{ (item as unknown as Skill).name }}</UCard>
                </template>
              </ListItems>
              <ListEmpty />
            </div>
            <div class="col-span-1 overflow-y-auto p-1">
              <p class="mb-2 text-xs text-gray-500">
                Root list state count: {{ listState.count }}
              </p>
              <UAccordion :items="components">
                <template #pagination>
                  <ListPagination />
                  <ListPagination v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListPagination>
                </template>
                <template #loadmore>
                  <ListLoadMore />
                  <ListLoadMore v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListLoadMore>
                </template>
                <template #search>
                  <ListSearch />
                  <ListSearch v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListSearch>
                </template>
                <template #summary>
                  <ListSummary />
                  <ListSummary v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListSummary>
                </template>
                <template #goto>
                  <ListGoTo />
                  <ListGoTo v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListGoTo>
                </template>
                <template #perpage>
                  <ListPerPage />
                  <ListPerPage v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListPerPage>
                </template>
                <template #attributes>
                  <ListAttributes />
                  <ListAttributes v-slot="scope">
                    <pre class="text-xs">{{ scope }}</pre>
                  </ListAttributes>
                </template>
                <template #refresh>
                  <ListRefresh />
                </template>
              </UAccordion>
            </div>
          </div>
        </template>
      </List>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import {
  List,
  ListAttributes,
  ListEmpty,
  ListError,
  ListGoTo,
  ListInitialLoader,
  ListItems,
  ListLoadMore,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListSearch,
  ListSummary,
} from '@7span/vue-list'
import type { Skill } from '@/types/skill'
import vueListConfig from '@/api/vue-list-config'

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
