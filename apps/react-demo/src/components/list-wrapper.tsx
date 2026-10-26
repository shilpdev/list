import List, {
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListGoTo,
  ListLoaderInitial,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListRows,
  ListSearch,
  ListSummary,
  useListContext,
} from '@shilp.dev/react-list'
import type {
  ColumnsScope,
  Context,
  Filter,
  FilterScope,
  GoToScope,
  ListScope,
  PaginationScope,
  PerPageScope,
  SearchScope,
  SortOrder,
  SummaryScope,
} from '@shilp.dev/react-list'
import { Icon } from '@iconify/react'

import type { Skill } from '../types/skill'
import requestHandler from '../api/request-handler'
import { getStateFromSearchParams, stateManager } from './react-list-config'

// The list owns the filters now. Seed `status` and `color` so the filter controls always render,
// pulling their initial value from the URL/saved state once.
function getInitialFilters(): Filter[] {
  const saved = getStateFromSearchParams()?.filters ?? []
  return ['status', 'color'].map((column) => {
    return { column, value: saved.find((filter) => filter.column === column)?.value }
  })
}

function toFilterValue(value: string): string | undefined {
  if (value === 'all') {
    return undefined
  }

  return value
}

// Removes the saved state, then reloads without the query params so the list starts from its props.
function resetState(clearState: () => void) {
  clearState()
  window.location.assign(window.location.pathname)
}

function PatchRowButton({ id }: { id: Skill['id'] }) {
  const listContext = useListContext<Skill>()

  return (
    <button
      type="button"
      onClick={() =>
        listContext.updateRowById(
          {
            name: `Patched ${new Date().toLocaleTimeString()}`,
            date_updated: new Date().toISOString(),
          },
          id,
        )
      }
    >
      Patch
    </button>
  )
}

