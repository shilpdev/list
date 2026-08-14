import { memo, useMemo, type ReactNode } from "react";
import type { SummaryScope } from "@7span/list-types";
import { useListContext } from "../context/list-context";

type ListSummaryProps = {
  children?: (scope: SummaryScope) => ReactNode;
};

export const ListSummary = memo(({ children }: ListSummaryProps) => {
  const { listState } = useListContext();
  const { data, count, pagination, loader, error } = listState;
  const { page, perPage } = pagination;
  const { initialLoading } = loader;

  const summaryData = useMemo(() => {
    const from = page * perPage - perPage + 1;
    const to = Math.min(page * perPage, count);
    const visibleCount = data?.length || 0;

    return { from, to, visibleCount };
  }, [page, perPage, count, data]);

  const scope = useMemo(
    (): SummaryScope => ({
      ...summaryData,
      count,
    }),
    [summaryData, count]
  );

  if (initialLoading) return null;

  if (!data || data.length === 0) {
    return null;
  }

  if (error) {
    return null;
  }

  return (
    <div className="react-list-summary">
      {children ? (
        children(scope)
      ) : (
        <span>
          Showing <span>{summaryData.visibleCount}</span> items (
          <span>
            {summaryData.from} - {summaryData.to}
          </span>
          ) out of <span>{count}</span>
        </span>
      )}
    </div>
  );
});
