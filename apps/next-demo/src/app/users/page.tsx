import { requestHandler } from '@/api/request-handler'
import { ListWrapper } from '@/components/list/list-wrapper'
import type { ColumnConfig, FilterConfig } from '@/types/list'

const COLUMNS: ColumnConfig[] = [
  { name: 'firstName', label: 'First Name', isSortable: true },
  { name: 'lastName', label: 'Last Name', isSortable: true },
  { name: 'email', label: 'Email' },
  { name: 'age', label: 'Age', isSortable: true },
  { name: 'gender', label: 'Gender', isSortable: true },
  { name: 'role', label: 'Role', isSortable: true },
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
  {
    column: 'gender',
    label: 'Genders',
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
    ],
  },
]

const PER_PAGE = 10

// Fetched on every request so the HTML ships with the first page and the list skips its first
// client request.
export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialResponse = await requestHandler({
    endpoint: 'users',
    page: 1,
    perPage: PER_PAGE,
    search: '',
    sortBy: '',
    sortOrder: '',
    filters: [],
  })

  return (
    <ListWrapper
      title="Users"
      endpoint="users"
      perPage={PER_PAGE}
      paginationMode="pagination"
      columns={COLUMNS}
      filters={FILTERS}
      searchPlaceholder="Search users..."
      initialResponse={initialResponse}
    />
  )
}
