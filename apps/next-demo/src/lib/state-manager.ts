import type { State, StateManager } from '@shilp.dev/react-list'

/*
 * Keeps the list state in localStorage, one entry per list (`endpoint` and `version`). The list
 * calls `get` on mount to restore it, `set` after every response and `clear` from `clearState`.
 */
const KEYS = ['page', 'perPage', 'filters', 'sortOrder', 'sortBy', 'search', 'columns'] as const

// `clearState` makes the list fetch again, and that response would save the state right back.
// Nothing is saved after a clear until the page reloads.
let isCleared = false

function getKey(state: State) {
  return `shilp-list--${state.endpoint}--${state.version}`
}

export const stateManager: StateManager = {
  get(state) {
    if (typeof localStorage === 'undefined') {
      return null
    }

    const saved = localStorage.getItem(getKey(state))
    if (!saved) {
      return null
    }

    return JSON.parse(saved)
  },

  set(state) {
    if (isCleared) {
      return
    }

    const saved: Record<string, unknown> = {}
    KEYS.forEach((key) => {
      saved[key] = state[key]
    })

    localStorage.setItem(getKey(state), JSON.stringify(saved))
  },

  clear(state) {
    isCleared = true
    localStorage.removeItem(getKey(state))
  },
}
