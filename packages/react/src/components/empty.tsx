import { type ReactNode } from 'react'
import { useListContext } from '../context/list-context'

type ListEmptyProps = {
  children?: ReactNode
}

export const ListEmpty = ({ children }: ListEmptyProps) => {
  const { listState } = useListContext()
  const { rows, loader, error } = listState
  const { isLoading, initialLoading } = loader

  if (rows?.length > 0 || initialLoading || isLoading || error) {
    return null
  }

  return (
    <div className="react-list__empty">
      {children || (
        <div>
          <p>No data found!</p>
        </div>
      )}
    </div>
  )
}
