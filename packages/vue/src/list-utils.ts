import type { Filters } from '../../../shared'

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a == null || b == null) return a === b

  if (typeof a !== 'object' || typeof b !== 'object') return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (Array.isArray(a) || Array.isArray(b)) return false

  const recA = a as Record<string, unknown>
  const recB = b as Record<string, unknown>
  // Ignore keys whose value is undefined (matches React's deepEqual behaviour).
  const keysA = Object.keys(recA).filter((k) => recA[k] !== undefined)
  const keysB = Object.keys(recB).filter((k) => recB[k] !== undefined)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(recA[key], recB[key])) return false
  }

  return true
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
