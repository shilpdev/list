import type { ListOptions, ListProviderConfig, ListResponse } from '@7span/list-types'

type OmittedListOptions = 'onResponse' | 'afterPageChange' | 'afterLoadMore'

/** Props for the Vue List root component. */
export interface ListProps<T = unknown>
  extends Omit<ListOptions<T>, OmittedListOptions>,
    ListProviderConfig<T> {
  hasPaginationHistory?: boolean
  syncPageToUrl?: boolean
}

/** Emits for the Vue List root component. */
export interface ListEmits<T = unknown> {
  onResponse: [response: ListResponse<T>]
  afterPageChange: [response: ListResponse<T>]
  afterLoadMore: [response: ListResponse<T>]
  onItemSelect: [selection: T[], previous: T[]]
}
