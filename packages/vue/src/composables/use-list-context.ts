import { inject, type InjectionKey } from 'vue'
import type { Context } from '../../../../shared'

export const LIST_CONTEXT_KEY: InjectionKey<Context> = Symbol('vue-list-context')

export function useListContext<T>(): Context<T> {
  const context = inject(LIST_CONTEXT_KEY, undefined)

  if (!context) {
    throw new Error('useListContext must be used within a ShilpList component tree')
  }

  return context as Context<T>
}
