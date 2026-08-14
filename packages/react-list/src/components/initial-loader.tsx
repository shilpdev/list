import { memo, useMemo, type ReactNode } from "react";
import type { InitialLoaderScope } from "@7span/list-types";
import { useListContext } from "../context/list-context";

type ListInitialLoaderProps = {
  children?: ReactNode | ((scope: InitialLoaderScope) => ReactNode);
};

export const ListInitialLoader = memo(
  ({ children }: ListInitialLoaderProps) => {
    const { listState } = useListContext();
    const { loader } = listState;
    const { initialLoading } = loader;

    const scope = useMemo(
      (): InitialLoaderScope => ({
        loading: initialLoading,
      }),
      [initialLoading]
    );

    if (!initialLoading) {
      return null;
    }

    return (
      <div className="react-list-initial-loader">
        {typeof children === "function"
          ? children(scope)
          : children || <p>Initial Loading...</p>}
      </div>
    );
  }
);
