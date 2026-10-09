# @shilp.dev/react-list examples

## Minimal table

```tsx
import { useState } from 'react'
import ReactList, {
  ListEmpty,
  ListError,
  ListInitialLoader,
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
    <ReactList endpoint="skills" perPage={10} requestHandler={requestHandler} filters={filters}>
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

      <ListInitialLoader>
        <p>Loading...</p>
      </ListInitialLoader>

      <ListEmpty>
        <p>No skills found.</p>
      </ListEmpty>

      <ListError>{({ error }) => <p>{error.message}</p>}</ListError>

      <ListRows>
        {({ rows, sort, setSort }) => (
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
                        setSort({
                          by: 'name',
                          order:
                            sort.sortBy === 'name' && sort.sortOrder === 'asc' ? 'desc' : 'asc',
                        })
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
        {({ from, to, count }) => (
          <span>
            {from} - {to} of {count}
          </span>
        )}
      </ListSummary>

      <ListPagination>
        {({ page, pagesToDisplay, hasNext, hasPrev, prev, next, setPage }) => (
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
    </ReactList>
  )
}
```

## Load more

```tsx
<ReactList endpoint="skills" paginationMode="loadMore" requestHandler={requestHandler}>
  <ListRows>{({ rows }) => /* ... */ null}</ListRows>
  <ListLoadMore>
    {({ loadMore, hasMoreRows, isLoading }) => (
      <button type="button" disabled={!hasMoreRows || isLoading} onClick={loadMore}>
        {hasMoreRows ? (isLoading ? 'Loading...' : 'Load more') : 'All loaded'}
      </button>
    )}
  </ListLoadMore>
</ReactList>
```

## Patch one row

```tsx
import { ListRows, useListContext } from '@shilp.dev/react-list'

function SkillRow({ row }: { row: Skill }) {
  const { listState } = useListContext<Skill>()

  async function onRename(name: string) {
    const saved = await api.updateSkill(row.id, { name })
    listState.updateRowById(saved, row.id)
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

<ReactList endpoint="skills" requestHandler={requestHandler} stateManager={stateManager}>
  {/* ... */}
</ReactList>
```
