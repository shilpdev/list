import { type ReactNode } from 'react'
import type { LoadMoreScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoadMoreProps = {
  children?: (scope: LoadMoreScope) => ReactNode
}

export const ListLoadMore = ({ children }: ListLoadMoreProps) => {
  const { listState } = useListContext()
  const { rows, count, pagination, loader, error, loadMore } = listState
  const { page, perPage } = pagination
  const { isLoading } = loader

  const hasMoreRows = page * perPage < count

  const scope: LoadMoreScope = {
    isLoading,
    loadMore,
    hasMoreRows,
  }

  if (!rows || rows.length === 0) {
    return null
  }

  if (error) {
    return null
  }

  return (
    <div className="react-list__load-more">
      {typeof children === 'function' ? (
        children(scope)
      ) : children ? (
        children
      ) : hasMoreRows ? (
        <button type="button" onClick={loadMore}>
          Load More
        </button>
      ) : (
        <p>— That&apos;s all —</p>
      )}
    </div>
  )
}
