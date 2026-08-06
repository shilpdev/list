import ReactList, {
  ReactListEmpty,
  ReactListError,
  ReactListGoTo,
  ReactListInitialLoader,
  ReactListItems,
  ReactListLoader,
  ReactListPagination,
  ReactListPerPage,
  ReactListProvider,
  ReactListSearch,
  ReactListSummary,
} from '@7span/react-list';
import type {
  ErrorScope,
  GoToScope,
  PaginationScope,
  PerPageScope,
  SearchScope,
  SerializedListItem,
  SortOrder,
  SummaryScope,
} from '@7span/list-types';
import { Icon } from '@iconify/react';
import { useState } from 'react';

import type { Skill, SkillFilters } from '../types/skill';
import reactListConfig from './react-list-config';

function nextSortOrder(current: SortOrder): 'asc' | 'desc' | '' {
  if (current === '') return 'asc';
  if (current === 'asc') return 'desc';
  return '';
}

const ListWrapper = () => {
  const [filters, setFilters] = useState<SkillFilters>({});

  return (
    <div className="w-full max-w-[1400px] rounded-xl bg-white p-8 text-slate-800 shadow-lg">
      <h2 className="mb-6 text-3xl font-bold text-slate-700">
        React List Playground (TypeScript)
      </h2>

      <ReactListProvider config={reactListConfig}>
        <ReactList
          count={30}
          endpoint="skills"
          search=""
          page={1}
          perPage={10}
          filters={filters}
          paginationMode="pagination"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <ReactListSearch>
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
              </ReactListSearch>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm text-slate-500">
                    Status:
                  </label>
                  <select
                    className="min-w-[120px] appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        status: value === 'all' ? undefined : value,
                      }));
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon icon="mdi:chevron-down" className="h-4 w-4" />
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                  <label className="whitespace-nowrap text-sm text-slate-500">
                    Color:
                  </label>
                  <select
                    className="min-w-[120px] appearance-none rounded-md border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        color: value === 'all' ? undefined : value,
                      }));
                    }}
                  >
                    <option value="all">All Colors</option>
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon icon="mdi:chevron-down" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="my-6">
            <ReactListInitialLoader>
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
                          className="m-2 h-10 flex-1 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </ReactListInitialLoader>

            <ReactListEmpty>
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-white px-4 py-16">
                <div className="relative mb-8">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-slate-50 opacity-30" />
                  <div className="relative rounded-full bg-gradient-to-br from-slate-50 to-slate-100 p-8 shadow-inner">
                    <Icon
                      icon="mdi:file-search-outline"
                      className="h-16 w-16 text-accent-400"
                    />
                  </div>
                </div>

                <h3 className="mb-3 text-2xl font-medium text-slate-800">
                  No Data Found
                </h3>

                <p className="mb-6 max-w-md text-center leading-relaxed text-slate-500">
                  We couldn&apos;t find any matching records. Try adjusting your
                  search or filters.
                </p>

                <button
                  type="button"
                  className="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow"
                >
                  <Icon icon="mdi:refresh" className="h-5 w-5" />
                  Refresh
                </button>
              </div>
            </ReactListEmpty>

            <ReactListError>
              {({ error }: ErrorScope) => (
                <div className="flex flex-col items-center justify-center px-4 py-16">
                  <div className="mb-4 rounded-full bg-red-100 p-6">
                    <Icon
                      icon="mdi:alert-circle-outline"
                      className="h-12 w-12 text-red-500"
                    />
                  </div>
                  <h3 className="mb-2 text-xl font-medium text-slate-800">
                    Something went wrong
                  </h3>
                  <p className="mb-4 max-w-md text-center text-slate-500">
                    {error.message ||
                      'An unexpected error occurred while fetching data.'}
                  </p>
                  <div className="mb-6 w-full max-w-md rounded-md bg-slate-50 p-4">
                    <p className="break-words font-mono text-sm text-slate-600">
                      {error.name}: {error.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded border border-primary-600 bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-600 hover:shadow"
                  >
                    <Icon icon="mdi:refresh" className="h-5 w-5" />
                    Try Again
                  </button>
                </div>
              )}
            </ReactListError>

            <ReactListItems>
              {({ items, sort, setSort }) => (
                <div className="relative max-h-[70vh] w-full overflow-y-auto rounded-md border border-slate-200">
                  <ReactListLoader>
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                      <Icon
                        icon="svg-spinners:blocks-shuffle-3"
                        className="h-12 w-12 animate-pulse text-primary-500"
                      />
                    </div>
                  </ReactListLoader>

                  <table className="w-full whitespace-nowrap border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                          ID
                        </th>
                        <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                          <span className="inline-flex items-center gap-1">
                            Name
                            <button
                              type="button"
                              onClick={() => {
                                const sorting = nextSortOrder(sort.sortOrder);
                                setSort({
                                  by: 'name',
                                  order: sorting as 'asc' | 'desc',
                                });
                              }}
                            >
                              <Icon
                                icon={
                                  sort.sortOrder === ''
                                    ? 'mi:sort'
                                    : sort.sortOrder === 'asc'
                                      ? 'lucide:sort-asc'
                                      : 'lucide:sort-desc'
                                }
                                className="size-5 cursor-pointer text-white"
                              />
                            </button>
                          </span>
                        </th>
                        <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                          Status
                        </th>
                        <th className="border border-slate-200 bg-slate-200 px-2.5 py-2.5 text-left">
                          <span className="inline-flex items-center gap-1">
                            Update At
                            <button
                              type="button"
                              onClick={() => {
                                const sorting = nextSortOrder(sort.sortOrder);
                                setSort({
                                  by: 'date_updated',
                                  order: sorting as 'asc' | 'desc',
                                });
                              }}
                            >
                              <Icon
                                icon={
                                  sort.sortOrder === ''
                                    ? 'mi:sort'
                                    : sort.sortOrder === 'asc'
                                      ? 'lucide:sort-asc'
                                      : 'lucide:sort-desc'
                                }
                                className="size-5 cursor-pointer text-white"
                              />
                            </button>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(items as SerializedListItem<Skill>[]).map((item) => (
                        <tr key={item.id}>
                          <td className="border border-slate-200 bg-white px-2 py-2">
                            {item.id}
                          </td>
                          <td className="border border-slate-200 bg-white px-2 py-2">
                            {item.name}
                          </td>
                          <td className="border border-slate-200 bg-white px-2 py-2">
                            {item.status}
                          </td>
                          <td className="border border-slate-200 bg-white px-2 py-2">
                            {new Date(item.date_updated).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReactListItems>

            <div className="flex w-full flex-col items-center justify-between gap-4 rounded-b-lg border-t border-slate-200 bg-slate-50 px-4 py-5 md:flex-row">
              <div className="flex w-full flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <ReactListSummary>
                    {({ visibleCount }: SummaryScope) => (
                      <span className="font-medium text-slate-700">
                        {visibleCount} Results
                      </span>
                    )}
                  </ReactListSummary>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Page Size:</span>
                  <ReactListPerPage>
                    {({ perPage, setPerPage, options }: PerPageScope) => (
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
                  </ReactListPerPage>
                </div>

                <ReactListGoTo>
                  {({ setPage, page, pagesCount }: GoToScope) => (
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
                </ReactListGoTo>
              </div>

              <ReactListPagination>
                {({
                  page,
                  pagesToDisplay,
                  hasNext,
                  hasPrev,
                  prev,
                  next,
                  first,
                  last,
                  setPage,
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
                        const isActive = item === page;

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
                        );
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
              </ReactListPagination>
            </div>
          </div>
        </ReactList>
      </ReactListProvider>
    </div>
  );
};

export default ListWrapper;
