import { type ReactNode } from 'react'
import type { ListScope } from '../../../../shared'
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

  return (
    <div className="react-list__error">
      {typeof children === 'function'
        ? children({ context })
        : children || (
            <div>
              <h3>Error occurred</h3>
              <pre>
                {error.name}: {error.message}
              </pre>
            </div>
          )}
    </div>
  )
}
