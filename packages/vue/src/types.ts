import type { ListOptions, ListProviderConfig, ListResponse } from '../../../shared'

type OmittedListOptions = 'onResponse' | 'afterPageChange' | 'afterLoadMore'

/** Props for the VueList root component. */
export interface VueListProps<T = Record<string, unknown>>
  extends Omit<ListOptions<T>, OmittedListOptions>,
    ListProviderConfig<T> {}

/** Emits for the VueList root component. */
export interface VueListEmits<T = Record<string, unknown>> {
  onResponse: [response: ListResponse<T>]
  afterPageChange: [response: ListResponse<T>]
  afterLoadMore: [response: ListResponse<T>]
  onItemSelect: [selection: T[], previous: T[]]
}
