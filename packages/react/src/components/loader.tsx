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

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = <p>Loading...</p>
  }

  return <div className="shilp-list__loader">{content}</div>
}
