export const DEFAULT_ID_KEY = 'id'

export const getRowId = (
  row: unknown,
  idKey: string = DEFAULT_ID_KEY,
): string | number | undefined => {
  if (row == null || typeof row !== 'object') return undefined

  const value = (row as Record<string, unknown>)[idKey]
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
