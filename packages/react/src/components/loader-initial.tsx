import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListLoaderInitialProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListLoaderInitial = ({ children }: ListLoaderInitialProps) => {
  const context = useListContext()

  if (!context.isInitialLoading) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = <p>Initial Loading...</p>
  }

  return <div className="shilp-list__initial-loader">{content}</div>
}
