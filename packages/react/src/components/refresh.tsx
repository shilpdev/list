import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListRefreshProps } from '../types'

export const ListRefresh = ({ children }: ListRefreshProps) => {
  const context = useListContext()

  if (context.isInitialLoading) {
    return null
  }

  return (
    <Slot
      className="shilp-list__refresh"
      scope={{ context }}
      children={children}
      fallback={() => (
        <button type="button" onClick={() => context.refresh()} disabled={context.isLoading}>
          {context.isLoading ? MESSAGES.loading : MESSAGES.refresh}
        </button>
      )}
    />
  )
}