function SkillRowsTable({
  rows,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
}: {
  rows: Skill[]
  sortBy: string
  sortOrder: SortOrder
  setSortBy: (sortBy: string) => void
  setSortOrder: (sortOrder: SortOrder) => void
}) {
  const listContext = useListContext<Skill>()
  const isVisible = (name: string) => {
    return listContext.columns.find((column) => column.name === name)?.visibility ?? true
  }

  function toggleSort(by: string) {
    const currentOrder = sortBy === by ? sortOrder : ''
    const sorting: SortOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(by)
    setSortOrder(sorting)
  }

  function sortIcon(by: string) {
    if (sortBy !== by || sortOrder === '') {
      return 'mi:sort'
    }

    if (sortOrder === 'asc') {
      return 'lucide:sort-asc'
    }

    return 'lucide:sort-desc'
  }

  return (
    <div className="relative max-h-[70vh] w-full overflow-y-auto rounded-md border border-slate-200">
      <ListLoader>
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <Icon
            icon="svg-spinners:blocks-shuffle-3"
            className="h-12 w-12 animate-pulse text-primary-500"
          />
        </div>
      </ListLoader>

      <table className="w-full whitespace-nowrap border-collapse">
        <thead>
          <tr>
            {isVisible('id') && (
              <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">ID</th>
            )}
            {isVisible('name') && (
              <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                <span className="inline-flex items-center gap-1">
                  Name
                  <button type="button" onClick={() => toggleSort('name')}>
                    <Icon
                      icon={sortIcon('name')}
                      className="size-5 cursor-pointer text-slate-700"
                    />
                  </button>
                </span>
              </th>
            )}
            {isVisible('status') && (
              <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                Status
              </th>
            )}
            {isVisible('date_updated') && (
              <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                <span className="inline-flex items-center gap-1">
                  Update At
                  <button type="button" onClick={() => toggleSort('date_updated')}>
                    <Icon
                      icon={sortIcon('date_updated')}
                      className="size-5 cursor-pointer text-slate-700"
                    />
                  </button>
                </span>
              </th>
            )}
            <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {isVisible('id') && (
                <td className="border border-slate-200 bg-white px-2 py-2">{row.id}</td>
              )}
              {isVisible('name') && (
                <td className="border border-slate-200 bg-white px-2 py-2">{row.name}</td>
              )}
              {isVisible('status') && (
                <td className="border border-slate-200 bg-white px-2 py-2">{row.status}</td>
              )}
              {isVisible('date_updated') && (
                <td className="border border-slate-200 bg-white px-2 py-2">
                  {new Date(row.date_updated).toLocaleString()}
                </td>
              )}
              <td className="border border-slate-200 bg-white px-2 py-2">
                <PatchRowButton id={row.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FILTER_OPTIONS: Record<
  string,
  { label: string; options: Array<{ value: string; label: string }> }
> = {
  status: {
    label: 'Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'draft', label: 'Draft' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  color: {
    label: 'Color',
    options: [
      { value: 'all', label: 'All Colors' },
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'yellow', label: 'Yellow' },
    ],
  },
}

// Renders one filter control, matching Vue's per-column `#status` / `#color` slots.
function SkillFilter({ column, value, setValue }: FilterScope) {
  const config = FILTER_OPTIONS[column]

  if (!config) {
    return null
  }

  return (
    <div className="relative flex items-center gap-2">
      <label className="whitespace-nowrap text-sm text-slate-500" htmlFor={`${column}-filter`}>
        {config.label}:
      </label>
      <select
        id={`${column}-filter`}
        className="appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        value={value == null ? 'all' : String(value)}
        onChange={(e) => setValue(toFilterValue(e.target.value))}
      >
        {config.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
        <Icon icon="mdi:chevron-down" className="h-4 w-4" />
      </div>
    </div>
  )
}

const ListWrapper = () => {
  return (
    <div className="w-full max-w-350 rounded-xl bg-white p-8 text-slate-800 shadow-lg">
      <h2 className="mb-6 text-3xl font-bold text-slate-700">
        Shilp List Playground (React + TypeScript)
      </h2>

      <List
        endpoint="skills"
        search=""
        page={1}
        perPage={10}
        idKey="id"
        columns={[
          { name: 'id', label: 'ID' },
          { name: 'name', label: 'Name' },
          { name: 'status', label: 'Status' },
          { name: 'date_updated', label: 'Update At' },
        ]}
        filters={getInitialFilters()}
        paginationMode="pagination"
        requestHandler={requestHandler}
        stateManager={stateManager}
      >
        {({ clearState }: Context<Skill>) => (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <ListSearch>
                  {({ search, setSearch }: SearchScope) => (
                    <div className="relative w-60">
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search skills..."
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  )}
                </ListSearch>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Columns:
                </span>
                <ListColumns>
                  {({ context: { columns }, setColumn }: ColumnsScope) => (
                    <div className="flex flex-wrap items-center gap-2">
                      {columns.map((column) => {
                        const columnLabel = column.label || column.name
                        const isVisible = column.visibility ?? true

                        return (
                          <label
                            key={column.name}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                              isVisible
                                ? 'border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50'
                                : 'border-slate-200 bg-slate-100 text-slate-400 line-through opacity-70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={(e) =>
                                setColumn(column.name, 'visibility', e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span>{columnLabel}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </ListColumns>
              </div>

              <ListFilters filter={(scope: FilterScope) => <SkillFilter {...scope} />} />

              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => resetState(clearState)}
              >
                <Icon icon="mdi:restore" className="h-4 w-4" />
                Reset State
              </button>
            </div>

            <div className="my-6">
              <ListLoaderInitial>
                <div className="w-full overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className="w-full">
                    <div className="flex w-full">
                      {[...Array(4)].map((_, index) => (
                        <div
                          key={`header-${index}`}
                          className="m-2 h-12 flex-1 animate-pulse rounded bg-slate-200"
                        />
                      ))}
                    </div>
                    {[...Array(5)].map((_, rowIndex) => (
                      <div key={`row-${rowIndex}`} className="flex w-full">
                        {[...Array(4)].map((_, cellIndex) => (
                          <div
                            key={`cell-${rowIndex}-${cellIndex}`}
                            className="m-2 h-10 flex-1 animate-pulse rounded bg-linear-to-r from-slate-100 via-slate-200 to-slate-100"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </ListLoaderInitial>

              <ListEmpty>
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-white px-4 py-16">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-slate-50 opacity-30" />
                    <div className="relative rounded-full bg-linear-to-br from-slate-50 to-slate-100 p-8 shadow-inner">
                      <Icon icon="mdi:file-search-outline" className="h-16 w-16 text-accent-400" />
                    </div>
                  </div>

                  <h3 className="mb-3 text-2xl font-medium text-slate-800">No Data Found</h3>

                  <p className="mb-6 max-w-md text-center leading-relaxed text-slate-500">
                    We couldn&apos;t find any matching records. Try adjusting your search or
                    filters.
                  </p>

                  <ListRefresh>
                    {({ context: { refresh, isLoading } }: ListScope) => (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => refresh()}
                        className="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon icon="mdi:refresh" className="h-5 w-5" />
                        Refresh
                      </button>
                    )}
                  </ListRefresh>
                </div>
              </ListEmpty>

              <ListError>
                {({ context: { error } }: ListScope) => (
                  <div className="flex flex-col items-center justify-center px-4 py-16">
                    <div className="mb-4 rounded-full bg-red-100 p-6">
                      <Icon icon="mdi:alert-circle-outline" className="h-12 w-12 text-red-500" />
                    </div>
                    <h3 className="mb-2 text-xl font-medium text-slate-800">
                      Something went wrong
                    </h3>
                    <p className="mb-4 max-w-md text-center text-slate-500">
                      {error?.message || 'An unexpected error occurred while fetching data.'}
                    </p>
                    <div className="mb-6 w-full max-w-md rounded-md bg-slate-50 p-4">
                      <p className="wrap-break-word font-mono text-sm text-slate-600">
                        {error?.name}: {error?.message}
                      </p>
                    </div>
                    <ListRefresh>
                      {({ context: { refresh, isLoading } }: ListScope) => (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => refresh()}
                          className="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Icon icon="mdi:refresh" className="h-5 w-5" />
                          Try Again
                        </button>
                      )}
                    </ListRefresh>
                  </div>
                )}
              </ListError>

              <ListRows>
                {({ context: { rows, sortBy, sortOrder, setSortBy, setSortOrder } }) => (
                  <SkillRowsTable
                    rows={rows as Skill[]}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    setSortBy={setSortBy}
                    setSortOrder={setSortOrder}
                  />
                )}
              </ListRows>

              <div className="flex w-full flex-col items-center justify-between gap-4 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-5 md:flex-row">
                <div className="flex w-full flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <ListSummary>
                      {({ context: { count }, from, to }: SummaryScope) => (
                        <span className="font-medium text-slate-700">
                          {from} - {to} of {count} Results
                        </span>
                      )}
                    </ListSummary>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Page Size:</span>
                    <ListPerPage>
                      {({ context: { perPage, setPerPage }, options }: PerPageScope) => (
                        <div className="relative">
                          <select
                            value={String(perPage)}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="w-20 appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          >
                            {options.map((option) => (
                              <option
                                key={`page-size-${option.value}`}
                                value={String(option.value)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                            <Icon icon="mdi:chevron-down" className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </ListPerPage>
                  </div>

                  <ListGoTo>
                    {({ context: { setPage, page }, pagesCount }: GoToScope) => (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Go to:</span>
                        <input
                          type="number"
                          min={1}
                          max={pagesCount}
                          value={page}
                          onChange={(e) => setPage(Number(e.target.value))}
                          className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-medium shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <span className="text-slate-500">of {pagesCount}</span>
                      </div>
                    )}
                  </ListGoTo>
                </div>

                <ListPagination>
                  {({
                    context: { page, setPage },
                    pagesToDisplay,
                    hasNext,
                    hasPrev,
                    prev,
                    next,
                    first,
                    last,
                  }: PaginationScope) => (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={first}
                        disabled={!hasPrev}
                        title="First Page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-double-left" className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={prev}
                        disabled={!hasPrev}
                        title="Previous Page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-left" className="h-4 w-4" />
                      </button>

                      <div className="mx-1 flex items-center gap-1">
                        {pagesToDisplay.map((item, index) => {
                          const isActive = item === page

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setPage(item)}
                              className={`h-8 min-w-8 rounded-md border px-2 text-sm font-medium transition ${
                                isActive
                                  ? 'border-primary-600 bg-primary-500 text-white'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={next}
                        disabled={!hasNext}
                        title="Next Page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={last}
                        disabled={!hasNext}
                        title="Last Page"
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon icon="mdi:chevron-double-right" className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </ListPagination>
              </div>
            </div>
          </>
        )}
      </List>
    </div>
  )
}

export default ListWrapper
