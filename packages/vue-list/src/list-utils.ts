export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function hasActiveFilters(filters: Record<string, unknown> | undefined): boolean {
  if (!filters) return false

  return Object.values(filters).some((value) => {
    if (value === null || value === undefined || value === '') return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })
}
