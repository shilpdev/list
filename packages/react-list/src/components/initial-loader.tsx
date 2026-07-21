import { memo, useMemo, type ReactNode } from "react";
import type { InitialLoaderScope } from "@7span/list-types";
import { useListContext } from "../context/list-provider";

type ReactListInitialLoaderProps = {
  children?: ReactNode | ((scope: InitialLoaderScope) => ReactNode);
};

export const ReactListInitialLoader = memo(
  ({ children }: ReactListInitialLoaderProps) => {
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
