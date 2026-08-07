import type { ListOptions, ListProviderConfig, ListResponse } from '@7span/list-types'

type OmittedListOptions = 'onResponse' | 'afterPageChange' | 'afterLoadMore'

/** Props for the VueList root component. */
export interface VueListProps<T = unknown>
  extends Omit<ListOptions<T>, OmittedListOptions>,
    ListProviderConfig<T> {
  hasPaginationHistory?: boolean
  syncPageToUrl?: boolean
}

/** Emits for the VueList root component. */
export interface VueListEmits<T = unknown> {
  onResponse: [response: ListResponse<T>]
  afterPageChange: [response: ListResponse<T>]
  afterLoadMore: [response: ListResponse<T>]
  onItemSelect: [selection: T[], previous: T[]]
}
