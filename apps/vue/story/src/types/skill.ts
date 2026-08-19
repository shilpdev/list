import type { Filters } from '@shilp.dev/list-types'

export interface Skill {
  id: string | number
  name: string
  status: string
  date_updated: string | null
  color?: string | null
}

export interface SkillFilters extends Filters {
  status?: string
  color?: string
}

export function formatSkillDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
