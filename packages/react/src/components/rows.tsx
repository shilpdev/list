import { memo, type ReactNode } from 'react'
import type { ListScope, RowScope } from '@shared'
import { getRowId } from '@shared/utils'
import { useListContext } from '../context/list-context'

type ListRowsProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
  row?: (args: RowScope) => ReactNode
}

function ListRowsInner({ children, row: rowFn }: ListRowsProps) {
  const context = useListContext()

  if (context.isInitialLoading || context.error || context.isEmpty) {
    return null
  }

  function getKey(row: unknown): number {
    return (row as { _index: number })._index
  }

  function getRowScope(row: unknown, index: number): RowScope {
    const id = getRowId(row, context.idKey)

    return {
      context,
      row,
      index,
      isSelected: context.selection.includes(id),
      toggleSelection: () => {
        context.toggleRowSelection(id)
      },
    }
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = context.rows.map((row, index) => {
      const rowContent = rowFn ? (
        rowFn(getRowScope(row, index))
      ) : (
        <pre>{JSON.stringify(row, null, 2)}</pre>
      )

      return <div key={getKey(row)}>{rowContent}</div>
    })
  }

  return <div className="shilp-list__rows">{content}</div>
}

export const ListRows = memo(ListRowsInner) as typeof ListRowsInner
