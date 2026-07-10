import { memo, useCallback, useMemo, type ReactNode } from "react";
import type { RefreshScope } from "@7span/react-list-types";
import { useListContext } from "../context/list-provider";

type ReactListRefreshProps = {
  children?: (scope: RefreshScope) => ReactNode;
};

export const ReactListRefresh = memo(({ children }: ReactListRefreshProps) => {
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
