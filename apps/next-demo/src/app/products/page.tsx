import { requestHandler } from '@/api/request-handler'
import { ListWrapper } from '@/components/list/list-wrapper'
import type { ColumnConfig, FilterConfig } from '@/types/list'

const COLUMNS: ColumnConfig[] = [
  { name: 'title', label: 'Title', isSortable: true },
  { name: 'brand', label: 'Brand', isSortable: true },
  { name: 'category', label: 'Category' },
  { name: 'price', label: 'Price', isSortable: true },
  { name: 'rating', label: 'Rating', isSortable: true },
  { name: 'stock', label: 'Stock', isSortable: true },
]

const FILTERS: FilterConfig[] = [
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

const PER_PAGE = 10

// Fetched on every request so the HTML ships with the first page and the list skips its first
// client request.
export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialResponse = await requestHandler({
    endpoint: 'products',
    page: 1,
    perPage: PER_PAGE,
    search: '',
    sortBy: '',
    sortOrder: '',
    filters: [],
  })

  return (
    <ListWrapper
      title="Products"
      endpoint="products"
      perPage={PER_PAGE}
      paginationMode="loadMore"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search products..."
      initialResponse={initialResponse}
    />
  )
}
