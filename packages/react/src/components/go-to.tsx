import { useMemo } from 'react'
import type { GoToScope } from '@shared'
import { getPagesCount } from '@shared/utils'
import { getGoToMessage } from '@shared/messages'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListGoToProps } from '../types'

export const ListGoTo = ({ children }: ListGoToProps) => {
  const context = useListContext()
  const { count, setPage, error, page, perPage, isInitialLoading, isEmpty } = context

  const scope = useMemo((): GoToScope => {
    const pagesCount = getPagesCount(count, perPage)
    const pages = Array.from({ length: pagesCount }, (_, index) => {
      return index + 1
    })

    return {
      context,
      pages,
      pagesCount,
    }
  }, [count, perPage, context])

  if (isInitialLoading || isEmpty || error) {
    return null
  }

  return (
    <Slot
      className="shilp-list__go-to"
      scope={scope}
      children={children}
      fallback={(scope) => (
        <select value={page} onChange={(e) => setPage(Number(e.target.value))}>
          {scope.pages.map((pageNum) => {
            return (
              <option key={`page-${pageNum}`} value={pageNum}>
                {getGoToMessage(pageNum)}
              </option>
            )
          })}
        </select>
      )}
    />
  )
}
