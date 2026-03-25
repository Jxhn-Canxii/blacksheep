import type { PostgrestResponse } from '@supabase/postgrest-js';

type QueryResult<T> = Promise<PostgrestResponse<T>> | PostgrestResponse<T>;

// Generic SWR helper for supabase query promises.
// Usage: `useSWR(query, supabaseFetcher)`
export const supabaseFetcher = async <T = unknown>(query: QueryResult<T>): Promise<T> => {
  const res = await query;
  if (res.error) throw res.error;
  return res.data as T;
};
