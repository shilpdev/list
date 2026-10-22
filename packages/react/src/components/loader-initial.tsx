import { type ReactNode } from 'react'
import type { ListScope } from '@shared'
import { MESSAGES } from '@shared/constants'
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
    content = <p>{MESSAGES.initialLoading}</p>
  }

  return <div className="shilp-list__initial-loader">{content}</div>
}
