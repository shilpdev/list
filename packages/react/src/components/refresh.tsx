import { memo, useCallback, useMemo, type ReactNode } from "react";
import type { RefreshScope } from "@shilp.dev/list-types";
import { useListContext } from "../context/list-context";

type ListRefreshProps = {
  children?: (scope: RefreshScope) => ReactNode;
};

export const ListRefresh = memo(({ children }: ListRefreshProps) => {
  const { listState } = useListContext();
  const { loader, refresh } = listState;
  const { isLoading, initialLoading } = loader;

  const handleRefresh = useCallback(() => {
    refresh({ isRefresh: true });
  }, [refresh]);

  const scope = useMemo(
    (): RefreshScope => ({
      isLoading,
      refresh: handleRefresh,
    }),
    [isLoading, handleRefresh]
  );

  if (initialLoading) return null;

  if (children) {
    return children(scope);
  }

  return (
    <div className="react-list-refresh">
      <button onClick={handleRefresh} disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh"}
      </button>
    </div>
  );
});
