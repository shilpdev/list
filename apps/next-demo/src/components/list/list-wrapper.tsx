'use client'

import List, {
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListGoTo,
  ListLoadMore,
  ListLoaderInitial,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListRows,
  ListSearch,
  ListSummary,
  useListContext,
} from '@shilp.dev/react-list'
import type {
  Context,
  Filter,
  PaginationMode,
  RequestHandlerResponse,
  RowId,
} from '@shilp.dev/react-list'
import { Icon } from '@iconify/react'

import { requestHandler } from '@/api/request-handler'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { stateManager } from '@/lib/state-manager'
import type { ColumnConfig, FilterConfig, Row } from '@/types/list'

const ALL = 'all'

export interface ListWrapperProps {
  title: string
  /** The dummyjson resource to list, such as `users` or `products`. */
  endpoint: string
  /** Page size of `initialResponse`; the list starts with the same one. */
  perPage: number
  /** `pagination` shows numbered pages; `loadMore` appends the next page below the rows. */
  paginationMode: PaginationMode
  columns: ColumnConfig[]
  filters: FilterConfig[]
  searchPlaceholder: string
  /** First page fetched on the server, so the list paints without a client request. */
  initialResponse: RequestHandlerResponse<Row>
}

export function ListWrapper({
  title,
  endpoint,
  perPage,
  paginationMode,
  columns,
  filters,
  searchPlaceholder,
  initialResponse,
}: ListWrapperProps) {
  let footer = <PaginationFooter />
  if (paginationMode === 'loadMore') {
    footer = <LoadMoreFooter />
  }

  const initialFilters: Filter[] = filters.map(({ column }) => {
    return { column, value: undefined }
  })

  return (
    <List
      endpoint={endpoint}
      idKey="id"
      sortOrder="asc"
      perPage={perPage}
      paginationMode={paginationMode}
      columns={columns}
      filters={initialFilters}
      requestHandler={requestHandler}
      stateManager={stateManager}
      initialResponse={initialResponse}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ListSearch>
            {({ search, setSearch }) => {
              return (
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-60"
                />
              )
            }}
          </ListSearch>

          <div className="flex flex-wrap items-center gap-3">
            <ListFilters>
              {({ context, setFilter }) => {
                return (
                  <div className="flex flex-wrap items-center gap-3">
                    {context.filters.map((filter) => {
                      return (
                        <FilterSelect
                          key={filter.column}
                          configs={filters}
                          column={filter.column}
                          value={filter.value}
                          setValue={(value) => setFilter(filter.column, value)}
                        />
                      )
                    })}
                  </div>
                )
              }}
            </ListFilters>

            <ListColumns>
              {({ context: { columns }, setColumn }) => {
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" />}>
                      <Icon icon="mdi:view-column-outline" />
                      Columns
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        {columns.map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.name}
                              checked={column.visibility}
                              onCheckedChange={(checked) => {
                                setColumn(column.name, 'visibility', checked)
                              }}
                            >
                              {column.label}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }}
            </ListColumns>

            <ListRefresh>
              {({ context: { refresh, isLoading } }) => {
                return (
                  <Button variant="outline" disabled={isLoading} onClick={refresh}>
                    <Icon icon="mdi:refresh" />
                    Refresh
                  </Button>
                )
              }}
            </ListRefresh>

            <ResetStateButton />
          </div>
        </div>

        <ListLoaderInitial>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }, (_, index) => {
              return <Skeleton key={index} className="h-10 w-full" />
            })}
          </div>
        </ListLoaderInitial>

        <ListError>
          {({ context: { error } }) => {
            return (
              <Alert variant="destructive">
                <AlertTitle>Could not load {title.toLowerCase()}</AlertTitle>
                <AlertDescription>{error?.message}</AlertDescription>
              </Alert>
            )
          }}
        </ListError>

        <ListEmpty>
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon icon="mdi:magnify-remove-outline" />
              </EmptyMedia>
              <EmptyTitle>No {title.toLowerCase()} found</EmptyTitle>
              <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </ListEmpty>

        <ListRows>{({ context }) => <RowsTable context={context as Context<Row>} />}</ListRows>

        {footer}
      </div>
    </List>
  )
}

