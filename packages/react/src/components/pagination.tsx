import { memo, useMemo } from 'react'
import type { PaginationScope } from '@shared'
import { getPagination } from '@shared/utils'
import { DEFAULT_PAGE_LINKS } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListPaginationProps } from '../types'

export const ListPagination = memo(
  ({ children, pageLinks = DEFAULT_PAGE_LINKS }: ListPaginationProps) => {
    const context = useListContext()
    const { rows, count, setPage, error, page, perPage, isInitialLoading, hasMore, isEmpty } =
      context

    const scope = useMemo((): PaginationScope => {
      const pagination = getPagination(page, perPage, count, pageLinks)

      return {
        context,
        ...pagination,
        hasNext: hasMore,
        prev: () => setPage(page - 1),
        next: () => setPage(page + 1),
        first: () => setPage(1),
        last: () => setPage(pagination.pagesCount),
      }
    }, [context, setPage, page, perPage, count, pageLinks, hasMore])

    if (isInitialLoading || isEmpty || error) {
      return null
    }

    return (
      <Slot
        className="shilp-list__pagination"
        scope={scope}
        children={children}
        fallback={() => (
          <>
            <button type="button" disabled={!scope.hasPrev} onClick={scope.first}>
              First
            </button>
            <button type="button" disabled={!scope.hasPrev} onClick={scope.prev}>
              Prev
            </button>
            {scope.pagesToDisplay.map((item) =>
              item === page ? (
                <span key={`page-${item}`}>{item}</span>
              ) : (
                <button key={`page-${item}`} type="button" onClick={() => setPage(item)}>
                  {item}
                </button>
              ),
            )}
            <button type="button" disabled={!scope.hasNext} onClick={scope.next}>
              Next
            </button>
            <button type="button" disabled={!scope.hasNext} onClick={scope.last}>
              Last
            </button>
          </>
        )}
      />
    )
  },
)
