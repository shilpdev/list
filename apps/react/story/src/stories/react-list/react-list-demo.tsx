import { useMemo, useState } from 'react'
import ReactList, {
  ListEmpty,
  ListError,
  ListInitialLoader,
  ListItems,
  ListLoadMore,
  ListLoader,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListSearch,
  ListSummary,
} from '@shilp.dev/react-list'
import type { ListSort } from '@shilp.dev/list-types'
import {
  createRequestHandler,
  type CreateRequestHandlerOptions,
} from '@/api/request-handler'
import { formatSkillDate, type Skill } from '@/types/skill'
import './react-list-demo.css'

const PER_PAGE_OPTIONS = [8, 10, 15, 25, 50, 100]

export interface ReactListDemoProps {
  endpoint?: string
  page?: number
  perPage?: number
  paginationMode?: 'pagination' | 'loadMore'
  /**
   * Serializable options for the demo request handler.
   * Sample JSON: `{ "forceEmpty": false, "shouldFail": false }`
   */
  requestHandler?: CreateRequestHandlerOptions
  count?: number
}

function toggleSort(
  sort: ListSort,
  setSort: (next: { by: string; order: 'asc' | 'desc' }) => void,
  by: string,
) {
  const currentOrder = sort.sortBy === by ? sort.sortOrder : ''
  const order: 'asc' | 'desc' = currentOrder === 'asc' ? 'desc' : 'asc'
  setSort({ by, order })
}

export function ReactListDemo(props: ReactListDemoProps) {
  const listKey = [
    props.endpoint,
    props.page,
    props.perPage,
    props.paginationMode,
    props.count,
    props.requestHandler?.forceEmpty,
    props.requestHandler?.shouldFail,
  ].join(':')

  return <ReactListDemoInner key={listKey} {...props} />
}

function ReactListDemoInner({
  endpoint = 'skills',
  page = 1,
  perPage = 10,
  paginationMode = 'pagination',
  requestHandler,
  count,
}: ReactListDemoProps) {
  const [filters, setFilters] = useState<Record<string, string | undefined>>({})
  const handler = useMemo(
    () => createRequestHandler(requestHandler ?? {}),
    [requestHandler],
  )
  const perPageOptions = useMemo(() => {
    if (PER_PAGE_OPTIONS.includes(perPage)) {
      return PER_PAGE_OPTIONS
    }

    return [...PER_PAGE_OPTIONS, perPage].sort((a, b) => a - b)
  }, [perPage])

  function onStatusChange(value: string) {
    setFilters((current) => ({
      ...current,
      status: value === 'all' ? undefined : value,
    }))
  }

  return (
    <div className="react-list-demo">
      <ReactList
        endpoint={endpoint}
        page={page}
        perPage={perPage}
        paginationMode={paginationMode}
        requestHandler={handler}
        count={count}
        filters={filters}
      >
        <div className="react-list-demo__toolbar">
          <ListSearch>
            {({ search, setSearch }) => (
              <input
                type="search"
                className="react-list-demo__input"
                value={search}
                placeholder="Search skills..."
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </ListSearch>

          <label className="react-list-demo__filter">
            Status
            <select
              className="react-list-demo__select"
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <ListInitialLoader>
          <p className="react-list-demo__message">Loading initial data...</p>
        </ListInitialLoader>

        <ListEmpty>
          <p className="react-list-demo__message">No skills found.</p>
        </ListEmpty>

        <ListError>
          {({ error }) => (
            <div className="react-list-demo__error">
              <p>{error.message}</p>
              <ListRefresh>
                {({ refresh, isLoading }) => (
                  <button
                    type="button"
                    className="react-list-demo__button"
                    disabled={isLoading}
                    onClick={refresh}
                  >
                    Try again
                  </button>
                )}
              </ListRefresh>
            </div>
          )}
        </ListError>

        <ListItems>
          {({ items, sort, setSort }) => (
            <div className="react-list-demo__table-wrap">
              <ListLoader>
                <p className="react-list-demo__overlay">Updating...</p>
              </ListLoader>

              <table className="react-list-demo__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>
                      <button
                        type="button"
                        className="react-list-demo__sort"
                        onClick={() => toggleSort(sort, setSort, 'name')}
                      >
                        Name
                      </button>
                    </th>
                    <th>Status</th>
                    <th>
                      <button
                        type="button"
                        className="react-list-demo__sort"
                        onClick={() => toggleSort(sort, setSort, 'date_updated')}
                      >
                        Updated
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(items as unknown as Skill[]).map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.status}</td>
                      <td>{formatSkillDate(item.date_updated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ListItems>

        <div className="react-list-demo__footer">
          <ListSummary>
            {({ count: total, from, to }) => (
              <span>
                {from} - {to} of {total}
              </span>
            )}
          </ListSummary>

          <ListPerPage options={perPageOptions}>
            {({ perPage: currentPerPage, setPerPage, options }) => (
              <label className="react-list-demo__filter">
                Per page
                <select
                  className="react-list-demo__select"
                  value={String(currentPerPage)}
                  onChange={(event) => setPerPage(Number(event.target.value))}
                >
                  {options.map((option) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </ListPerPage>

          {paginationMode === 'pagination' ? (
            <ListPagination>
              {({ page: currentPage, pagesToDisplay, hasNext, hasPrev, prev, next, setPage }) => (
                <div className="react-list-demo__pagination">
                  <button
                    type="button"
                    className="react-list-demo__button"
                    disabled={!hasPrev}
                    onClick={prev}
                  >
                    Prev
                  </button>
                  {pagesToDisplay.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`react-list-demo__button${
                        item === currentPage ? ' react-list-demo__button--active' : ''
                      }`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="react-list-demo__button"
                    disabled={!hasNext}
                    onClick={next}
                  >
                    Next
                  </button>
                </div>
              )}
            </ListPagination>
          ) : (
            <ListLoadMore>
              {({ loadMore, hasMoreItems, isLoading }) => (
                <button
                  type="button"
                  className="react-list-demo__button"
                  disabled={!hasMoreItems || isLoading}
                  onClick={loadMore}
                >
                  {hasMoreItems ? (isLoading ? 'Loading...' : 'Load more') : 'All loaded'}
                </button>
              )}
            </ListLoadMore>
          )}
        </div>
      </ReactList>
    </div>
  )
}
