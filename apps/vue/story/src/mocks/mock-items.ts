export type MockItemStatus = 'draft' | 'published' | 'archived'

export interface MockItem {
  id: number
  name: string
  status: MockItemStatus
  date_updated: string
}

const statuses: MockItemStatus[] = ['draft', 'published', 'archived']

export const mockItems: MockItem[] = Array.from({ length: 47 }, (_, index) => ({
  id: index + 1,
  name: `Item ${index + 1}`,
  status: statuses[index % statuses.length]!,
  date_updated: new Date(Date.now() - index * 86_400_000).toISOString(),
}))

export function formatMockDate(value: string): string {
  return new Date(value).toLocaleString()
}
