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

export type ListColumnsProps = {
  /** Replaces the whole list of columns. Gets `{ context, setColumn }`. */
  children?: ReactNode | ((scope: ColumnsScope) => ReactNode)
  /** Renders one column. Gets `{ context, name, label, visibility, ...your keys, setValue }`. */
  column?: (scope: ColumnScope) => ReactNode
}

export type ListEmptyProps = {
  children?: ReactNode
}

export type ListErrorProps = {
  children?: ReactNode | ((scope: ListScope) => ReactNode)
}

export type ListFiltersProps = {
  /** Replaces the whole set of filters. Gets `{ context, setFilter, setFilters }`. */
  children?: ReactNode | ((scope: FiltersScope) => ReactNode)
  /** Renders one filter. Gets `{ context, column, value, isDirty, setValue }`. */
  filter?: (scope: FilterScope) => ReactNode
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
  children?: ReactNode | ((scope: PaginationScope) => ReactNode)
}

// SLOT
type SlotChildren<Scope> = ReactNode | ((scope: Scope) => ReactNode)

export type SlotProps<Scope> = {
  /** The outer wrapper class, e.g. `shilp-list__pagination`. */
  className: string
  /** Scope passed to a render-prop `children`, and available to `fallback`. */
  scope: Scope
  /** Consumer override: a render function, or static nodes. */
  children?: SlotChildren<Scope>
  /** The built-in UI, rendered only when `children` is not provided. */
  fallback: (scope: Scope) => ReactNode
}
