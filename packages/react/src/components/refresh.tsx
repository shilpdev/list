import { type ReactNode } from 'react'
import type { RefreshScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListRefreshProps = {
  children?: (scope: RefreshScope) => ReactNode
}

export const ListRefresh = ({ children }: ListRefreshProps) => {
  const { listState } = useListContext()
  const { loader, refresh } = listState
  const { isLoading, initialLoading } = loader

  const handleRefresh = () => {
    refresh({ isRefresh: true })
  }

  const scope: RefreshScope = {
    isLoading,
    refresh: handleRefresh,
  }

  if (initialLoading) return null

  if (children) {
    return children(scope)
  }

  return (
    <div className="react-list-refresh">
      <button onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  )
}
