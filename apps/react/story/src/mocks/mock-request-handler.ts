import type { ListResponse, RequestContext, RequestHandler } from '@shilp.dev/list-types'
import { mockItems, type MockItem } from './mock-items'

export interface MockRequestHandlerOptions {
  delay?: number
  items?: MockItem[]
  shouldFail?: boolean
}

function sortItems(items: MockItem[], sortBy?: string, sortOrder?: string): MockItem[] {
  if (!sortBy) return items

  return [...items].sort((left, right) => {
    const leftValue = left[sortBy as keyof MockItem]
    const rightValue = right[sortBy as keyof MockItem]

    if (leftValue === rightValue) return 0

    const direction = sortOrder === 'asc' ? 1 : -1

    if (typeof leftValue === 'string' && typeof rightValue === 'string') {
      return leftValue.localeCompare(rightValue) * direction
    }

    return leftValue > rightValue ? direction : -direction
  })
}

function filterItems(items: MockItem[], context: RequestContext): MockItem[] {
  let nextItems = [...items]

  if (context.search) {
    const query = context.search.toLowerCase()
    nextItems = nextItems.filter((item) => item.name.toLowerCase().includes(query))
  }

  if (context.filters?.status) {
    nextItems = nextItems.filter((item) => item.status === context.filters?.status)
  }

  return nextItems
}

export function createMockRequestHandler(
  options: MockRequestHandlerOptions = {},
): RequestHandler<MockItem> {
  const sourceItems = options.items ?? mockItems
  const delay = options.delay ?? 400

  return async (context) => {
    if (options.shouldFail) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      throw new Error('Failed to load list data.')
    }

    await new Promise((resolve) => setTimeout(resolve, delay))

    const filteredItems = filterItems(sourceItems, context)
    const sortedItems = sortItems(filteredItems, context.sortBy, context.sortOrder)
    const page = context.page ?? 1
    const perPage = context.perPage ?? 10
    const start = (page - 1) * perPage
    const items = sortedItems.slice(start, start + perPage)

    const response: ListResponse<MockItem> = {
      items,
      count: sortedItems.length,
      meta: {},
    }

    return response
  }
}

export const mockRequestHandler = createMockRequestHandler()
