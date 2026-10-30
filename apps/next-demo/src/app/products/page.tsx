import { Suspense } from 'react'

import { fetchInitialResponse } from '@/api/request-handler'
import { ListWrapper, ListWrapperSkeleton } from '@/components/list-wrapper'
import type { ColumnConfig, FilterConfig } from '@/types/list'

const COLUMNS: ColumnConfig[] = [
  { name: 'thumbnail', label: 'Image', format: 'image' },
  { name: 'id', label: 'ID', isSortable: true },
  { name: 'title', label: 'Title', isSortable: true },
  { name: 'brand', label: 'Brand', isSortable: true },
  { name: 'category', label: 'Category', format: 'badge' },
  { name: 'price', label: 'Price', format: 'currency', isSortable: true },
  { name: 'rating', label: 'Rating', isSortable: true },
  { name: 'stock', label: 'Stock', isSortable: true },
]

const CATEGORIES = [
  'beauty',
  'fragrances',
  'furniture',
  'groceries',
  'laptops',
  'smartphones',
  'sports-accessories',
  'tops',
]

const FILTERS: FilterConfig[] = [
  {
    column: 'category',
    label: 'Categories',
    options: CATEGORIES.map((slug) => {
      return { value: slug, label: slug.replace('-', ' ') }
    }),
  },
]

// The dummyjson fetch is uncached runtime data. Under Cache Components it cannot run in the
// prerendered shell, so it lives in an async child wrapped in <Suspense>: the shell (header, card,
// toolbar) prerenders and the first page streams in at request time.
async function ProductsList() {
  // Fetch the first page on the server. `perPage` matches the ListWrapper default (10).
  const initialResponse = await fetchInitialResponse({ endpoint: 'products', perPage: 10 })

  return (
    <ListWrapper
      title="Products"
      description="https://dummyjson.com/products"
      endpoint="products"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search products..."
      paginationMode="loadMore"
      initialResponse={initialResponse}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={<ListWrapperSkeleton title="Products" columnsCount={COLUMNS.length} />}>
      <ProductsList />
    </Suspense>
  )
}
