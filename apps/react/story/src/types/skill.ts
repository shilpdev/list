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

export const sampleSkills: Skill[] = [
  {
    id: 'sample-1',
    name: 'Sample Skill',
    status: 'draft',
    date_updated: '2024-08-06T04:44:41.000Z',
    color: '#2563eb',
  },
  {
    id: 'sample-2',
    name: 'Another Skill',
    status: 'published',
    date_updated: '2024-07-01T12:00:00.000Z',
    color: '#16a34a',
  },
  {
    id: 'sample-3',
    name: 'Archived Skill',
    status: 'archived',
    date_updated: null,
    color: null,
  },
]

export function formatSkillDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
