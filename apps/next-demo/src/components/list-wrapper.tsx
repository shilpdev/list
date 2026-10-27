'use client'

import List, {
  ListColumns,
  ListEmpty,
  ListError,
  ListFilters,
  ListGoTo,
  ListLoaderInitial,
  ListLoadMore,
  ListPagination,
  ListPerPage,
  ListRefresh,
  ListRows,
  ListSearch,
  ListSummary,
} from '@shilp.dev/react-list'
import type { Context, Filter, FilterScope, PaginationMode } from '@shilp.dev/react-list'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleAlertIcon,
  Columns3Icon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchXIcon,
} from 'lucide-react'

import requestHandler from '@/api/request-handler'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { getStateFromSearchParams, stateManager } from '@/lib/react-list-config'
import type { ColumnConfig, FilterConfig, Row } from '@/types/list'

const ALL = 'all'

// The list owns the filters. Seed one per configured filter so its control always renders,
// pulling the initial value from the URL once.
function getInitialFilters(configs: FilterConfig[]): Filter[] {
  const saved = getStateFromSearchParams()?.filters ?? []
  return configs.map(({ column }) => {
    return { column, value: saved.find((filter) => filter.column === column)?.value }
  })
}

// Removes the saved state, then reloads without the query params so the list starts from its props.
function resetState(clearState: () => void) {
  clearState()
  window.location.assign(window.location.pathname)
}

function SelectFilter({
  configs,
  column,
  value,
  setValue,
}: FilterScope & { configs: FilterConfig[] }) {
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
    <div className="flex items-center gap-2">
      <Label htmlFor={`${column}-filter`} className="text-muted-foreground">
        {config.label}:
      </Label>
      <Select
        items={items}
        value={selected}
        onValueChange={(next) => {
          if (next === ALL || next == null) {
            setValue(undefined)
          } else {
            setValue(next)
          }
        }}
      >
        <SelectTrigger id={`${column}-filter`} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((option) => {
            return (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

function RefreshButton({ label }: { label: string }) {
  return (
    <ListRefresh>
      {({ context: { refresh, isLoading } }) => {
        return (
          <Button disabled={isLoading} onClick={() => refresh()}>
            <RefreshCwIcon />
            {label}
          </Button>
        )
      }}
    </ListRefresh>
  )
}

function Toolbar({
  clearState,
  filters,
  searchPlaceholder,
}: Pick<Context<Row>, 'clearState'> & { filters: FilterConfig[]; searchPlaceholder: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <ListSearch>
        {({ search, setSearch }) => {
          return (
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-60"
            />
          )
        }}
      </ListSearch>

      <div className="flex flex-wrap items-center gap-3">
        <ListFilters filter={(scope) => <SelectFilter configs={filters} {...scope} />} />

        <ListColumns>
          {({ context: { columns }, setColumn }) => {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <Columns3Icon />
                  Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    {columns.map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.name}
                          checked={column.visibility ?? true}
                          onCheckedChange={(checked) => {
                            setColumn(column.name, 'visibility', checked)
                          }}
                        >
                          {column.label || column.name}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }}
        </ListColumns>

        <Button variant="outline" onClick={() => resetState(clearState)}>
          <RotateCcwIcon />
          Reset State
        </Button>
      </div>
    </div>
  )
}

function InitialLoader({ columnsCount }: { columnsCount: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      {Array.from({ length: 6 }, (_, rowIndex) => {
        return (
          <div key={rowIndex} className="flex gap-3">
            {Array.from({ length: columnsCount }, (_, cellIndex) => {
              return <Skeleton key={cellIndex} className="h-8 flex-1" />
            })}
          </div>
        )
      })}
    </div>
  )
}

function LoadMoreFooter() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/50 px-4 py-4 text-sm">
      <ListSummary>
        {({ context: { count }, visibleCount }) => {
          return (
            <span className="font-medium">
              Showing {visibleCount} of {count} Results
            </span>
          )
        }}
      </ListSummary>

      <ListLoadMore>
        {({ context: { hasMore, isLoading, loadMore } }) => {
          if (!hasMore) {
            return <p className="text-muted-foreground">You have reached the end.</p>
          }

          let icon = <ChevronDownIcon />
          if (isLoading) {
            icon = <Spinner />
          }

          // Disabled while loading so a second click cannot request the same page twice.
          return (
            <Button variant="outline" disabled={isLoading} onClick={loadMore}>
              {icon}
              Load More
            </Button>
          )
        }}
      </ListLoadMore>
    </div>
  )
}

function PaginationFooter() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-muted/50 px-4 py-3 md:flex-row">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <ListSummary>
          {({ context: { count }, from, to }) => {
            return (
              <span className="font-medium">
                {from} - {to} of {count} Results
              </span>
            )
          }}
        </ListSummary>

        <ListPerPage>
          {({ context: { perPage, setPerPage }, options }) => {
            const items = options.map((option) => {
              return { value: String(option.value), label: String(option.label) }
            })

            return (
              <div className="flex items-center gap-2">
                <Label htmlFor="per-page" className="text-muted-foreground">
                  Page Size:
                </Label>
                <Select
                  items={items}
                  value={String(perPage)}
                  onValueChange={(next) => {
                    if (next != null) {
                      setPerPage(Number(next))
                    }
                  }}
                >
                  <SelectTrigger id="per-page" size="sm" className="w-20">
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
              </div>
            )
          }}
        </ListPerPage>

        <ListGoTo>
          {({ context: { page, setPage }, pagesCount }) => {
            return (
              <div className="flex items-center gap-2">
                <Label htmlFor="go-to" className="text-muted-foreground">
                  Go to:
                </Label>
                <Input
                  id="go-to"
                  type="number"
                  min={1}
                  max={pagesCount}
                  value={page}
                  onChange={(e) => setPage(Number(e.target.value))}
                  className="h-7 w-16 text-center"
                />
                <span className="text-muted-foreground">of {pagesCount}</span>
              </div>
            )
          }}
        </ListGoTo>
      </div>

      <ListPagination>
        {({ context: { page, setPage }, pagesToDisplay, hasNext, hasPrev, prev, next, first, last }) => {
          return (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={first} disabled={!hasPrev} title="First Page">
                <ChevronsLeftIcon />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={prev} disabled={!hasPrev} title="Previous Page">
                <ChevronLeftIcon />
              </Button>

              {pagesToDisplay.map((item) => {
                return (
                  <Button
                    key={item}
                    variant={item === page ? 'default' : 'outline'}
                    size="icon-sm"
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                )
              })}

              <Button variant="outline" size="icon-sm" onClick={next} disabled={!hasNext} title="Next Page">
                <ChevronRightIcon />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={last} disabled={!hasNext} title="Last Page">
                <ChevronsRightIcon />
              </Button>
            </div>
          )
        }}
      </ListPagination>
    </div>
  )
}

