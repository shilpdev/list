import { createContext, useContext, type ReactNode } from 'react'
import type { Context } from '@shared'
import { CONTEXT_OUTSIDE_LIST_MESSAGE } from '@shared/messages'

const ListContext = createContext<Context<unknown> | null>(null)

export function ListContextProvider<T>({
  value,
  children,
}: {
  value: Context<T>
  children: ReactNode
}) {
  return <ListContext.Provider value={value as Context<unknown>}>{children}</ListContext.Provider>
}

export function useListContext<T>(): Context<T> {
  const context = useContext(ListContext)
  if (!context) {
    throw new Error(CONTEXT_OUTSIDE_LIST_MESSAGE)
  }
  return context as Context<T>
}
