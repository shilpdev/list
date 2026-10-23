import { type ReactNode } from 'react'
import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListEmptyProps = {
  children?: ReactNode
}

export const ListEmpty = ({ children }: ListEmptyProps) => {
  const { rows, error, isLoading, isInitialLoading } = useListContext()

  if (rows?.length > 0 || isInitialLoading || isLoading || error) {
    return null
  }

  return <div className="shilp-list__empty">{children || <p>{MESSAGES.empty}</p>}</div>
}
