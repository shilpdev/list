import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { ListState } from '../../../../shared'

export interface VueListInstanceContext<T = Record<string, unknown>> {
  listState: ComputedRef<ListState<T>>
}

export const LIST_CONTEXT_KEY: InjectionKey<VueListInstanceContext> = Symbol('vue-list-context')

export function useListContext<T = Record<string, unknown>>(): VueListInstanceContext<T> {
  const context = inject(LIST_CONTEXT_KEY, undefined)

  if (!context) {
    throw new Error('useListContext must be used within a VueList component tree')
  }

  return context as VueListInstanceContext<T>
}
