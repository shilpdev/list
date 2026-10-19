import { type ReactNode } from 'react'
import type { ListScope } from '@shared'
import { useListContext } from '../context/list-context'

type ListErrorProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export const ListError = ({ children }: ListErrorProps) => {
  const context = useListContext()
  const { error } = context

  if (!error || context.isLoading) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = (
      <div>
        <h3>Error occurred</h3>
        <pre>
          {error.name}: {error.message}
        </pre>
      </div>
    )
  }

  return <div className="shilp-list__error">{content}</div>
}
