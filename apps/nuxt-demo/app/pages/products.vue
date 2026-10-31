<script setup lang="ts">
import type { ColumnConfig, FilterConfig } from '~/types/list'

const PER_PAGE = 10

const columns: ColumnConfig[] = [
  { name: 'title', label: 'Title', isSortable: true },
  { name: 'brand', label: 'Brand', isSortable: true },
  { name: 'category', label: 'Category' },
  { name: 'price', label: 'Price', isSortable: true },
  { name: 'rating', label: 'Rating', isSortable: true },
  { name: 'stock', label: 'Stock', isSortable: true },
]

const filters: FilterConfig[] = [
  {
    column: 'category',
    label: 'Categories',
    options: ['beauty', 'fragrances', 'furniture', 'groceries', 'laptops', 'smartphones'].map(
      (category) => {
        return { value: category, label: category }
      },
    ),
  },
]

// Fetched on the server, so the HTML ships with the first page and the list skips its first
// client request.
const { data: initialResponse } = await useAsyncData('products-initial', () => {
  return requestHandler({
    endpoint: 'products',
    page: 1,
    perPage: PER_PAGE,
    search: '',
    sortBy: '',
    sortOrder: '',
    filters: [],
  })
})
</script>

<template>
  <ListWrapper
    v-if="initialResponse"
    title="Products"
    endpoint="products"
    :per-page="PER_PAGE"
    pagination-mode="loadMore"
    :columns="columns"
    :filters="filters"
    search-placeholder="Search products..."
    :initial-response="initialResponse"
  />
</template>
