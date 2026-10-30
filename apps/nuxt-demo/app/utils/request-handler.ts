import type { RequestHandler } from '@shilp.dev/vue-list'

/*
 * The one place that talks to the API (https://dummyjson.com).
 *
 * The list calls this function every time page, perPage, search or filters change. It receives
 * the current list state and must return `{ rows, count }`. Nuxt auto-imports everything in
 * `utils/`, so both pages share this handler.
 *
 * `endpoint` is the list's `endpoint` prop ('products' or 'users'). It is also the key that
 * holds the rows in the dummyjson response.
 *
 * dummyjson cannot combine search and filters in one request, so a search wins over a filter.
 */
const API = 'https://dummyjson.com'

type ApiResponse = Record<string, unknown>

export const requestHandler: RequestHandler = async (state) => {
  const { endpoint, page, perPage, search, filters } = state

  // Pagination: dummyjson uses `limit` and `skip` instead of a page number.
  const skip = (page - 1) * perPage

  if (search) {
    const response = await $fetch<ApiResponse>(`${API}/${endpoint}/search`, {
      query: { q: search, limit: perPage, skip },
    })

    return { rows: response[endpoint] as unknown[], count: response.total as number }
  }

  // Filters: the filter selects are multiple, so a filter value is an array of choices. An empty
  // array means "not filtering".
  const filter = filters.find((item) => {
    return Array.isArray(item.value) && item.value.length > 0
  })

  if (!filter) {
    const response = await $fetch<ApiResponse>(`${API}/${endpoint}`, {
      query: { limit: perPage, skip },
    })

    return { rows: response[endpoint] as unknown[], count: response.total as number }
  }

  // dummyjson filters by one value per request, so for several choices we fetch each one
  // (`limit: 0` returns everything), merge them and cut the requested page out ourselves.
  const responses = await Promise.all(
    (filter.value as string[]).map((value) => {
      if (endpoint === 'products') {
        return $fetch<ApiResponse>(`${API}/products/category/${value}`, { query: { limit: 0 } })
      }

      return $fetch<ApiResponse>(`${API}/${endpoint}/filter`, {
        query: { key: filter.column, value, limit: 0 },
      })
    }),
  )

  const rows = responses.flatMap((response) => {
    return response[endpoint] as unknown[]
  })

  return { rows: rows.slice(skip, skip + perPage), count: rows.length }
}
