import { Fragment, type ReactNode } from 'react'
import type { FilterState } from '@shared'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListFiltersProps } from '../types'
import { getFilterScope } from '@shared/utils'

export const ListFilters = ({ children, filter: filterFn }: ListFiltersProps) => {
  const context = useListContext()
  const { filters, setFilter, setFilters } = context

  function renderFilter(filter: FilterState): ReactNode {
    if (filterFn) {
      return <Fragment key={filter.column}>{filterFn(getFilterScope(filter, context))}</Fragment>
    }

    return (
      <label key={filter.column}>
        <span>{filter.column}</span>
        <input
          type="text"
          value={String(filter.value ?? '')}
          onChange={(e) => setFilter(filter.column, e.target.value)}
        />
      </label>
    )
  }

  return (
    <Slot
      className="shilp-list__filters"
      scope={{ context, setFilter, setFilters }}
      children={children}
      fallback={() => filters.map(renderFilter)}
    />
  )
}
