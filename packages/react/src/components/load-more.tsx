import { LOAD_MORE_END_MESSAGE, LOAD_MORE_MESSAGE } from '@shared/messages'
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
            {LOAD_MORE_MESSAGE}
          </button>
        ) : (
          <p>{LOAD_MORE_END_MESSAGE}</p>
        )
      }
    />
  )
}