function PaginationFooter() {
  return (
    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
      <div className="flex gap-2">
        <ListPerPage>
          {({ context: { perPage, setPerPage }, options }) => {
            const items = options.map((option) => {
              return { value: String(option.value), label: `${option.label} per page` }
            })

            return (
              <Select
                items={items}
                value={String(perPage)}
                onValueChange={(next) => setPerPage(Number(next))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => {
                    return (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )
          }}
        </ListPerPage>
        <ListGoTo>
          {({ context: { page, setPage }, pages }) => {
            return (
              <Select
                items={pages.map((item) => {
                  return { value: String(item), label: `Page ${item}` }
                })}
                value={String(page)}
                onValueChange={(next) => setPage(Number(next))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((item) => {
                    return (
                      <SelectItem key={item} value={String(item)}>
                        Page {item}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )
          }}
        </ListGoTo>
      </div>

      <ListSummary>
        {({ context: { count, selection }, from, to }) => {
          let selected = ''
          if (selection.length > 0) {
            selected = ` - ${selection.length} selected`
          }

          return (
            <p className="text-center text-sm text-muted-foreground">
              Showing {from} - {to} of {count}
              {selected}
            </p>
          )
        }}
      </ListSummary>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <ListPagination>
          {({
            context: { page, setPage },
            pagesToDisplay,
            hasPrev,
            hasNext,
            prev,
            next,
            first,
            last,
          }) => {
            return (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={!hasPrev} onClick={first}>
                  <Icon icon="mdi:chevron-double-left" />
                </Button>
                <Button variant="outline" size="icon" disabled={!hasPrev} onClick={prev}>
                  <Icon icon="mdi:chevron-left" />
                </Button>
                {pagesToDisplay.map((item) => {
                  let variant: 'default' | 'outline' = 'outline'
                  if (item === page) {
                    variant = 'default'
                  }

                  return (
                    <Button key={item} variant={variant} size="icon" onClick={() => setPage(item)}>
                      {item}
                    </Button>
                  )
                })}
                <Button variant="outline" size="icon" disabled={!hasNext} onClick={next}>
                  <Icon icon="mdi:chevron-right" />
                </Button>
                <Button variant="outline" size="icon" disabled={!hasNext} onClick={last}>
                  <Icon icon="mdi:chevron-double-right" />
                </Button>
              </div>
            )
          }}
        </ListPagination>
      </div>
    </div>
  )
}

function LoadMoreFooter() {
  return (
    <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
      <div />

      <ListSummary>
        {({ context: { count }, visibleCount }) => {
          return (
            <p className="text-center text-sm text-muted-foreground">
              Showing {visibleCount} of {count}
            </p>
          )
        }}
      </ListSummary>

      <div className="flex md:justify-end">
        <ListLoadMore>
          {({ context: { hasMore, isLoading, loadMore } }) => {
            if (!hasMore) {
              return <p className="text-sm text-muted-foreground">You have reached the end.</p>
            }

            return (
              <Button variant="outline" disabled={isLoading} onClick={loadMore}>
                <Icon icon="mdi:chevron-down" />
                Load More
              </Button>
            )
          }}
        </ListLoadMore>
      </div>
    </div>
  )
}

function ResetStateButton() {
  const { clearState } = useListContext()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            onClick={() => {
              clearState()
              window.location.reload()
            }}
          />
        }
      >
        <Icon icon="mdi:restore" />
        Reset State
      </TooltipTrigger>
      <TooltipContent>
        Clears the saved page, filters, sort, search and columns, then reloads.
      </TooltipContent>
    </Tooltip>
  )
}

function FilterSelect({
  configs,
  column,
  value,
  setValue,
}: {
  configs: FilterConfig[]
  column: string
  value: unknown
  setValue: (value: unknown) => void
}) {
  const config = configs.find((item) => {
    return item.column === column
  })

  if (!config) {
    return null
  }

  const items = [{ value: ALL, label: `All ${config.label}` }, ...config.options]

  let selected = ALL
  if (value != null) {
    selected = String(value)
  }

  return (
    <Select
      items={items}
      value={selected}
      onValueChange={(next) => {
        if (next === ALL) {
          setValue(undefined)
        } else {
          setValue(next)
        }
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => {
          return (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function RowsTable({ context }: { context: Context<Row> }) {
  const columns = context.columns.filter((column) => {
    return column.visibility
  })

  // Dims the rows and shows a loader bar while a request runs (a new page, sort, filter or search).
  let overlay = null
  if (context.isLoading) {
    overlay = (
      <div className="absolute inset-0 z-10 bg-background/60">
        <div className="h-1 w-full animate-pulse bg-primary" />
      </div>
    )
  }

  let allChecked = false
  if (context.selectionState === 'all') {
    allChecked = true
  }

  // Sorting is done by the API. A header click goes asc, then desc, then off. The list starts with
  // `sortOrder="asc"`, so the first click on a column is a single request.
  function sort(name: string) {
    if (context.sortBy !== name) {
      context.setSortBy(name)
      if (context.sortOrder !== 'asc') {
        context.setSortOrder('asc')
      }
    } else if (context.sortOrder === 'asc') {
      context.setSortOrder('desc')
    } else {
      context.setSortBy('')
    }
  }

  function getSortIcon(name: string) {
    if (context.sortBy !== name) {
      return 'mdi:swap-vertical'
    }
    if (context.sortOrder === 'desc') {
      return 'mdi:arrow-down'
    }
    return 'mdi:arrow-up'
  }

  return (
    <div className="relative">
      {overlay}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allChecked}
                indeterminate={context.selectionState === 'partial'}
                onCheckedChange={() => context.toggleAllRowsSelection()}
              />
            </TableHead>
            <TableHead>#</TableHead>
            {columns.map((column) => {
              let header = <>{column.label}</>
              if (column.isSortable) {
                header = (
                  <Button variant="ghost" className="-ml-2.5" onClick={() => sort(column.name)}>
                    {column.label}
                    <Icon icon={getSortIcon(column.name)} />
                  </Button>
                )
              }

              return <TableHead key={column.name}>{header}</TableHead>
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {context.rows.map((row) => {
            const id = row.id as RowId

            return (
              <TableRow key={id}>
                <TableCell>
                  <Checkbox
                    checked={context.selection.includes(id)}
                    onCheckedChange={() => context.toggleRowSelection(id)}
                  />
                </TableCell>
                <TableCell>{String(row._index)}</TableCell>
                {columns.map((column) => {
                  return <TableCell key={column.name}>{String(row[column.name] ?? '')}</TableCell>
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
