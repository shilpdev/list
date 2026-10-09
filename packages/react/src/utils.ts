export const deepEqual = (a: unknown, b: unknown): boolean => {
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
  const keysA = Object.keys(recA).filter((k) => recA[k] !== undefined)
  const keysB = Object.keys(recB).filter((k) => recB[k] !== undefined)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(recA[key], recB[key])) return false
  }

  return true
}

export const isEqual = deepEqual

export const DEFAULT_ID_KEY = 'id'

export const getRowId = (
  row: unknown,
  idKey: string = DEFAULT_ID_KEY,
): string | number | undefined => {
  if (row == null || typeof row !== 'object') return undefined

  const value = (row as Record<string, unknown>)[idKey]
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
