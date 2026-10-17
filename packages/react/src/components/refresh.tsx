import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListRefreshProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListRefresh = ({ children }: ListRefreshProps) => {
  const context = useListContext()

  if (context.isInitialLoading) return null

  return (
    <div className="react-list__refresh">
      {typeof children === 'function'
        ? children({ context })
        : children || (
            <button type="button" onClick={() => context.refresh()} disabled={context.isLoading}>
              {context.isLoading ? 'Loading...' : 'Refresh'}
            </button>
          )}
    </div>
  )
}
