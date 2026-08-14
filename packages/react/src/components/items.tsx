import { memo, useMemo, type ReactNode } from "react";
import type {
  ItemsScope,
  RenderItemArgs,
} from "@shilp.dev/list-types";
import { useListContext } from "../context/list-context";

type ListItemsProps<T = unknown> = {
  children?: (scope: ItemsScope<T>) => ReactNode;
  renderItem?: (args: RenderItemArgs<T>) => ReactNode;
};

function ListItemsInner<T = unknown>({
  children,
  renderItem,
}: ListItemsProps<T>) {
  const { listState } = useListContext<T>();
  const {
    data: items = [],
    loader,
    error,
    setSort,
    sort,
    pagination,
  } = listState;
  const { initialLoading, isLoading } = loader;
  const { page, perPage } = pagination;

  const serializedItems = useMemo(
    () =>
      items.map((item, index) => ({
        ...item,
        _index: (page - 1) * perPage + index + 1,
      })),
    [items, page, perPage]
  );

  const scope = useMemo(
    (): ItemsScope<T> => ({
      items: serializedItems,
      isLoading,
      setSort,
      sort,
    }),
    [serializedItems, isLoading, setSort, sort]
  );

  if (initialLoading) return null;

  if (!items || items.length === 0) {
    return null;
  }

  if (error) {
    return null;
  }

  if (renderItem) {
    return (
      <div className="react-list-items">
        {items.map((item, index) => {
          const record = item as T & { id?: string | number };
          return (
            <div key={record.id ?? index}>
              {renderItem({ item, index })}
            </div>
          );
        })}
      </div>
    );
  }

  if (typeof children === "function") {
    return <div className="react-list-items">{children(scope)}</div>;
  }

  return (
    <div className="react-list-items">
      {items.map((item, index) => {
        const record = item as T & { id?: string | number };
        return (
          <pre key={record.id ?? index}>{JSON.stringify(item, null, 2)}</pre>
        );
      })}
    </div>
  );
}

export const ListItems = memo(
  ListItemsInner
) as typeof ListItemsInner;
