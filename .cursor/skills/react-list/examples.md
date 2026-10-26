# @shilp.dev/react-list examples

## Minimal table

```tsx
import { useState } from 'react'
import List, {
  ListEmpty,
  ListError,
  ListLoaderInitial,
  ListLoader,
  ListPagination,
  ListRows,
  ListSearch,
  ListSummary,
} from '@shilp.dev/react-list'
import type { RequestHandler } from '@shilp.dev/react-list'

type Skill = { id: number; name: string; status: string }

const requestHandler: RequestHandler<Skill> = async ({
  endpoint,
  page,
  perPage,
  search,
  sortBy,
  sortOrder,
  filters,
}) => {
  const params = new URLSearchParams()
  if (page && perPage) {
    params.set('page', String(page))
    params.set('limit', String(perPage))
  }
  if (search) params.set('search', search)
  if (sortBy) params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy)
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && value !== '') params.set(`filter[${key}]`, String(value))
  })

  const res = await fetch(`/api/${endpoint}?${params}`)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const body = await res.json()
  return { rows: body.data ?? [], count: body.total ?? 0 }
}

export function SkillList() {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})

  return (
    <List
      endpoint="skills"
      perPage={10}
      requestHandler={requestHandler}
      filters={filters}
      onFiltersChange={setFilters}
    >
      <ListSearch>
        {({ search, setSearch }) => (
          <input
            type="search"
            value={search}
            placeholder="Search..."
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
      </ListSearch>

      <select
        onChange={(event) =>
          setFilters((current) => ({
            ...current,
            status: event.target.value === 'all' ? undefined : event.target.value,
          }))
        }
      >
        <option value="all">All</option>
        <option value="published">Published</option>
      </select>

      <ListLoaderInitial>
        <p>Loading...</p>
      </ListLoaderInitial>

      <ListEmpty>
        <p>No skills found.</p>
      </ListEmpty>

      <ListError>{({ context }) => <p>{context.error?.message}</p>}</ListError>

      <ListRows>
        {({ context: { rows, sortBy, sortOrder, setSortBy, setSortOrder } }) => (
          <div>
            <ListLoader>
              <p>Updating...</p>
            </ListLoader>
            <table>
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      onClick={() =>
                        {
                          setSortBy('name')
                          setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }
                      }
                    >
                      Name
                    </button>
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListRows>

      <ListSummary>
        {({ from, to, context: { count } }) => (
          <span>
            {from} - {to} of {count}
          </span>
        )}
      </ListSummary>

      <ListPagination>
        {({ context: { page, setPage }, pagesToDisplay, hasNext, hasPrev, prev, next }) => (
          <div>
            <button type="button" disabled={!hasPrev} onClick={prev}>
              Prev
            </button>
            {pagesToDisplay.map((item) => (
              <button key={item} type="button" onClick={() => setPage(item)}>
                {item === page ? `[${item}]` : item}
              </button>
            ))}
            <button type="button" disabled={!hasNext} onClick={next}>
              Next
            </button>
          </div>
        )}
      </ListPagination>
    </List>
  )
}
```

## Load more

```tsx
<List endpoint="skills" paginationMode="loadMore" requestHandler={requestHandler}>
  <ListRows>{({ context: { rows } }) => /* ... */ null}</ListRows>
  <ListLoadMore>
    {({ context: { loadMore, hasMore, isLoading } }) => (
      <button type="button" disabled={!hasMore || isLoading} onClick={loadMore}>
        {hasMore ? (isLoading ? 'Loading...' : 'Load more') : 'All loaded'}
      </button>
    )}
  </ListLoadMore>
</List>
```

## Patch one row

```tsx
import { ListRows, useListContext } from '@shilp.dev/react-list'

function SkillRow({ row }: { row: Skill }) {
  const context = useListContext<Skill>()

  async function onRename(name: string) {
    const saved = await api.updateSkill(row.id, { name })
    context.updateRowById(saved, row.id)
  }

  return (
    <div>
      {row.name}
      <button type="button" onClick={() => onRename('Updated')}>
        Save
      </button>
    </div>
  )
}

;<ListRows row={({ row }) => <SkillRow row={row} />} />
```

## Persist UI state

```tsx
const stateManager = {
  get: ({ endpoint }) => {
    const raw = sessionStorage.getItem(`list:${endpoint}`)
    return raw ? JSON.parse(raw) : null
  },
  set: (context) => {
    sessionStorage.setItem(`list:${context.endpoint}`, JSON.stringify(context))
  },
}

<List endpoint="skills" requestHandler={requestHandler} stateManager={stateManager}>
  {/* ... */}
</List>
```
