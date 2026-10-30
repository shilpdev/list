import { Suspense } from 'react'

import { fetchInitialResponse } from '@/api/request-handler'
import { ListWrapper, ListWrapperSkeleton } from '@/components/list-wrapper'
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

// The dummyjson fetch is uncached runtime data. Under Cache Components it cannot run in the
// prerendered shell, so it lives in an async child wrapped in <Suspense>: the shell (header, card,
// toolbar) prerenders and the first page streams in at request time.
async function UsersList() {
  // Fetch the first page on the server. `perPage` matches the ListWrapper default (10).
  const initialResponse = await fetchInitialResponse({ endpoint: 'users', perPage: 10 })

  return (
    <ListWrapper
      title="Users"
      description="https://dummyjson.com/users"
      endpoint="users"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search users..."
      initialResponse={initialResponse}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={<ListWrapperSkeleton title="Users" columnsCount={COLUMNS.length} />}>
      <UsersList />
    </Suspense>
  )
}
