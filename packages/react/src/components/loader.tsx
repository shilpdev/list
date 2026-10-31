import { LOADING_MESSAGE } from '@shared/messages'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListLoaderProps } from '../types'

export const ListLoader = ({ children }: ListLoaderProps) => {
  const context = useListContext()

  if (context.isInitialLoading || !context.isLoading) {
    return null
  }

  return (
    <Slot
      className="shilp-list__loader"
      scope={{ context }}
      children={children}
      fallback={() => <p>{LOADING_MESSAGE}</p>}
    />
  )
}
