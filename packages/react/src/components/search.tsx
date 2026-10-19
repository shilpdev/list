import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SearchProps, SearchScope } from '@shared'
import { DEFAULT_DEBOUNCE_TIME } from '@shared/constants'
import { useListContext } from '../context/list-context'

type ListSearchProps = SearchProps & {
  children?: ReactNode | ((scope: SearchScope) => ReactNode)
}

export const ListSearch = memo(
  ({ children, debounceTime = DEFAULT_DEBOUNCE_TIME }: ListSearchProps) => {
    const context = useListContext()
    const { search, setSearch } = context
    const [localSearch, setLocalSearch] = useState(search ?? '')
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      if (search !== localSearch) {
        setLocalSearch(search ?? '')
      }
    }, [search])

    const handleChange = (value: string) => {
      setLocalSearch(value)

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        setSearch(value)
      }, debounceTime)
    }

    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }, [])

    const scope: SearchScope = {
      context,
      search: localSearch,
      setSearch: handleChange,
    }

    let content: ReactNode

    if (typeof children === 'function') {
      content = children(scope)
    } else if (children) {
      content = children
    } else {
      content = (
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search..."
        />
      )
    }

    return <div className="shilp-list__search">{content}</div>
  },
)
