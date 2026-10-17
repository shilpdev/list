import { type ReactNode } from 'react'
import type { SummaryScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListSummaryProps = {
  children?: ReactNode | ((scope: SummaryScope) => ReactNode)
}

export const ListSummary = ({ children }: ListSummaryProps) => {
  const context = useListContext()
  const { rows, count, error, page, perPage, isInitialLoading } = context

  const summaryData = {
    from: page * perPage - perPage + 1,
    to: Math.min(page * perPage, count),
    visibleCount: rows?.length || 0,
  }

  const scope: SummaryScope = {
    context,
    ...summaryData,
  }

  if (isInitialLoading) return null

  if (!rows || rows.length === 0) {
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
