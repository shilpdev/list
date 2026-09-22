import { type ReactNode } from 'react'
import type { InitialLoaderScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListInitialLoaderProps = {
  children?: ReactNode | ((scope: InitialLoaderScope) => ReactNode)
}

export const ListInitialLoader = ({ children }: ListInitialLoaderProps) => {
  const { listState } = useListContext()
  const { loader } = listState
  const { initialLoading } = loader

  const scope: InitialLoaderScope = {
    loading: initialLoading,
  }

  if (!initialLoading) {
    return null
  }

  return (
    <div className="react-list-initial-loader">
      {typeof children === 'function' ? children(scope) : children || <p>Initial Loading...</p>}
    </div>
  )
}
