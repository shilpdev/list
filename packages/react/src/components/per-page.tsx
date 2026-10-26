import { memo, useMemo } from 'react'
import type { PerPageScope } from '@shared'
import { normalizePerPageOptions } from '@shared/utils'
import { getPerPageMessage } from '@shared/constants'
import { DEFAULT_PER_PAGE_OPTIONS } from '@shared/constants'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListPerPageProps } from '../types'

export const ListPerPage = memo(
  ({ children, options = DEFAULT_PER_PAGE_OPTIONS }: ListPerPageProps) => {
    const context = useListContext()
    const { rows, error, perPage, setPerPage, isInitialLoading, isEmpty } = context

    const serializedOptions = useMemo(() => {
      return normalizePerPageOptions(options)
    }, [options])

    const scope = useMemo((): PerPageScope => {
      return { context, options: serializedOptions }
    }, [context, serializedOptions])

    if (isInitialLoading || isEmpty || error) {
      return null
    }

    return (
      <Slot
        className="shilp-list__per-page"
        scope={scope}
        children={children}
        fallback={(scope) => (
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
            {scope.options.map((option) => {
              return (
                <option key={`option-${option.value}`} value={option.value}>
                  {getPerPageMessage(option)}
                </option>
              )
            })}
          </select>
        )}
      />
    )
  },
)
