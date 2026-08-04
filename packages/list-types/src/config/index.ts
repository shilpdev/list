import type { SavedListState, StateManagerContext } from '../context';
import type { RequestHandler } from '../response';
import type { ListState } from '../state';

/** Optional persistence layer for list UI state. */
export interface StateManager {
  init?: (context: StateManagerContext) => void;
  get?: (context: StateManagerContext) => SavedListState | null;
  set?: (context: StateManagerContext) => void;
}

/** Configuration passed to the list provider / plugin setup. */
export interface ListProviderConfig<T = unknown> {
  requestHandler: RequestHandler<T>;
  stateManager?: StateManager;
}

/** Internal provider context value shared across list instances. */
export interface ListProviderContextValue<T = unknown> {
  requestHandler: RequestHandler<T>;
  stateManager?: StateManager;
  listState: ListState<T>;
  setListState: (state: ListState<T>) => void;
}

/** Context value provided by a list instance to its child components. */
export interface ListInstanceContext<T = unknown> {
  listState: ListState<T>;
}
