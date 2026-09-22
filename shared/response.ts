import type { MetaRecord } from './core';
import type { RequestContext } from './context';

/** Standard shape returned by `requestHandler`. */
export interface ListResponse<T = Record<string, unknown>> {
  items: T[];
  count: number;
  meta?: MetaRecord;
}

/** Async function responsible for fetching list data. */
export type RequestHandler<T = Record<string, unknown>> = (
  context: RequestContext
) => Promise<ListResponse<T>>;
