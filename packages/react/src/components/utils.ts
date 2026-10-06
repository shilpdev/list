import type { Filters } from '../../../../shared'
import { deepEqual } from '../utils'

export const hasActiveFilters = (currentFilters: Filters, initialFilters: Filters): boolean => {
  if (!initialFilters || Object.keys(initialFilters).length === 0) {
    return currentFilters && Object.keys(currentFilters).length > 0
  }

  if (!currentFilters || Object.keys(currentFilters).length === 0) {
    return false
  }

  return !deepEqual(currentFilters, initialFilters)
}
