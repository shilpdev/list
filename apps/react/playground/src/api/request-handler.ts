import type { Filter, RequestHandler } from '@shilp.dev/react-list'

import type { Row } from '@/types/list'

const API_URL = 'https://dummyjson.com'

function isActive(filter: Filter): boolean {
  return filter.value != null && filter.value !== ''
}

// dummyjson can only do one of search, category or filter per request, so search wins, then the
// first filter that has a value. Products are filtered by category through their own route; every
// other resource uses `/:resource/filter?key=&value=`.
function getPath(endpoint: string, search: string, filter: Filter | undefined): string {
  if (search) {
    return `${endpoint}/search`
  }

  if (!filter) {
    return endpoint
  }

  if (endpoint === 'products' && filter.column === 'category') {
    return `products/category/${encodeURIComponent(String(filter.value))}`
  }

  return `${endpoint}/filter`
}

const requestHandler: RequestHandler<Row> = async (state) => {
  const { endpoint, page, perPage, search, sortBy, sortOrder, filters } = state
  const filter = filters.find(isActive)
  const path = getPath(endpoint, search, filter)

  const params = new URLSearchParams()
  params.set('limit', String(perPage))
  params.set('skip', String((page - 1) * perPage))

  if (search) {
    params.set('q', search)
  } else if (filter && path.endsWith('/filter')) {
    params.set('key', filter.column)
    params.set('value', String(filter.value))
  }

  if (sortBy) {
    params.set('sortBy', sortBy)
    params.set('order', sortOrder || 'asc')
  }

  const response = await fetch(`${API_URL}/${path}?${params}`)

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  // dummyjson returns the rows under the resource name, e.g. `{ products: [...], total, skip, limit }`.
  const data = await response.json()

  return {
    rows: data[endpoint] ?? [],
    count: data.total ?? 0,
    meta: { skip: data.skip, limit: data.limit },
  }
}

export default requestHandler
