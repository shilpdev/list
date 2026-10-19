import { memo, type ReactNode } from 'react'
import type { ListScope, RowScope } from '@shared'
import { useListContext } from '../context/list-context'

type ListRowsProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
  row?: (args: RowScope) => ReactNode
}

function ListRowsInner({ children, row: rowFn }: ListRowsProps) {
  const context = useListContext()
  const { rows, error, isInitialLoading } = context

  if (isInitialLoading || rows.length === 0 || error) {
    return null
  }

  let content: ReactNode

  if (typeof children === 'function') {
    content = children({ context })
  } else if (children) {
    content = children
  } else {
    content = rows.map((row, index) => {
      let rowContent: ReactNode

      if (rowFn) {
        rowContent = rowFn({ row, index })
      } else {
        rowContent = <pre>{JSON.stringify(row, null, 2)}</pre>
      }

      return <div key={(row as { _index: number })._index}>{rowContent}</div>
    })
  }

  return <div className="shilp-list__rows">{content}</div>
}

export const ListRows = memo(ListRowsInner) as typeof ListRowsInner
