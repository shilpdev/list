<script setup lang="ts">
import type { ColumnConfig, FilterConfig } from '~/types/list'

const PER_PAGE = 10

const columns: ColumnConfig[] = [
  { name: 'firstName', label: 'First Name', isSortable: true },
  { name: 'lastName', label: 'Last Name', isSortable: true },
  { name: 'email', label: 'Email' },
  { name: 'age', label: 'Age', isSortable: true },
  { name: 'gender', label: 'Gender', isSortable: true },
  { name: 'role', label: 'Role', isSortable: true },
]

const filters: FilterConfig[] = [
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

// Fetched on the server, so the HTML ships with the first page and the list skips its first
// client request.
const { data: initialResponse } = await useAsyncData('users-initial', () => {
  return requestHandler({
    endpoint: 'users',
    page: 1,
    perPage: PER_PAGE,
    search: '',
    sortBy: '',
    sortOrder: '',
    filters: [],
  })
})
</script>

<template>
  <ListWrapper
    v-if="initialResponse"
    title="Users"
    endpoint="users"
    :per-page="PER_PAGE"
    pagination-mode="pagination"
    :columns="columns"
    :filters="filters"
    search-placeholder="Search users..."
    :initial-response="initialResponse"
  />
</template>
