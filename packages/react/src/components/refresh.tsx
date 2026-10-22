import { type ReactNode } from 'react'
import type { ListScope } from '@shared'
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListRefreshProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListRefresh = ({ children }: ListRefreshProps) => {
  const context = useListContext()

  if (context.isInitialLoading) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = (
      <button type="button" onClick={() => context.refresh()} disabled={context.isLoading}>
        {context.isLoading ? MESSAGES.loading : MESSAGES.refresh}
      </button>
    )
  }

  return <div className="shilp-list__refresh">{content}</div>
}
