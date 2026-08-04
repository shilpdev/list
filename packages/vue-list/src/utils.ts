import { startCase } from 'lodash-es'
import type { ListAttribute } from '@7span/list-types'

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
