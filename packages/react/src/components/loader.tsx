import { memo, useMemo, type ReactNode } from "react";
import type {
  LoaderComponentOptions,
  LoaderScope,
} from "@shilp.dev/list-types";
import { useListContext } from "../context/list-context";

type ListLoaderProps = LoaderComponentOptions & {
  children?: ReactNode | ((scope: LoaderScope) => ReactNode);
};

export const ListLoader = memo(
  ({ children, position = "overlay" }: ListLoaderProps) => {
    const { listState } = useListContext();
    const { loader } = listState;
    const { isLoading, initialLoading } = loader;

    const scope = useMemo(
      (): LoaderScope => ({
        isLoading,
      }),
      [isLoading]
    );

    if (!initialLoading && !isLoading) {
      return null;
    }

    return (
      <div className={`react-list-loader react-list-loader--${position}`}>
        {typeof children === "function"
          ? children(scope)
          : children || (
              <div>
                <p>Loading...</p>
              </div>
            )}
      </div>
    );
  }
);
