import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoadMoreProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListLoadMore = ({ children }: ListLoadMoreProps) => {
  const context = useListContext()

  if (context.isEmpty || context.error) {
    return null
  }

  return (
    <div className="react-list__load-more">
      {typeof children === 'function' ? (
        children({ context })
      ) : children ? (
        children
      ) : context.hasMore ? (
        <button type="button" onClick={context.loadMore}>
          Load More
        </button>
      ) : (
        <p>— That&apos;s all —</p>
      )}
    </div>
  )
}
