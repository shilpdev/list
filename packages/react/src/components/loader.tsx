import { type ReactNode } from 'react'
import type { LoaderScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoaderProps = {
  children?: ReactNode | ((scope: LoaderScope) => ReactNode)
}

export const ListLoader = ({ children }: ListLoaderProps) => {
  const { listState } = useListContext()
  const { loader } = listState
  const { isLoading, initialLoading } = loader

  const scope: LoaderScope = {
    isLoading,
  }

  if (initialLoading || !isLoading) {
    return null
  }

  return (
    <div className="react-list__loader">
      {typeof children === 'function'
        ? children(scope)
        : children || (
            <div>
              <p>Loading...</p>
            </div>
          )}
    </div>
  )
}
