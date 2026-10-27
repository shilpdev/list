'use client'

import { ListWrapper } from '@/components/list-wrapper'
import type { ColumnConfig, FilterConfig } from '@/types/list'

const COLUMNS: ColumnConfig[] = [
  { name: 'image', label: 'Avatar', format: 'image' },
  { name: 'id', label: 'ID', isSortable: true },
  { name: 'firstName', label: 'First Name', isSortable: true },
  { name: 'lastName', label: 'Last Name', isSortable: true },
  { name: 'email', label: 'Email', isSortable: true },
  { name: 'age', label: 'Age', isSortable: true },
  { name: 'gender', label: 'Gender', format: 'badge' },
  { name: 'role', label: 'Role', format: 'badge' },
]

const FILTERS: FilterConfig[] = [
  {
    column: 'role',
    label: 'Roles',
    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'user', label: 'User' },
    ],
  },
]

export default function Page() {
  return (
    <ListWrapper
      title="Users"
      description="https://dummyjson.com/users"
      endpoint="users"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search users..."
    />
  )
}
