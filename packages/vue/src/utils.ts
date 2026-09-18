import { startCase } from 'lodash-es'
import type { ListAttribute } from '../../../shared'

type AttrInput = string | (ListAttribute & { attrs?: AttrInput[] })

/**
 * Converts attribute names or objects into normalized attribute definitions.
 */
export const attrSerializer = (attrs: AttrInput[]): ListAttribute[] => {
  return attrs.map((item) => {
    if (typeof item === 'string') {
      return {
        label: startCase(item),
        name: item,
      }
    }

    const normalized = { ...item }

    if (normalized.attrs) {
      normalized.attrs = attrSerializer(normalized.attrs)
    }

    return {
      label: startCase(normalized.name),
      ...normalized,
    }
  })
}

export const DEFAULT_ID_KEY = 'id'

export const getItemId = (
  item: unknown,
  idKey: string = DEFAULT_ID_KEY,
): string | number | undefined => {
  if (item == null || typeof item !== 'object') return undefined

  const value = (item as Record<string, unknown>)[idKey]
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
