import type { Filters, MetaRecord, PaginationMode, SortOrder } from '../core';
import type { AttrSettings, ListAttribute, UpdateAttrFn } from '../attributes';
import type { ListProviderConfig, StateManager } from '../config';
import type { RequestContextPatch } from '../context';
import type { ListOptions } from '../options';
import type { RequestHandler, ListResponse } from '../response';
import type {
  AttributesScope,
  ErrorScope,
  GoToScope,
  InitialLoaderScope,
  LoadMoreScope,
  LoaderScope,
  PaginationScope,
  PerPageScope,
  RefreshScope,
  SearchScope,
  SummaryScope,
} from '../scopes';

export interface VueRef<T> {
  value: T;
}

export interface VueListPluginOptions<T = unknown> extends ListProviderConfig<T> {
  componentPrefix?: string;
}

export interface VueListGlobalOptions<T = unknown> extends VueListPluginOptions<T> {
  componentPrefix: string;
  requestHandler: RequestHandler<T>;
  stateManager: StateManager;
}

export interface VueListApp {
  provide(key: string | symbol, value: unknown): void;
  component(name: string, component: unknown): void;
}

export interface VueListPlugin {
  install(app: VueListApp, options?: VueListPluginOptions): void;
}

export type VueListInjectKeyGlobal = 'vueList';

export type VueListOmittedListOptions = 'onResponse' | 'afterPageChange' | 'afterLoadMore';

export interface VueListProps<T = unknown> extends Omit<ListOptions<T>, VueListOmittedListOptions> {
  endpoint: string;
  requestHandler?: RequestHandler<T>;
  hasPaginationHistory?: boolean;
}

export interface VueListPropDefaults {
  page: number;
  perPage: number;
  sortOrder: SortOrder;
  version: number | string;
  hasPaginationHistory: boolean;
  paginationMode: PaginationMode;
  meta: MetaRecord;
  filters: Filters | undefined;
}

export interface VueListEmits<T = unknown> {
  onResponse: [response: ListResponse<T>];
  afterPageChange: [response: ListResponse<T>];
  afterLoadMore: [response: ListResponse<T>];
  onItemSelect: [selection: T[], previous: T[]];
}

export interface VueListRequestContext extends RequestContextPatch {
  attrSettings?: AttrSettings;
}

export type VueListInjectKey =
  | 'vueList'
  | 'attrSettings'
  | 'items'
  | 'count'
  | 'error'
  | 'localSortBy'
  | 'localSortOrder'
  | 'localPage'
  | 'localPerPage'
  | 'isLoading'
  | 'localSearch'
  | 'selection'
  | 'confirmedPage'
  | 'paginationMode'
  | 'initializingState'
  | 'isInitialLoading'
  | 'attrs'
  | 'setSearch'
  | 'setSort'
  | 'setSelection'
  | 'setItems'
  | 'setPage'
  | 'setPerPage'
  | 'updateAttr'
  | 'loadMore'
  | 'refresh';

export type VueListSetSort = (sort: {
  by: string;
  order: SortOrder;
}) => void;

export type VueListSetPage = (page: number, context?: RequestContextPatch) => void;
export type VueListSetItems<T = unknown> = (response: ListResponse<T>) => void;
export type VueListRefresh = (context?: RequestContextPatch) => void;

export interface VueListInjectionMap<T = unknown> {
  vueList: VueListGlobalOptions<T>;
  attrSettings: VueRef<AttrSettings | undefined>;
  items: VueRef<T[]>;
  count: VueRef<number>;
  error: VueRef<false | unknown>;
  localSortBy: VueRef<string | undefined>;
  localSortOrder: VueRef<SortOrder | undefined>;
  localPage: VueRef<number>;
  localPerPage: VueRef<number>;
  isLoading: VueRef<boolean>;
  localSearch: VueRef<string | undefined>;
  selection: VueRef<T[]>;
  confirmedPage: VueRef<number | undefined>;
  paginationMode: PaginationMode;
  initializingState: VueRef<boolean>;
  isInitialLoading: VueRef<boolean>;
  attrs: VueRef<ListAttribute[]>;
  setSearch: (search: string) => void;
  setSort: VueListSetSort;
  setSelection: (selection: T[]) => void;
  setItems: VueListSetItems<T>;
  setPage: VueListSetPage;
  setPerPage: (perPage: number) => void;
  updateAttr: UpdateAttrFn;
  loadMore: () => void;
  refresh: VueListRefresh;
}

export interface VueListRestoredState {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  attrSettings?: AttrSettings;
  filters?: Filters;
}

export interface VueListRootScope<T = unknown> {
  items: T[];
  count: number;
  response: ListResponse<T> | undefined;
  isLoading: boolean;
  isInitialLoading: boolean;
  selection: T[];
  error: false | unknown;
  serializedAttrs: ListAttribute[];
  isEmpty: boolean;
  context: VueListRequestContext & {
    meta?: MetaRecord;
    filters?: Filters;
  };
  refresh: VueListRefresh;
}

export type VueListAttributesScope = AttributesScope;

export interface VueListAttributesLegacyScope {
  attrs: ListAttribute[];
  settings: AttrSettings | undefined;
  update: UpdateAttrFn;
}

export interface VueListAttributeSlotProps {
  update: UpdateAttrFn;
  attr: ListAttribute;
}

export interface VueListPaginationPageSlotProps extends PaginationScope {
  page: number;
  isActive: boolean;
}

export type VueListSearchScope = SearchScope;
export type VueListSummaryScope = SummaryScope;
export type VueListPaginationScope = PaginationScope;
export type VueListGoToScope = GoToScope;
export type VueListPerPageScope = PerPageScope;
export type VueListRefreshScope = RefreshScope;
export type VueListLoaderScope = LoaderScope;
export type VueListInitialLoaderScope = InitialLoaderScope;
export type VueListErrorScope = Omit<ErrorScope, 'error'> & {
  error: false | unknown;
};
export type VueListLoadMoreScope = LoadMoreScope;

export interface VueListItemsScope<T = unknown> {
  items: T[];
  isInitialLoading?: boolean;
}

export interface VueListExpose<T = unknown> {
  items: VueRef<T[]>;
  response: VueRef<ListResponse<T> | undefined>;
  isLoading: VueRef<boolean>;
  error: VueRef<false | unknown>;
  count: VueRef<number>;
  selection: VueRef<T[]>;
  setPage: VueListSetPage;
  setPerPage: (perPage: number) => void;
  setSort: VueListSetSort;
  setSearch: (search: string) => void;
  setSelection: (selection: T[]) => void;
  refresh: VueListRefresh;
  loadMore: () => void;
}

export const VUE_LIST_INJECT_KEY = 'vueList' as const;
