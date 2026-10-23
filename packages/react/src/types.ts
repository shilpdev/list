import type { Context, EventProps, Filter, ListProps } from '@shared'
import type { ReactNode, Ref } from 'react'

// The callbacks are props (`EventProps`), so React adds `filters`, `children` and `ref`.
export interface ListPropsReact<T = unknown> extends ListProps<T>, EventProps<T> {
  /** Initial filters, one per column. Read once at setup; change them later with `ListFilters`. */
  filters?: Filter[]
  children?: ReactNode | ((context: Context<T>) => ReactNode)
  /** React 19 ref-as-prop; exposes the list context as an imperative API. */
  ref?: Ref<Context<T>>
}
