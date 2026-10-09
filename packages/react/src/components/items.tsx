import { memo, useMemo, type ReactNode } from 'react'
import type { ItemsScope, RenderItemArgs } from '../../../../shared'
import { useListContext } from '../context/list-context'
import { getItemId } from '../utils'

type ListItemsProps = {
  children?: (scope: ItemsScope) => ReactNode
  item?: (args: RenderItemArgs) => ReactNode
}

function ListItemsInner({ children, item: itemFn }: ListItemsProps) {
  const { listState } = useListContext()
  const { data: items = [], loader, error, setSort, sort, pagination, idKey } = listState
  const { initialLoading, isLoading } = loader
  const { page, perPage } = pagination

  const serializedItems = useMemo(
    () =>
      items.map((item: unknown, index: number) => ({
        ...(item as object),
        _index: (page - 1) * perPage + index + 1,
      })),
    [items, page, perPage],
  )

  const scope = useMemo(
    (): ItemsScope => ({
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

  if (error) return null

  return (
    <div className="react-list__items">
      {children && typeof children === 'function'
        ? children(scope)
        : itemFn
          ? serializedItems.map((item, index) => (
              <div key={getItemId(item, idKey) ?? index}>{itemFn({ item, index })}</div>
            ))
          : children
            ? children
            : serializedItems.map((item, index) => (
                <div key={getItemId(item, idKey) ?? index}>
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </div>
              ))}
    </div>
  )
}

export const ListItems = memo(ListItemsInner) as typeof ListItemsInner
