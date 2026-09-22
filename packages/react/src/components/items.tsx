import { memo, useMemo, type ReactNode } from 'react'
import type { ItemsScope, RenderItemArgs } from '../../../../shared'
import { useListContext } from '../context/list-context'
import { getItemId } from '../utils'

type ListItemsProps<T> = {
  children?: (scope: ItemsScope<T>) => ReactNode
  renderItem?: (args: RenderItemArgs<T>) => ReactNode
}

function ListItemsInner<T>({ children, renderItem }: ListItemsProps<T>) {
  const { listState } = useListContext<T>()
  const { data: items = [], loader, error, setSort, sort, pagination, idKey } = listState
  const { initialLoading, isLoading } = loader
  const { page, perPage } = pagination

  const serializedItems = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        _index: (page - 1) * perPage + index + 1,
      })),
    [items, page, perPage],
  )

  const scope = useMemo(
    (): ItemsScope<T> => ({
      items: serializedItems,
      isLoading,
      setSort,
      sort,
    }),
    [serializedItems, isLoading, setSort, sort],
  )

  if (initialLoading) return null

  if (!items || items.length === 0) {
    return null
  }

  if (error) {
    return null
  }

  if (renderItem) {
    return (
      <div className="react-list-items">
        {items.map((item, index) => (
          <div key={getItemId(item, idKey) ?? index}>{renderItem({ item, index })}</div>
        ))}
      </div>
    )
  }

  if (typeof children === 'function') {
    return <div className="react-list-items">{children(scope)}</div>
  }

  return (
    <div className="react-list-items">
      {items.map((item, index) => (
        <pre key={getItemId(item, idKey) ?? index}>{JSON.stringify(item, null, 2)}</pre>
      ))}
    </div>
  )
}

export const ListItems = memo(ListItemsInner) as typeof ListItemsInner
