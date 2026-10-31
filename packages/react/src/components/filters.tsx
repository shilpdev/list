import type { ReactNode } from 'react'
import type { FilterScope } from '@shared'
import { getFilterScope } from '@shared/utils'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListFiltersProps } from '../types'

export const ListFilters = ({ children, ...filterSlots }: ListFiltersProps) => {
  const context = useListContext()
  const { filters, setFilter, setFilters } = context

  // `children` is the whole control; each filter is a nested slot named after its column.
  return (
    <Slot
      className="shilp-list__filters"
      scope={{ context, setFilter, setFilters }}
      children={children}
      fallback={() => {
        return filters.map((filter) => {
          return (
            <Slot
              key={filter.column}
              scope={getFilterScope(filter, context)}
              children={
                filterSlots[filter.column] as ((scope: FilterScope) => ReactNode) | undefined
              }
              fallback={() => (
                <label>
                  <span>{filter.column}</span>
                  <input
                    type="text"
                    value={String(filter.value ?? '')}
                    onChange={(e) => setFilter(filter.column, e.target.value)}
                  />
                </label>
              )}
            />
          )
        })
      }}
    />
  )
}
