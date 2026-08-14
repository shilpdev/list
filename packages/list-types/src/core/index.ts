/** Sort direction used by list queries. */
export type SortOrder = 'asc' | 'desc' | '';

/** How the list loads additional pages. */
export type PaginationMode = 'pagination' | 'loadMore';

/** Arbitrary metadata passed through list configuration and API responses. */
export type MetaRecord = Record<string, unknown>;

/** Dynamic filter values applied to a list query. */
export type Filters = Record<string, unknown>;

/** Filter value shape used by some APIs (e.g. Directus-style operators). */
export type FilterOperatorValue = Record<string, unknown>;
