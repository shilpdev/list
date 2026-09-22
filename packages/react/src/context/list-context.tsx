import { createContext, useContext, type ReactNode } from 'react'
import type { ListInstanceContext } from '../../../../shared'

const ListContext = createContext<ListInstanceContext<Record<string, unknown>> | null>(null)

export function ListContextProvider<T = Record<string, unknown>>({
  value,
  children,
}: {
  value: ListInstanceContext<T>
  children: ReactNode
}) {
  return (
    <ListContext.Provider value={value as ListInstanceContext<Record<string, unknown>>}>
      {children}
    </ListContext.Provider>
  )
}

export function useListContext<T = Record<string, unknown>>(): ListInstanceContext<T> {
  const context = useContext(ListContext)
  if (!context) {
    throw new Error('useListContext must be used within a ReactList')
  }
  return context as ListInstanceContext<T>
}
