import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import type {
  SearchComponentOptions,
  SearchScope,
} from "@7span/list-types";
import { useListContext } from "../context/list-context";

type ListSearchProps = SearchComponentOptions & {
  children?: (scope: SearchScope) => ReactNode;
};

export const ListSearch = memo(
  ({ children, debounceTime = 500 }: ListSearchProps) => {
    const { listState } = useListContext();
    const { search, setSearch } = listState;
    const [localSearch, setLocalSearch] = useState(search ?? "");
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (search !== localSearch) {
        setLocalSearch(search ?? "");
      }
    }, [search]);

    const handleChange = (value: string) => {
      setLocalSearch(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setSearch(value);
      }, debounceTime);
    };

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    const scope: SearchScope = {
      search: localSearch,
      setSearch: handleChange,
    };

    return (
      <div className="react-list-search">
        {children ? (
          children(scope)
        ) : (
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search..."
          />
        )}
      </div>
    );
  }
);
