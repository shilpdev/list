import { memo, useCallback, useMemo, type ReactNode } from 'react'
import type { GoToScope } from '@shared'
import { getPagesCount } from '@shared/utils'
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListGoToProps = {
  children?: ReactNode | ((scope: GoToScope) => ReactNode)
}

export const ListGoTo = memo(({ children }: ListGoToProps) => {
  const context = useListContext()
  const { rows, count, setPage, error, page, perPage, isInitialLoading } = context

  const { pages, pagesCount } = useMemo(() => {
    const pagesCount = getPagesCount(count, perPage)
    const pages = Array.from({ length: pagesCount }, (_, index) => {
      return index + 1
    })

    return { pages, pagesCount }
  }, [count, perPage])

  const handlePageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPage(Number(e.target.value))
    },
    [setPage],
  )

  const scope = useMemo((): GoToScope => {
    return { context, pages, pagesCount }
  }, [context, pages, pagesCount])

  if (isInitialLoading || rows.length === 0 || error) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children(scope)
  } else if (children) {
    content = children
  } else {
    content = (
      <select value={page} onChange={handlePageChange}>
        {pages.map((pageNum) => {
          return (
            <option key={`page-${pageNum}`} value={pageNum}>
              {MESSAGES.pageOptionPrefix} {pageNum}
            </option>
          )
        })}
      </select>
    )
  }

  return <div className="shilp-list__go-to">{content}</div>
})
