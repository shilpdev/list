import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ListInstanceContext } from "@shilp.dev/list-types";

const ListContext = createContext<ListInstanceContext<unknown> | null>(null);

export function ListContextProvider<T = unknown>({
  value,
  children,
}: {
  value: ListInstanceContext<T>;
  children: ReactNode;
}) {
  return (
    <ListContext.Provider value={value as ListInstanceContext<unknown>}>
      {children}
    </ListContext.Provider>
  );
}

export function useListContext<T = unknown>(): ListInstanceContext<T> {
  const context = useContext(ListContext);
  if (!context) {
    throw new Error("useListContext must be used within a ReactList");
  }
  return context as ListInstanceContext<T>;
}
