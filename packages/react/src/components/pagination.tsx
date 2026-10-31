import type { PaginationScope } from '@shared'
import { getPagination, getPaginationItemScope } from '@shared/utils'
import { DEFAULT_PAGE_LINKS } from '@shared/constants'
import { FIRST_MESSAGE, LAST_MESSAGE, NEXT_MESSAGE, PREV_MESSAGE } from '@shared/messages'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListPaginationProps } from '../types'

export const ListPagination = ({
  children,
  pageLinks = DEFAULT_PAGE_LINKS,
  first,
  prev,
  pages,
  page: pageItem,
  next,
  last,
}: ListPaginationProps) => {
  const context = useListContext()
  const { count, setPage, error, page, perPage, isInitialLoading, hasMore, isEmpty } = context

  if (isInitialLoading || isEmpty || error) {
    return null
  }

  const pagination = getPagination(page, perPage, count, pageLinks)
  const scope: PaginationScope = {
    context,
    ...pagination,
    hasNext: hasMore,
    prev: () => setPage(page - 1),
    next: () => setPage(page + 1),
    first: () => setPage(1),
    last: () => setPage(pagination.pagesCount),
  }

  // Each part is a nested `Slot` named like the Vue slot: its render prop replaces the default.
  return (
    <Slot
      className="shilp-list__pagination"
      scope={scope}
      children={children}
      fallback={() => (
        <>
          <Slot
            scope={scope}
            children={first}
            fallback={() => (
              <button type="button" disabled={!scope.hasPrev} onClick={scope.first}>
                {FIRST_MESSAGE}
              </button>
            )}
          />
          <Slot
            scope={scope}
            children={prev}
            fallback={() => (
              <button type="button" disabled={!scope.hasPrev} onClick={scope.prev}>
                {PREV_MESSAGE}
              </button>
            )}
          />
          <Slot
            scope={scope}
            children={pages}
            fallback={() => {
              return scope.pagesToDisplay.map((item) => (
                <Slot
                  key={item}
                  scope={getPaginationItemScope(scope, item)}
                  children={pageItem}
                  fallback={(itemScope) => {
                    if (itemScope.isActive) {
                      return <span>{item}</span>
                    }

                    return (
                      <button type="button" onClick={() => setPage(item)}>
                        {item}
                      </button>
                    )
                  }}
                />
              ))
            }}
          />
          <Slot
            scope={scope}
            children={next}
            fallback={() => (
              <button type="button" disabled={!scope.hasNext} onClick={scope.next}>
                {NEXT_MESSAGE}
              </button>
            )}
          />
          <Slot
            scope={scope}
            children={last}
            fallback={() => (
              <button type="button" disabled={!scope.hasNext} onClick={scope.last}>
                {LAST_MESSAGE}
              </button>
            )}
          />
        </>
      )}
    />
  )
}
