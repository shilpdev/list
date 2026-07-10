import { memo, useCallback, useMemo, type ReactNode } from "react";
import type { LoadMoreScope } from "@7span/react-list-types";
import { useListContext } from "../context/list-provider";

type ReactListLoadMoreProps = {
  children?: (scope: LoadMoreScope) => ReactNode;
};

export const ReactListLoadMore = memo(({ children }: ReactListLoadMoreProps) => {
  const { listState } = useListContext();
  const { data, count, pagination, setPage, loader, error } = listState;
  const { page, perPage } = pagination;
  const { isLoading } = loader;

  const hasMoreItems = useMemo(
    () => page * perPage < count,
    [page, perPage, count]
  );

  const loadMore = useCallback(() => {
    if (hasMoreItems && !isLoading) {
      setPage(page + 1);
    }
  }, [hasMoreItems, isLoading, setPage, page]);

  const scope = useMemo(
    (): LoadMoreScope => ({
      isLoading,
      loadMore,
      hasMoreItems,
    }),
    [isLoading, loadMore, hasMoreItems]
  );

  if (!data || data.length === 0) {
    return null;
  }

  if (error) {
    return null;
  }

  return children?.(scope) ?? null;
});
