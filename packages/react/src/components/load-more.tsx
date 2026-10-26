import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListLoadMoreProps } from '../types'

export const ListLoadMore = ({ children }: ListLoadMoreProps) => {
  const context = useListContext()

  if (context.isEmpty || context.error) {
    return null
  }

  return (
    <Slot
      className="shilp-list__load-more"
      scope={{ context }}
      children={children}
      fallback={() =>
        context.hasMore ? (
          <button type="button" onClick={context.loadMore}>
            {MESSAGES.loadMore}
          </button>
        ) : (
          <p>{MESSAGES.loadMoreEnd}</p>
        )
      }
    />
  )
}
