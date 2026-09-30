import { type ReactNode } from 'react'
import type { SummaryScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListSummaryProps = {
  children?: (scope: SummaryScope) => ReactNode
}

export const ListSummary = ({ children }: ListSummaryProps) => {
  const { listState } = useListContext()
  const { data, count, pagination, loader, error } = listState
  const { page, perPage } = pagination
  const { initialLoading } = loader

  const summaryData = {
    from: page * perPage - perPage + 1,
    to: Math.min(page * perPage, count),
    visibleCount: data?.length || 0,
  }

  const scope: SummaryScope = {
    ...summaryData,
    count,
  }

  if (initialLoading) return null

  if (!data || data.length === 0) {
    return null
  }

  if (error) {
    return null
  }

  return (
    <div className="react-list__summary">
      {typeof children === 'function' ? (
        children(scope)
      ) : children ? (
        children
      ) : (
        <span>
          Showing <span>{summaryData.visibleCount}</span> items (
          <span>
            {summaryData.from} - {summaryData.to}
          </span>
          ) out of <span>{count}</span>
        </span>
      )}
    </div>
  )
}
