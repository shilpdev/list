import { MESSAGES } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListErrorProps } from '../types'

export const ListError = ({ children }: ListErrorProps) => {
  const context = useListContext()
  const { error, isLoading } = context

  if (!error || isLoading) {
    return null
  }

  return (
    <Slot
      className="shilp-list__error"
      scope={{ context }}
      children={children}
      fallback={() => (
        <div>
          <h3>{MESSAGES.error}</h3>
          <pre>
            {error.name}: {error.message}
          </pre>
        </div>
      )}
    />
  )
}
