import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoaderProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListLoader = ({ children }: ListLoaderProps) => {
  const context = useListContext()

  if (context.isInitialLoading || !context.isLoading) {
    return null
  }

  return (
    <div className="react-list__loader">
      {typeof children === 'function' ? children({ context }) : children || <p>Loading...</p>}
    </div>
  )
}
