import { INITIAL_LOADING_MESSAGE } from '@shared/messages'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListLoaderInitialProps } from '../types'

export const ListLoaderInitial = ({ children }: ListLoaderInitialProps) => {
  const context = useListContext()

  if (!context.isInitialLoading) {
    return null
  }

  return (
    <Slot
      className="shilp-list__initial-loader"
      scope={{ context }}
      children={children}
      fallback={() => <p>{INITIAL_LOADING_MESSAGE}</p>}
    />
  )
}
