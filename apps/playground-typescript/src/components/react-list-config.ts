import type {
  ListProviderConfig,
  SavedListState,
  StateManagerContext,
} from '@7span/react-list-types';

import requestHandler from '../api/request-handler';
import type { Skill } from '../types/skill';

function stateManagerKey(endpoint: string, version?: number | string): string {
  return `react-list--${endpoint}--${version}`;
}

const reactListConfig: ListProviderConfig<Skill> = {
  stateManager: {
    init(context: StateManagerContext) {
      const { endpoint, version } = context;
      const allKeys = `react-list--${endpoint}--`;
      const latestKey = stateManagerKey(endpoint, version);
      const staleKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith(allKeys) && key !== latestKey
      );
      staleKeys.forEach((key) => localStorage.removeItem(key));
    },

    set(context: StateManagerContext) {
      const {
        endpoint,
        version,
        search,
        page,
        perPage,
        sortBy,
        sortOrder,
        filters,
        attrSettings,
      } = context;
      const key = stateManagerKey(endpoint, version);
      localStorage.setItem(
        key,
        JSON.stringify({
          search,
          page,
          perPage,
          sortBy,
          sortOrder,
          filters,
          attrSettings,
        })
      );
    },

    get(context: StateManagerContext): SavedListState | null {
      const { endpoint, version } = context;
      const key = stateManagerKey(endpoint, version);

      try {
        const saved = localStorage.getItem(key);
        return saved ? (JSON.parse(saved) as SavedListState) : null;
      } catch {
        return null;
      }
    },
  },

  requestHandler,
};

export default reactListConfig;
