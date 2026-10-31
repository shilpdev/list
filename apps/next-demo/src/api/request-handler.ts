import type { State } from '@shilp.dev/react-list'

/*
 * The one place that talks to the API (https://dummyjson.com). The list calls it every time page,
 * perPage, search, sort or filters change, and pages call it on the server for the first page.
 *
 * `endpoint` is the list's `endpoint` prop ('users' or 'products'). It is also the key that holds
 * the rows in the dummyjson response.
 *
 * dummyjson applies one of: a search, or a single filter. Search wins; any other active filter is
 * applied here on the full result, and the page is cut out afterwards.
 */
const API_URL = 'https://dummyjson.com'

type Query = Pick<State, 'endpoint' | 'page' | 'perPage' | 'search' | 'sortBy' | 'sortOrder' | 'filters'>

async function get(path: string, params: Record<string, string | number>) {
  const url = `${API_URL}/${path}?${new URLSearchParams(params as Record<string, string>)}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}

export const requestHandler = async (query: Query) => {
  const { endpoint, page, perPage, search, sortBy, sortOrder } = query
  const filters = query.filters.filter((filter) => {
    return filter.value != null && filter.value !== ''
  })

  let apiFilter: Query['filters'][number] | undefined = filters[0]
  let narrowing = filters.slice(1)
  if (search) {
    apiFilter = undefined
    narrowing = filters
  }

  const params: Record<string, string | number> = { limit: perPage, skip: (page - 1) * perPage }
  if (narrowing.length > 0) {
    params.limit = 0
    params.skip = 0
  }

  if (sortBy) {
    params.sortBy = sortBy
    params.order = sortOrder || 'asc'
  }

  let path = endpoint
  if (search) {
    path = `${endpoint}/search`
    params.q = search
  } else if (apiFilter && endpoint === 'products' && apiFilter.column === 'category') {
    path = `products/category/${apiFilter.value}`
  } else if (apiFilter) {
    path = `${endpoint}/filter`
    params.key = apiFilter.column
    params.value = String(apiFilter.value)
  }

  const data = await get(path, params)
  let rows: Record<string, unknown>[] = data[endpoint]
  let count: number = data.total

  if (narrowing.length > 0) {
    rows = rows.filter((row) => {
      return narrowing.every((filter) => {
        return String(row[filter.column]) === String(filter.value)
      })
    })
    count = rows.length
    rows = rows.slice((page - 1) * perPage, page * perPage)
  }

  return { rows, count }
}
