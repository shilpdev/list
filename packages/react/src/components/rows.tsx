import type { ReactNode } from 'react'
import { getKey, getRowScope } from '@shared/utils'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListRowsProps } from '../types'

export function ListRows({ children, row: rowFn }: ListRowsProps) {
  const context = useListContext()
  const { isInitialLoading, error, isEmpty, rows } = context

  function renderRow(row: unknown, index: number): ReactNode {
    const rowContent = rowFn ? (
      rowFn(getRowScope(row, index, context))
    ) : (
      <pre>{JSON.stringify(row, null, 2)}</pre>
    )

    return <div key={getKey(row)}>{rowContent}</div>
  }

  if (isInitialLoading || error || isEmpty) {
    return null
  }

  return (
    <Slot
      className="shilp-list__rows"
      scope={{ context }}
      children={children}
      fallback={() => rows.map(renderRow)}
    />
  )
}
