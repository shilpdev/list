import { Fragment, memo, useMemo, type ReactNode } from 'react'
import type {
  PaginationComponentOptions,
  PaginationScope,
  RenderPageArgs,
} from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListPaginationProps = PaginationComponentOptions & {
  children?: ReactNode | ((scope: PaginationScope) => ReactNode)
  renderFirst?: (scope: PaginationScope) => ReactNode
  renderPrev?: (scope: PaginationScope) => ReactNode
  renderPages?: (scope: PaginationScope) => ReactNode
  renderPage?: (scope: RenderPageArgs) => ReactNode
  renderNext?: (scope: PaginationScope) => ReactNode
  renderLast?: (scope: PaginationScope) => ReactNode
}

export const ListPagination = memo(
  ({
    children,
    pageLinks = 5,
    renderFirst,
    renderPrev,
    renderPages,
    renderPage,
    renderNext,
    renderLast,
  }: ListPaginationProps) => {
    const context = useListContext()
    const { rows, count, setPage, error, page, perPage, isInitialLoading, hasMore } = context

    const paginationState = useMemo(() => {
      const pagesCount = Math.ceil(count / perPage)
      const halfWay = Math.floor(pageLinks / 2)
      const hasPrev = page !== 1
      return { pagesCount, halfWay, hasNext: hasMore, hasPrev }
    }, [count, perPage, page, pageLinks, hasMore])

    const pagesToDisplay = useMemo(() => {
      const { pagesCount, halfWay } = paginationState
      const pages = Array.from({ length: Math.min(pageLinks, pagesCount) })

      if (page <= halfWay) {
        return pages.map((_, index) => index + 1)
      } else if (pagesCount - page < halfWay) {
        return pages.map((_, index) => pagesCount - index).reverse()
      } else {
        return pages.map((_, index) => page - halfWay + index)
      }
    }, [page, pageLinks, paginationState])

    const navigation = useMemo(
      () => ({
        prev: () => setPage(page - 1),
        next: () => setPage(page + 1),
        first: () => setPage(1),
        last: () => setPage(paginationState.pagesCount),
      }),
      [setPage, page, paginationState.pagesCount],
    )

    const scope = useMemo(
      (): PaginationScope => ({
        context,
        ...paginationState,
        pagesToDisplay,
        ...navigation,
      }),
      [context, paginationState, pagesToDisplay, navigation],
    )

    if (isInitialLoading) return null

    if (!rows || rows.length === 0) {
      return null
    }

    if (error) {
      return null
    }

    if (typeof children === 'function') {
      return <div className="react-list__pagination">{children(scope)}</div>
    }

    if (children) {
      return <div className="react-list__pagination">{children}</div>
    }

    return (
      <div className="react-list__pagination">
        {renderFirst ? (
          renderFirst(scope)
        ) : (
          <button type="button" disabled={!paginationState.hasPrev} onClick={navigation.first}>
            First
          </button>
        )}

        {renderPrev ? (
          renderPrev(scope)
        ) : (
          <button type="button" disabled={!paginationState.hasPrev} onClick={navigation.prev}>
            Prev
          </button>
        )}

        {renderPages
          ? renderPages(scope)
          : pagesToDisplay.map((pageNum) => {
              const isActive = pageNum === page
              const pageScope: RenderPageArgs = { ...scope, page: pageNum, isActive }

              return renderPage ? (
                <Fragment key={`page-${pageNum}`}>{renderPage(pageScope)}</Fragment>
              ) : isActive ? (
                <span key={`page-${pageNum}`}>{pageNum}</span>
              ) : (
                <button key={`page-${pageNum}`} type="button" onClick={() => setPage(pageNum)}>
                  {pageNum}
                </button>
              )
            })}

        {renderNext ? (
          renderNext(scope)
        ) : (
          <button type="button" disabled={!paginationState.hasNext} onClick={navigation.next}>
            Next
          </button>
        )}

        {renderLast ? (
          renderLast(scope)
        ) : (
          <button type="button" disabled={!paginationState.hasNext} onClick={navigation.last}>
            Last
          </button>
        )}
      </div>
    )
  },
)
