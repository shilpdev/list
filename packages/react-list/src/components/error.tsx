import { memo, type ReactNode } from "react";
import type { ErrorScope } from "@7span/list-types";
import { useListContext } from "../context/list-context";

type ListErrorProps = {
  children?: ReactNode | ((scope: ErrorScope) => ReactNode);
};

export const ListError = memo(({ children }: ListErrorProps) => {
  const { listState } = useListContext();
  const { error, loader } = listState;
  const { isLoading } = loader;

  if (!error || isLoading) {
    return null;
  }

  return (
    <div className="react-list-error">
      {typeof children === "function"
        ? children({ error })
        : children || (
            <div>
              <h3>Error occurred</h3>
              <pre>
                {error.name}: {error.message}
              </pre>
            </div>
          )}
    </div>
  );
});
