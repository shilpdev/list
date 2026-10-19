import { memo, useCallback, useMemo, type ReactNode } from 'react'
import type { PerPageProps, PerPageScope } from '@shared'
import { getPerPageMessage, normalizePerPageOptions } from '@shared/utils'
import { DEFAULT_PER_PAGE_OPTIONS } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListPerPageProps = PerPageProps & {
  children?: ReactNode | ((scope: PerPageScope) => ReactNode)
}

export const ListPerPage = memo(
  ({ children, options = DEFAULT_PER_PAGE_OPTIONS }: ListPerPageProps) => {
    const context = useListContext()
    const { rows, setPerPage, error, perPage, isInitialLoading } = context

    const serializedOptions = useMemo(() => {
      return normalizePerPageOptions(options)
    }, [options])

    const handlePerPageChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPerPage(Number(e.target.value))
      },
      [setPerPage],
    )

    const scope = useMemo((): PerPageScope => {
      return { context, options: serializedOptions }
    }, [context, serializedOptions])

    if (isInitialLoading || rows.length === 0 || error) {
      return null
    }

    let content: ReactNode

    if (typeof children === 'function') {
      content = children(scope)
    } else if (children) {
      content = children
    } else {
      content = (
        <select value={perPage} onChange={handlePerPageChange}>
          {serializedOptions.map((option) => {
            return (
              <option key={`option-${option.value}`} value={option.value}>
                {getPerPageMessage(option)}
              </option>
            )
          })}
        </select>
      )
    }

    return <div className="shilp-list__per-page">{content}</div>
  },
)
