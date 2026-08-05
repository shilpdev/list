import { inject, type InjectionKey } from 'vue'

export const LIST_CONTEXT_KEY: InjectionKey<{ listState: unknown }> = Symbol('vue-list-context')

export function useListContext() {
  const context = inject(LIST_CONTEXT_KEY, undefined)

  if (!context) {
    throw new Error('useListContext must be used within a VueList component tree')
  }

  return context
}
