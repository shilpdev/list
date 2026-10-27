'use client'

import { useMemo } from 'react'
import { ListLoader, useListContext } from '@shilp.dev/react-list'
import type { SortOrder } from '@shilp.dev/react-list'
import {
  columnVisibilityFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnDef, ColumnVisibilityState, SortingState, Updater } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CellFormat, ColumnConfig, Row } from '@/types/list'

// Features live at module scope so TanStack Table gets a stable input.
const features = tableFeatures({ columnVisibilityFeature, rowSortingFeature })

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function Cell({ value, format }: { value: unknown; format: CellFormat }) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  if (format === 'image') {
    return (
      <Avatar>
        <AvatarImage src={String(value)} alt="" />
        <AvatarFallback />
      </Avatar>
    )
  }

  if (format === 'badge') {
    return <Badge variant="secondary">{String(value)}</Badge>
  }

  if (format === 'currency') {
    return currency.format(Number(value))
  }

  return String(value)
}

function toTableColumns(configs: ColumnConfig[]): ColumnDef<typeof features, Row>[] {
  return configs.map((config) => {
    return {
      id: config.name,
      header: config.label,
      accessorFn: (row) => {
        return row[config.name]
      },
      enableSorting: config.isSortable ?? false,
      cell: ({ getValue }) => {
        return <Cell value={getValue()} format={config.format ?? 'text'} />
      },
    }
  })
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUpIcon />
  }

  if (direction === 'desc') {
    return <ArrowDownIcon />
  }

  return <ArrowUpDownIcon className="text-muted-foreground" />
}

export type DataTableProps = {
  columns: ColumnConfig[]
}

// Rows, sorting and column visibility are owned by the list; the table only renders them.
// Sorting is done by the API, so `manualSorting` is on and a sort change goes back to the list.
export function DataTable({ columns }: DataTableProps) {
  const {
    rows,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    columns: listColumns,
  } = useListContext<Row>()

  const tableColumns = useMemo(() => {
    return toTableColumns(columns)
  }, [columns])

  const sorting: SortingState = []
  if (sortBy && sortOrder) {
    sorting.push({ id: sortBy, desc: sortOrder === 'desc' })
  }

  const columnVisibility: ColumnVisibilityState = {}
  for (const column of listColumns) {
    columnVisibility[column.name] = column.visibility ?? true
  }

  function onSortingChange(updater: Updater<SortingState>) {
    let next = updater
    if (typeof next === 'function') {
      next = next(sorting)
    }

    const [first] = next
    let nextSortBy = ''
    let nextSortOrder: SortOrder = ''
    if (first) {
      nextSortBy = first.id
      nextSortOrder = first.desc ? 'desc' : 'asc'
    }

    setSortBy(nextSortBy)
    setSortOrder(nextSortOrder)
  }

  const table = useTable({
    features,
    columns: tableColumns,
    data: rows,
    getRowId: (row) => {
      return String(row.id)
    },
    manualSorting: true,
    sortDescFirst: false,
    state: { sorting, columnVisibility },
    onSortingChange,
  })

  return (
    <div className="relative overflow-y-auto rounded-lg border">
      <ListLoader>
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
          <Spinner className="size-8" />
        </div>
      </ListLoader>

      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          {table.getHeaderGroups().map((group) => {
            return (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  let content = <table.FlexRender header={header} />
                  if (header.column.getCanSort()) {
                    content = (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <SortIcon direction={header.column.getIsSorted()} />
                      </Button>
                    )
                  }

                  return <TableHead key={header.id}>{content}</TableHead>
                })}
              </TableRow>
            )
          })}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            return (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
