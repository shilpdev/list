import { Fragment, type ReactNode } from 'react'
import type { FilterScope, FiltersScope, FilterState } from '@shared'
import { useListContext } from '../context/list-context'

type ListFiltersProps = {
  /** Replaces the whole set of filters. Gets `{ context, setFilter, setFilters }`. */
  children?: ReactNode | ((scope: FiltersScope) => ReactNode)
  /** Renders one filter. Gets `{ context, column, value, isDirty, setValue }`. */
  filter?: (scope: FilterScope) => ReactNode
}

export const ListFilters = ({ children, filter: filterFn }: ListFiltersProps) => {
  const context = useListContext()
  const { filters, setFilter, setFilters } = context

  function getFilterScope(filter: FilterState): FilterScope {
    return {
      context,
      ...filter,
      setValue: (value: unknown) => {
        setFilter(filter.column, value)
      },
    }
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context, setFilter, setFilters })
  } else if (children) {
    content = children
  } else {
    content = filters.map((filter) => {
      if (filterFn) {
        return <Fragment key={filter.column}>{filterFn(getFilterScope(filter))}</Fragment>
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
    })
  }

  return <div className="shilp-list__filters">{content}</div>
}
