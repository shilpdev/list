import type { Filters } from '@shilp.dev/vue-list'

export interface Skill {
  id: string | number
  name: string
  status: string
  date_updated: string
}

export interface SkillFilters extends Filters {
  status?: string
  color?: string
}
