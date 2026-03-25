/**
 * apiLogger — axios-based HTTP client with structured console instrumentation.
 *
 * Wraps axios GET/POST/DELETE calls to Next.js API routes and logs:
 *   - Pre-call:  method, url, params/data, timestamp
 *   - Post-call: method, url, status, durationMs, timestamp
 *   - On error:  method, url, error details, durationMs, timestamp
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiLogMeta {
  /** HTTP method label for the log (inferred from the call if omitted) */
  label?: string;
}

type ApiResponse<T> = AxiosResponse<T>;

function log(obj: Record<string, unknown>) {
  console.log('[api]', obj);
}

function logError(obj: Record<string, unknown>) {
  console.error('[api:error]', obj);
}

export async function apiGet<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  meta?: ApiLogMeta
): Promise<T> {
  const label = meta?.label ?? 'GET';
  const timestamp = new Date().toISOString();
  log({ method: label, url, params: config?.params, timestamp });

  const start = Date.now();
  try {
    const res: ApiResponse<T> = await axios.get<T>(url, config);
    const durationMs = Date.now() - start;
    log({ method: label, url, status: res.status, durationMs, timestamp: new Date().toISOString() });
    return res.data;
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = axios.isAxiosError(err) ? err.message : String(err);
    logError({ method: label, url, status, message, durationMs, timestamp: new Date().toISOString() });
    throw err;
  }
}

export async function apiPost<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
  meta?: ApiLogMeta
): Promise<T> {
  const label = meta?.label ?? 'POST';
  const timestamp = new Date().toISOString();
  log({ method: label, url, data, timestamp });

  const start = Date.now();
  try {
    const res: ApiResponse<T> = await axios.post<T>(url, data, config);
    const durationMs = Date.now() - start;
    log({ method: label, url, status: res.status, durationMs, timestamp: new Date().toISOString() });
    return res.data;
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = axios.isAxiosError(err) ? err.message : String(err);
    logError({ method: label, url, status, message, durationMs, timestamp: new Date().toISOString() });
    throw err;
  }
}

export async function apiDelete<T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  meta?: ApiLogMeta
): Promise<T> {
  const label = meta?.label ?? 'DELETE';
  const timestamp = new Date().toISOString();
  log({ method: label, url, params: config?.params, timestamp });

  const start = Date.now();
  try {
    const res: ApiResponse<T> = await axios.delete<T>(url, config);
    const durationMs = Date.now() - start;
    log({ method: label, url, status: res.status, durationMs, timestamp: new Date().toISOString() });
    return res.data;
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = axios.isAxiosError(err) ? err.message : String(err);
    logError({ method: label, url, status, message, durationMs, timestamp: new Date().toISOString() });
    throw err;
  }
}
