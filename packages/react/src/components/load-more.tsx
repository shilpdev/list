import { type ReactNode } from 'react'
import type { LoadMoreScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoadMoreProps = {
  children?: (scope: LoadMoreScope) => ReactNode
}

export const ListLoadMore = ({ children }: ListLoadMoreProps) => {
  const { listState } = useListContext()
  const { data, count, pagination, setPage, loader, error } = listState
  const { page, perPage } = pagination
  const { isLoading } = loader

  const hasMoreItems = page * perPage < count

  const loadMore = () => {
    if (hasMoreItems && !isLoading) {
      setPage(page + 1)
    }
  }

  const scope: LoadMoreScope = {
    isLoading,
    loadMore,
    hasMoreItems,
  }

  if (!data || data.length === 0) {
    return null
  }

  if (error) {
    return null
  }

  if (typeof children === 'function') {
    return <div className="react-list-load-more">{children(scope)}</div>
  }

  if (children) {
    return <div className="react-list-load-more">{children}</div>
  }

  return (
    <div className="react-list-load-more">
      {hasMoreItems ? (
        <button type="button" onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      ) : (
        <p>— That&apos;s all —</p>
      )}
    </div>
  )
}
