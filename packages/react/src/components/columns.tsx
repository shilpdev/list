import { Fragment, type ReactNode } from 'react'
import type { Column, ColumnScope } from '@shared'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListColumnsProps } from '../types'
import { getColumnScope } from '@shared/utils'

export const ListColumns = ({ children, column: columnFn }: ListColumnsProps) => {
  const context = useListContext()
  const { columns, setColumn } = context

  function renderColumn(column: Column): ReactNode {
    if (columnFn) {
      return <Fragment key={column.name}>{columnFn(getColumnScope(column, context))}</Fragment>
    }

    return (
      <label key={column.name}>
        <span>{column.label ?? column.name}</span>
        <input
          type="checkbox"
          checked={column.visibility}
          onChange={(e) => setColumn(column.name, 'visibility', e.target.checked)}
        />
      </label>
    )
  }

  return (
    <Slot
      className="shilp-list__columns"
      scope={{ context, setColumn }}
      children={children}
      fallback={() => columns.map(renderColumn)}
    />
  )
}
