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

  function getColumnScope(item: Column): ColumnScope {
    return {
      context,
      ...item,
      setValue: (key: string, value: unknown) => {
        setColumn(item.name, key, value)
      },
    }
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context, setColumn })
  } else if (children) {
    content = children
  } else {
    content = columns.map((item) => {
      if (columnFn) {
        return <Fragment key={item.name}>{columnFn(getColumnScope(item))}</Fragment>
      }

      return (
        <label key={item.name}>
          <span>{item.label ?? item.name}</span>
          <input
            type="checkbox"
            checked={item.visibility}
            onChange={(e) => setColumn(item.name, 'visibility', e.target.checked)}
          />
        </label>
      )
    })
  }

  return <div className="shilp-list__columns">{content}</div>
}
