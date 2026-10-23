import { Fragment, type ReactNode } from 'react'
import type { Column, ColumnScope, ColumnsScope } from '@shared'
import { useListContext } from '../context/list-context'

type ListColumnsProps = {
  /** Replaces the whole list of columns. Gets `{ context, setColumn }`. */
  children?: ReactNode | ((scope: ColumnsScope) => ReactNode)
  /** Renders one column. Gets `{ context, name, label, visibility, ...your keys, setValue }`. */
  column?: (scope: ColumnScope) => ReactNode
}

export const ListColumns = ({ children, column: columnFn }: ListColumnsProps) => {
  const context = useListContext()
  const { columns, setColumn } = context

  function getColumnScope(column: Column): ColumnScope {
    return {
      context,
      ...column,
      setValue: (key: string, value: unknown) => {
        setColumn(column.name, key, value)
      },
    }
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context, setColumn })
  } else if (children) {
    content = children
  } else {
    content = columns.map((column) => {
      if (columnFn) {
        return <Fragment key={column.name}>{columnFn(getColumnScope(column))}</Fragment>
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
    })
  }

  return <div className="shilp-list__columns">{content}</div>
}
