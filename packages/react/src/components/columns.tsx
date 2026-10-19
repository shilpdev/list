import { Fragment, type ReactNode } from 'react'
import type { ListScope, ColumnScope } from '@shared'
import { useListContext } from '../context/list-context'

type ListColumnsProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
  column?: (args: ColumnScope) => ReactNode
}

export const ListColumns = ({ children, column: columnFn }: ListColumnsProps) => {
  const context = useListContext()
  const { columns, columnSettings, updateColumn } = context

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = columns.map((column, index) => {
      if (columnFn) {
        return <Fragment key={`column-${index}`}>{columnFn({ column, context })}</Fragment>
      }

      return (
        <label key={`column-${index}`}>
          <span>{column.label}</span>
          <input
            type="checkbox"
            checked={columnSettings[column.name]?.visible ?? true}
            onChange={(e) => updateColumn(column.name, 'visible', e.target.checked)}
          />
        </label>
      )
    })
  }

  return <div className="shilp-list__columns">{content}</div>
}
