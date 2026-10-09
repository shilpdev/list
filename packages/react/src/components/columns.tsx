import { memo, useCallback, useMemo, type ReactNode } from 'react'
import type { ColumnsScope, ListColumn, RenderColumnArgs } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListColumnsProps = {
  children?: ReactNode | ((scope: ColumnsScope) => ReactNode)
  column?: (args: RenderColumnArgs) => ReactNode
}

export const ListColumns = memo(({ children, column: columnFn }: ListColumnsProps) => {
  const { listState } = useListContext()
  const { columns, columnSettings, updateColumn } = listState

  const normalizedColumns = columns as ListColumn[]

  const handleColumnChange = useCallback(
    (columnName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateColumn?.(columnName, 'visible', e.target.checked)
    },
    [updateColumn],
  )

  const scope = useMemo(
    (): ColumnsScope => ({
      columns: normalizedColumns,
      columnSettings: columnSettings ?? {},
      updateColumn: updateColumn ?? (() => {}),
    }),
    [normalizedColumns, columnSettings, updateColumn],
  )

  return (
    <div className="react-list__columns">
      {typeof children === 'function'
        ? children(scope)
        : children
          ? children
          : normalizedColumns.map((column, index) => {
              if (columnFn) {
                return columnFn({
                  key: `column-${index}`,
                  column,
                  updateColumn: updateColumn ?? (() => {}),
                  columnSettings: columnSettings ?? {},
                })
              }

              return (
                <label key={`column-${index}`}>
                  <span>{column.label}</span>
                  <input
                    type="checkbox"
                    checked={columnSettings?.[column.name]?.visible ?? true}
                    onChange={handleColumnChange(column.name)}
                  />
                </label>
              )
            })}
    </div>
  )
})
