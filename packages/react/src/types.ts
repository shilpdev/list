import type {
  ColumnScope,
  ColumnsScope,
  Context,
  EventProps,
  Filter,
  FilterScope,
  FiltersScope,
  GoToScope,
  ListPropsBase,
  ListScope,
  PaginationItemScope,
  PaginationProps,
  PaginationScope,
  PerPageProps,
  PerPageScope,
  RowScope,
  SearchProps,
  SearchScope,
  SummaryScope,
} from '@shared'
import type { ReactNode, Ref } from 'react'

// The callbacks are props (`EventProps`), so React adds `filters`, `children` and `ref`.
export interface ListProps<T = unknown> extends ListPropsBase<T>, EventProps<T> {
  /** Initial filters, one per column. Read once at setup; change them later with `ListFilters`. */
  filters?: Filter[]
  children?: ReactNode | ((context: Context<T>) => ReactNode)
  /** React 19 ref-as-prop; exposes the list context as an imperative API. */
  ref?: Ref<Context<T>>
}

type ColumnsSlot = (scope: ColumnsScope) => ReactNode
type ColumnSlot = (scope: ColumnScope) => ReactNode

// `children` is the whole control (the Vue default slot). The index signature holds one render prop
// per column, named after it (the Vue slot of the same name), so it also has to allow the type of
// `children`. Give such a render prop its scope type: `id={(scope: ColumnScope) => ...}`. A column
// called `children` clashes.
export interface ListColumnsProps {
  /** Replaces the whole control. Gets `{ context, setColumn }`. */
  children?: ReactNode | ColumnsSlot
  [column: string]: ColumnSlot | ColumnsSlot | ReactNode | undefined
}

export type ListEmptyProps = {
  children?: ReactNode
}

export type ListErrorProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

type FiltersSlot = (scope: FiltersScope) => ReactNode
type FilterSlot = (scope: FilterScope) => ReactNode

// Same as `ListColumnsProps`: `children` is the whole control, and one render prop per filter is
// named after its column (`status={(scope: FilterScope) => ...}`).
export interface ListFiltersProps {
  /** Replaces the whole control. Gets `{ context, setFilter, setFilters }`. */
  children?: ReactNode | FiltersSlot
  [column: string]: FilterSlot | FiltersSlot | ReactNode | undefined
}

export type ListGoToProps = {
  children?: ReactNode | ((scope: GoToScope) => ReactNode)
}

export type ListLoadMoreProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export type ListLoaderInitialProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export type ListLoaderProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export type ListPerPageProps = PerPageProps & {
  children?: ReactNode | ((scope: PerPageScope) => ReactNode)
}

export type ListRefreshProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export type ListRowsProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
  row?: (args: RowScope) => ReactNode
}

export type ListSearchProps = SearchProps & {
  children?: ReactNode | ((scope: SearchScope) => ReactNode)
}

export type ListSummaryProps = {
  children?: ReactNode | ((scope: SummaryScope) => ReactNode)
}

export type ListPaginationProps = PaginationProps & {
  /** Replaces the whole control. Gets the pagination scope. */
  children?: ReactNode | ((scope: PaginationScope) => ReactNode)
  /** Replaces the First button. */
  first?: (scope: PaginationScope) => ReactNode
  /** Replaces the Prev button. */
  prev?: (scope: PaginationScope) => ReactNode
  /** Replaces all the page buttons. */
  pages?: (scope: PaginationScope) => ReactNode
  /** Renders one page button. Gets the pagination scope plus `page` and `isActive`. */
  page?: (scope: PaginationItemScope) => ReactNode
  /** Replaces the Next button. */
  next?: (scope: PaginationScope) => ReactNode
  /** Replaces the Last button. */
  last?: (scope: PaginationScope) => ReactNode
}

// SLOT
type SlotChildren<Scope> = ReactNode | ((scope: Scope) => ReactNode)

export type SlotProps<Scope> = {
  /** The outer wrapper class, e.g. `shilp-list__pagination`. Leave it out for a nested slot, which renders no wrapper. */
  className?: string
  /** Scope passed to a render-prop `children`, and available to `fallback`. */
  scope: Scope
  /** Consumer override: a render function, or static nodes. */
  children?: SlotChildren<Scope>
  /** The built-in UI, rendered only when `children` is not provided. */
  fallback: (scope: Scope) => ReactNode
}
