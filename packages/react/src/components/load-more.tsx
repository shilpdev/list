import { type ReactNode } from 'react'
import type { ListScope } from '@shared'
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListLoadMoreProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListLoadMore = ({ children }: ListLoadMoreProps) => {
  const context = useListContext()

  if (context.isEmpty || context.error) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else if (context.hasMore) {
    content = (
      <button type="button" onClick={context.loadMore}>
        {MESSAGES.loadMore}
      </button>
    )
  } else {
    content = <p>{MESSAGES.loadMoreEnd}</p>
  }

  return <div className="shilp-list__load-more">{content}</div>
}
