import { type ReactNode } from 'react'
import type { SummaryScope } from '@shared'
import { getSummaryMessage, getSummaryRange } from '@shared/utils'
import { useListContext } from '../context/list-context'

type ListSummaryProps = {
  children?: ReactNode | ((scope: SummaryScope) => ReactNode)
}

export const ListSummary = ({ children }: ListSummaryProps) => {
  const context = useListContext()
  const { rows, count, error, page, perPage, isInitialLoading } = context

  if (isInitialLoading || rows.length === 0 || error) {
    return null
  }

  const scope: SummaryScope = {
    context,
    ...getSummaryRange(page, perPage, count),
    visibleCount: rows.length,
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children(scope)
  } else if (children) {
    content = children
  } else {
    content = <span>{getSummaryMessage(scope)}</span>
  }

  return <div className="shilp-list__summary">{content}</div>
}
