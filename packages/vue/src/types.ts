import type { ListProps } from '../../../shared'

// Vue adds no props of its own: `filters` is a v-model and the callbacks are emits (`Events`).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ListPropsVue<T = unknown> extends ListProps<T> {}
