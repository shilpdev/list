import type { Filters } from '@shilp.dev/list-types'

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function hasActiveFilters(
  currentFilters: Filters | undefined,
  initialFilters: Filters | undefined = {},
): boolean {
  const current = currentFilters ?? {}
  const initial = initialFilters ?? {}

  if (!initial || Object.keys(initial).length === 0) {
    return Object.keys(current).length > 0
  }

  if (Object.keys(current).length === 0) {
    return false
  }

  return !deepEqual(current, initial)
}
