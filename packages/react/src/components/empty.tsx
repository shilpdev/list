import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListEmptyProps } from '../types'

export const ListEmpty = ({ children }: ListEmptyProps) => {
  const { error, isLoading, isInitialLoading, isEmpty } = useListContext()

  if (!isEmpty || isInitialLoading || isLoading || error) {
    return null
  }

  return (
    <Slot
      className="shilp-list__empty"
      scope={null}
      children={children}
      fallback={() => <p>{MESSAGES.empty}</p>}
    />
  )
}
