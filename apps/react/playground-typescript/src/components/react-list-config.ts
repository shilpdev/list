import type {
  Filters,
  ListProviderConfig,
  SavedListState,
  SortOrder,
  StateManagerContext,
} from '@7span/list-types';

import requestHandler from '../api/request-handler';
import type { Skill } from '../types/skill';

const LIST_PARAM_KEYS = [
  'page',
  'perPage',
  'search',
  'sortBy',
  'sortOrder',
] as const;

const LIST_PARAM_KEY_SET = new Set<string>(LIST_PARAM_KEYS);

function stateManagerKey(endpoint: string, version?: number | string): string {
  return `react-list--${endpoint}--${version}`;
}

function isEmptyValue(value: unknown): boolean {
  return value == null || value === '';
}

function serializeParamValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function parseParamValue(raw: string): unknown {
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

function parseNumber(raw: string | null): number | undefined {
  if (raw == null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export function getStateFromSearchParams(): SavedListState | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const state: SavedListState = {};

  const page = parseNumber(params.get('page'));
  if (page != null) state.page = page;

  const perPage = parseNumber(params.get('perPage'));
  if (perPage != null) state.perPage = perPage;

  const search = params.get('search');
  if (search) state.search = search;

  const sortBy = params.get('sortBy');
  if (sortBy) state.sortBy = sortBy;

  const sortOrder = params.get('sortOrder');
  if (sortOrder === 'asc' || sortOrder === 'desc' || sortOrder === '') {
    state.sortOrder = sortOrder;
  }

  const filters: Filters = {};
  for (const [key, value] of params.entries()) {
    if (LIST_PARAM_KEY_SET.has(key)) continue;
    filters[key] = parseParamValue(value);
  }
  if (Object.keys(filters).length > 0) state.filters = filters;

  return Object.keys(state).length > 0 ? state : null;
}

function setStateInSearchParams(state: {
  page: number;
  perPage: number;
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
  filters: Filters;
}): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  params.set('page', String(state.page));
  params.set('perPage', String(state.perPage));

  if (isEmptyValue(state.search)) params.delete('search');
  else params.set('search', state.search);

  if (isEmptyValue(state.sortBy)) {
    params.delete('sortBy');
    params.delete('sortOrder');
  } else {
    params.set('sortBy', state.sortBy);
    if (isEmptyValue(state.sortOrder)) params.delete('sortOrder');
    else params.set('sortOrder', state.sortOrder);
  }

  const nextFilterKeys = new Set(
    Object.entries(state.filters)
      .filter(([, value]) => !isEmptyValue(value))
      .map(([key]) => key),
  );

  for (const key of [...params.keys()]) {
    if (!LIST_PARAM_KEY_SET.has(key) && !nextFilterKeys.has(key)) {
      params.delete(key);
    }
  }

  for (const [key, value] of Object.entries(state.filters)) {
    if (LIST_PARAM_KEY_SET.has(key) || isEmptyValue(value)) continue;
    params.set(key, serializeParamValue(value));
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) return;

  window.history.pushState({}, '', url);
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
      setStateInSearchParams({
        page,
        perPage,
        search,
        sortBy,
        sortOrder,
        filters,
      });
    },

    get(context: StateManagerContext): SavedListState | null {
      const { endpoint, version } = context;
      const key = stateManagerKey(endpoint, version);
      const urlState = getStateFromSearchParams();

      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? (JSON.parse(saved) as SavedListState) : null;

        if (urlState == null && parsed == null) return null;

        return {
          ...parsed,
          ...urlState,
        };
      } catch {
        return urlState;
      }
    },
  },

  requestHandler,
};

export default reactListConfig;