export type ListWrapperProps = {
  title: string
  description?: string
  /** The dummyjson resource to list, such as `products` or `users`. */
  endpoint: string
  columns: ColumnConfig[]
  filters?: FilterConfig[]
  searchPlaceholder?: string
  /** `pagination` shows page buttons; `loadMore` appends the next page below the rows. */
  paginationMode?: PaginationMode
  /** The page the list starts on when nothing is saved for this route. */
  page?: number
  perPage?: number
}

export function ListWrapper({
  title,
  description,
  endpoint,
  columns,
  filters = [],
  searchPlaceholder = 'Search...',
  paginationMode = 'pagination',
  page = 1,
  perPage = 10,
}: ListWrapperProps) {
  let footer = <PaginationFooter />
  if (paginationMode === 'loadMore') {
    footer = <LoadMoreFooter />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <List<Row>
          endpoint={endpoint}
          search=""
          page={page}
          perPage={perPage}
          idKey="id"
          columns={columns}
          filters={getInitialFilters(filters)}
          paginationMode={paginationMode}
          requestHandler={requestHandler}
          stateManager={stateManager}
        >
          {({ clearState }) => {
            return (
              <div className="flex flex-col gap-6">
                <Toolbar
                  clearState={clearState}
                  filters={filters}
                  searchPlaceholder={searchPlaceholder}
                />

                <ListLoaderInitial>
                  <InitialLoader columnsCount={columns.length} />
                </ListLoaderInitial>

                <ListEmpty>
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchXIcon />
                      </EmptyMedia>
                      <EmptyTitle>No Data Found</EmptyTitle>
                      <EmptyDescription>
                        We couldn&apos;t find any matching records. Try adjusting your search or
                        filters.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <RefreshButton label="Refresh" />
                    </EmptyContent>
                  </Empty>
                </ListEmpty>

                <ListError>
                  {({ context: { error } }) => {
                    return (
                      <Empty className="border border-destructive/30">
                        <EmptyHeader>
                          <EmptyMedia variant="icon" className="text-destructive">
                            <CircleAlertIcon />
                          </EmptyMedia>
                          <EmptyTitle>Something went wrong</EmptyTitle>
                          <EmptyDescription>
                            {error?.message || 'An unexpected error occurred while fetching data.'}
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <RefreshButton label="Try Again" />
                        </EmptyContent>
                      </Empty>
                    )
                  }}
                </ListError>

                <ListRows>
                  <DataTable columns={columns} />
                </ListRows>

                {footer}
              </div>
            )
          }}
        </List>
      </CardContent>
    </Card>
  )
}
