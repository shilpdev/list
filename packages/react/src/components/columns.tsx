import { Fragment, type ReactNode } from 'react'
import type { ListScope, RenderColumnArgs } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListColumnsProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
  column?: (args: RenderColumnArgs) => ReactNode
}

export const ListColumns = ({ children, column: columnFn }: ListColumnsProps) => {
  const context = useListContext()
  const { columns, columnSettings, updateColumn } = context

  return (
    <div className="react-list__columns">
      {typeof children === 'function'
        ? children({ context })
        : children
          ? children
          : columns.map((column, index) =>
              columnFn ? (
                <Fragment key={`column-${index}`}>{columnFn({ column, context })}</Fragment>
              ) : (
                <label key={`column-${index}`}>
                  <span>{column.label}</span>
                  <input
                    type="checkbox"
                    checked={columnSettings[column.name]?.visible ?? true}
                    onChange={(e) => updateColumn(column.name, 'visible', e.target.checked)}
                  />
                </label>
              ),
            )}
    </div>
  )
}
