'use client'
import { ListWrapper } from '@/components/list-wrapper'
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

export default function Page() {
  return (
    <ListWrapper
      title="Products"
      description="https://dummyjson.com/products"
      endpoint="products"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search products..."
      paginationMode="loadMore"
    />
  )
}
