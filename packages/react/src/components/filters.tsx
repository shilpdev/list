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

  function getFilterScope(item: FilterState): FilterScope {
    return {
      context,
      ...item,
      setValue: (value: unknown) => {
        setFilter(item.column, value)
      },
    }
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context, setFilter, setFilters })
  } else if (children) {
    content = children
  } else {
    content = filters.map((item) => {
      if (filterFn) {
        return <Fragment key={item.column}>{filterFn(getFilterScope(item))}</Fragment>
      }

      return (
        <label key={item.column}>
          <span>{item.column}</span>
          <input
            type="text"
            value={String(item.value ?? '')}
            onChange={(e) => setFilter(item.column, e.target.value)}
          />
        </label>
      )
    })
  }

  return <div className="shilp-list__filters">{content}</div>
}
