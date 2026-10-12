import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { ListInstanceContext, ListState } from '../../../../shared'

interface ProvidedListContext<T = unknown> {
  listState: ComputedRef<ListState<T>>
}

export const LIST_CONTEXT_KEY: InjectionKey<ProvidedListContext> = Symbol('vue-list-context')

export function useListContext<T>(): ListInstanceContext<T> {
  const context = inject(LIST_CONTEXT_KEY, undefined)

  if (!context) {
    throw new Error('useListContext must be used within a VueList component tree')
  }

  const listState = new Proxy({} as ListState<T>, {
    get(_target, key) {
      return context.listState.value[key as keyof ListState<T>]
    },
  }) as ListState<T>

  return { listState }
}
