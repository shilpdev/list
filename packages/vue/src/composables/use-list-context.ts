import { inject } from 'vue'
import type { Context } from '../../../../shared'

export function useListContext<T>(): Context<T> {
  const context = inject<Context | undefined>('shilp-list-context', undefined)

  if (!context) {
    throw new Error('useListContext must be used within a List component tree')
  }

  return context as Context<T>
}
