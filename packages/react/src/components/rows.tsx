import { memo, useMemo, type ReactNode } from 'react'
import type { RenderRowArgs, RowsScope } from '../../../../shared'
import { useListContext } from '../context/list-context'
import { getRowId } from '../utils'

type ListRowsProps = {
  children?: (scope: RowsScope) => ReactNode
  row?: (args: RenderRowArgs) => ReactNode
}

function ListRowsInner({ children, row: rowFn }: ListRowsProps) {
  const { listState } = useListContext()
  const { rows = [], loader, error, setSort, sort, pagination, idKey } = listState
  const { initialLoading, isLoading } = loader
  const { page, perPage } = pagination

  const serializedRows = useMemo(
    () =>
      rows.map((row: unknown, index: number) => ({
        ...(row as object),
        _index: (page - 1) * perPage + index + 1,
      })),
    [rows, page, perPage],
  )

  const scope = useMemo(
    (): RowsScope => ({
      rows: serializedRows,
      isLoading,
      setSort,
      sort,
    }),
    [serializedRows, isLoading, setSort, sort],
  )

  if (initialLoading) return null

  if (!rows || rows.length === 0) {
    return null
  }

  if (error) return null

  return (
    <div className="react-list__rows">
      {children && typeof children === 'function'
        ? children(scope)
        : rowFn
          ? serializedRows.map((row, index) => (
              <div key={getRowId(row, idKey) ?? index}>{rowFn({ row, index })}</div>
            ))
          : children
            ? children
            : serializedRows.map((row, index) => (
                <div key={getRowId(row, idKey) ?? index}>
                  <pre>{JSON.stringify(row, null, 2)}</pre>
                </div>
              ))}
    </div>
  )
}

export const ListRows = memo(ListRowsInner) as typeof ListRowsInner
