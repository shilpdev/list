import { useEffect, useRef, useState } from 'react'
import type { SearchScope } from '@shared'
import { DEFAULT_DEBOUNCE_TIME } from '@shared/constants'
import { SEARCH_PLACEHOLDER_MESSAGE } from '@shared/messages'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListSearchProps } from '../types'

export const ListSearch = ({ children, debounceTime = DEFAULT_DEBOUNCE_TIME }: ListSearchProps) => {
  const context = useListContext()
  const { search, setSearch } = context
  const [localSearch, setLocalSearch] = useState(search ?? '')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (search !== localSearch) {
      setLocalSearch(search ?? '')
    }
  }, [search])

  const handleInput = (value: string) => {
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
    setSearch: handleInput,
  }

  return (
    <Slot
      className="shilp-list__search"
      scope={scope}
      children={children}
      fallback={() => (
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER_MESSAGE}
        />
      )}
    />
  )
}
