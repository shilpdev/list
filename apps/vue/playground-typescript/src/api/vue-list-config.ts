import type { ListProviderConfig, SavedListState, StateManagerContext } from '@7span/list-types'
import type { Skill } from '@/types/skill'
import requestHandler from './request-handler'

function stateManagerKey(endpoint: string, version?: number | string): string {
  return `vue-list--${endpoint}--${version}`
}

const vueListConfig: ListProviderConfig<Skill> = {
  stateManager: {
    init(context: StateManagerContext) {
      const { endpoint, version } = context
      const allKeys = `vue-list--${endpoint}--`
      const latestKey = stateManagerKey(endpoint, version)
      const staleKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith(allKeys) && key !== latestKey,
      )
      staleKeys.forEach((key) => localStorage.removeItem(key))
    },

    set(context: StateManagerContext) {
      const { endpoint, version, search, page, perPage, sortBy, sortOrder, filters, attrSettings } = context
      const key = stateManagerKey(endpoint, version)
      localStorage.setItem(
        key,
        JSON.stringify({
          search,
          page,
          perPage,
          sortBy,
          sortOrder,
          filters,
          attrSettings,
        }),
      )
    },

    get(context: StateManagerContext): SavedListState | null {
      const { endpoint, version } = context
      const key = stateManagerKey(endpoint, version)

      try {
        const saved = localStorage.getItem(key)
        return saved ? (JSON.parse(saved) as SavedListState) : null
      } catch {
        return null
      }
    },
  },

  requestHandler,
}

export default vueListConfig
