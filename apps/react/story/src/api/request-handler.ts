import type { ListResponse, RequestHandler } from '@shilp.dev/list-types'
import type { Skill } from '../types/skill'

const EVEREST_ITEMS_BASE_URL = 'https://everest.7span.in/items'

export interface CreateRequestHandlerOptions {
  shouldFail?: boolean
  forceEmpty?: boolean
}

interface EverestListResponse {
  data?: Skill[]
  meta?: {
    total_count?: number
    filter_count?: number
  }
}

export function createRequestHandler(
  options: CreateRequestHandlerOptions = {},
): RequestHandler<Skill> {
  return async ({
    endpoint,
    page,
    perPage,
    search,
    sortBy,
    sortOrder,
    filters,
  }): Promise<ListResponse<Skill>> => {
    if (options.shouldFail) {
      throw new Error('Failed to load list data.')
    }

    if (options.forceEmpty) {
      return {
        items: [],
        count: 0,
        meta: {},
      }
    }

    const params = new URLSearchParams()

    if (page && perPage) {
      params.append('page', String(page))
      params.append('limit', String(perPage))
    }

    if (search) {
      params.append('search', search)
    }

    if (sortBy) {
      params.append('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy)
    }

    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (typeof value === 'object' && value !== null) {
            Object.entries(value as Record<string, unknown>).forEach(
              ([operator, operatorValue]) => {
                params.append(`filter[${key}][${operator}]`, String(operatorValue))
              },
            )
          } else {
            params.append(`filter[${key}][_eq]`, String(value))
          }
        }
      })
    }

    params.append('meta', '*')

    const queryString = params.toString()
    const url = `${EVEREST_ITEMS_BASE_URL}/${endpoint}${
      queryString ? `?${queryString}` : ''
    }`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as EverestListResponse

    return {
      items: data.data ?? [],
      count: data.meta?.filter_count ?? data.meta?.total_count ?? 0,
      meta: data.meta ?? {},
    }
  }
}

export const requestHandler = createRequestHandler()
