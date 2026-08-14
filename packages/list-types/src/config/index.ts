import type { SavedListState, StateManagerContext } from '../context';
import type { RequestHandler } from '../response';
import type { ListState } from '../state';

/** Optional persistence layer for list UI state. */
export interface StateManager {
  init?: (context: StateManagerContext) => void;
  get?: (context: StateManagerContext) => SavedListState | null;
  set?: (context: StateManagerContext) => void;
}

/** Configuration for list data fetching and optional state persistence. */
export interface ListProviderConfig<T = unknown> {
  requestHandler: RequestHandler<T>;
  stateManager?: StateManager;
}

/** Context value provided by a list instance to its child components. */
export interface ListInstanceContext<T = unknown> {
  listState: ListState<T>;
}
