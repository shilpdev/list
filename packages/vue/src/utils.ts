export const DEFAULT_ID_KEY = 'id'

export const getItemId = (
  item: unknown,
  idKey: string = DEFAULT_ID_KEY,
): string | number | undefined => {
  if (item == null || typeof item !== 'object') return undefined

  const value = (item as Record<string, unknown>)[idKey]
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
