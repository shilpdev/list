import { Fragment, memo, useMemo, type ReactNode } from 'react'
import type { PaginationProps, PaginationScope, PaginationItemScope } from '@shared'
import { getPagination } from '@shared/utils'
import { DEFAULT_PAGE_LINKS } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListPaginationProps = PaginationProps & {
  children?: ReactNode | ((scope: PaginationScope) => ReactNode)
  renderFirst?: (scope: PaginationScope) => ReactNode
  renderPrev?: (scope: PaginationScope) => ReactNode
  renderPages?: (scope: PaginationScope) => ReactNode
  renderPage?: (scope: PaginationItemScope) => ReactNode
  renderNext?: (scope: PaginationScope) => ReactNode
  renderLast?: (scope: PaginationScope) => ReactNode
}

export const ListPagination = memo(
  ({
    children,
    pageLinks = DEFAULT_PAGE_LINKS,
    renderFirst,
    renderPrev,
    renderPages,
    renderPage,
    renderNext,
    renderLast,
  }: ListPaginationProps) => {
    const context = useListContext()
    const { rows, count, setPage, error, page, perPage, isInitialLoading, hasMore } = context

    const pagination = useMemo(() => {
      return { ...getPagination(page, perPage, count, pageLinks), hasNext: hasMore }
    }, [page, perPage, count, pageLinks, hasMore])
    const { pagesToDisplay } = pagination

    const navigation = useMemo(() => {
      return {
        prev: () => setPage(page - 1),
        next: () => setPage(page + 1),
        first: () => setPage(1),
        last: () => setPage(pagination.pagesCount),
      }
    }, [setPage, page, pagination.pagesCount])

    const scope = useMemo((): PaginationScope => {
      return { context, ...pagination, ...navigation }
    }, [context, pagination, navigation])

    if (isInitialLoading || rows.length === 0 || error) {
      return null
    }

    if (typeof children === 'function') {
      return <div className="shilp-list__pagination">{children(scope)}</div>
    }

    if (children) {
      return <div className="shilp-list__pagination">{children}</div>
    }

    let first: ReactNode
    if (renderFirst) {
      first = renderFirst(scope)
    } else {
      first = (
        <button type="button" disabled={!pagination.hasPrev} onClick={navigation.first}>
          First
        </button>
      )
    }

    let prev: ReactNode
    if (renderPrev) {
      prev = renderPrev(scope)
    } else {
      prev = (
        <button type="button" disabled={!pagination.hasPrev} onClick={navigation.prev}>
          Prev
        </button>
      )
    }

    let pages: ReactNode
    if (renderPages) {
      pages = renderPages(scope)
    } else {
      pages = pagesToDisplay.map((pageNum) => {
        const isActive = pageNum === page

        if (renderPage) {
          const pageScope: PaginationItemScope = { ...scope, page: pageNum, isActive }
          return <Fragment key={`page-${pageNum}`}>{renderPage(pageScope)}</Fragment>
        }

        if (isActive) {
          return <span key={`page-${pageNum}`}>{pageNum}</span>
        }

        return (
          <button key={`page-${pageNum}`} type="button" onClick={() => setPage(pageNum)}>
            {pageNum}
          </button>
        )
      })
    }

    let next: ReactNode
    if (renderNext) {
      next = renderNext(scope)
    } else {
      next = (
        <button type="button" disabled={!pagination.hasNext} onClick={navigation.next}>
          Next
        </button>
      )
    }

    let last: ReactNode
    if (renderLast) {
      last = renderLast(scope)
    } else {
      last = (
        <button type="button" disabled={!pagination.hasNext} onClick={navigation.last}>
          Last
        </button>
      )
    }

    return (
      <div className="shilp-list__pagination">
        {first}
        {prev}
        {pages}
        {next}
        {last}
      </div>
    )
  },
)
