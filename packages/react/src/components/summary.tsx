import type { SummaryScope } from '@shared'
import { getSummaryRange } from '@shared/utils'
import { getSummaryMessage } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListSummaryProps } from '../types'

export const ListSummary = ({ children }: ListSummaryProps) => {
  const context = useListContext()
  const { rows, count, error, page, perPage, isInitialLoading, isEmpty } = context

  const scope: SummaryScope = {
    context,
    ...getSummaryRange(page, perPage, count),
    visibleCount: rows.length,
  }

  if (isInitialLoading || isEmpty || error) {
    return null
  }

  return (
    <Slot
      className="shilp-list__summary"
      scope={scope}
      children={children}
      fallback={(scope) => <span>{getSummaryMessage(scope)}</span>}
    />
  )
}
