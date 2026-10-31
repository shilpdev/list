import { inject } from 'vue'
import type { Context } from '@shared'
import { CONTEXT_OUTSIDE_LIST_MESSAGE } from '@shared/messages'

export function useListContext<T>(): Context<T> {
  const context = inject<Context | undefined>('shilp-list-context', undefined)

  if (!context) {
    throw new Error(CONTEXT_OUTSIDE_LIST_MESSAGE)
  }

  return context as Context<T>
}
