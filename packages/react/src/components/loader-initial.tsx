import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListInitialLoaderProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListInitialLoader = ({ children }: ListInitialLoaderProps) => {
  const context = useListContext()

  if (!context.isInitialLoading) {
    return null
  }

  return (
    <div className="react-list__initial-loader">
      {typeof children === 'function'
        ? children({ context })
        : children || <p>Initial Loading...</p>}
    </div>
  )
}
